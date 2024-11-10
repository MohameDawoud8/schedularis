import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Worker } from 'worker_threads';
import { ConfigService } from '../config/config.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { JobService } from '../jobs/job.service';
import * as path from 'path';

interface WorkerTask {
  jobId: number;
  jobType: string;
  jobData: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

@Injectable()
export class WorkerPoolService implements OnModuleInit, OnModuleDestroy {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private readonly logger = new Logger(WorkerPoolService.name);

  constructor(
    private configService: ConfigService,
    private monitoringService: MonitoringService,
    private jobService: JobService,
  ) {}

  async onModuleInit() {
    const poolSize = this.configService.maxConcurrentJobs;
    for (let i = 0; i < poolSize; i++) {
      this.addNewWorker();
    }
    this.logger.log(`Worker pool initialized with ${poolSize} workers`);
  }

  async onModuleDestroy() {
    await this.gracefulShutdown();
  }

  private addNewWorker() {
    const workerPath = path.resolve(__dirname, 'job.worker.js');
    this.logger.log(`Creating new worker with path: ${workerPath}`);

    const worker = new Worker(workerPath);

    worker.on('message', async (message) => {
      if (message.type === 'log') {
        this.logger.log(`Worker Log: ${message.data}`);
      } else if (message.type === 'result') {
        this.monitoringService.incrementJobsProcessed('success');
        await this.finalizeJob(message.jobId, message.data);
        this.processNextTask(worker);
      }
    });

    worker.on('error', (error) => {
      this.logger.error(`Worker error: ${error.message}`);
      this.monitoringService.incrementJobsProcessed('failed');
      this.removeWorker(worker);
      this.addNewWorker();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.logger.warn(`Worker exited with code ${code}`);
        this.removeWorker(worker);
        this.addNewWorker();
      }
    });

    this.workers.push(worker);
    this.processNextTask(worker);
  }

  private removeWorker(worker: Worker) {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
  }

  async executeJob(jobId: number, jobType: string, jobData: any): Promise<any> {
    this.logger.log(`Preparing to execute job ${jobId} of type: ${jobType}`);
    return new Promise((resolve, reject) => {
      const task: WorkerTask = { jobId, jobType, jobData, resolve, reject };
      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  private processNextTask(worker?: Worker) {
    const availableWorker = worker || this.workers.find((w) => w['idle']);
    if (availableWorker && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      availableWorker['idle'] = false;
      availableWorker.postMessage({
        jobId: task.jobId,
        jobType: task.jobType,
        jobData: task.jobData,
      });

      availableWorker.once('message', (message) => {
        if (message.type === 'result') {
          availableWorker['idle'] = true;
          task.resolve(message.data);
          this.processNextTask(availableWorker);
        }
      });

      availableWorker.once('error', (error) => {
        availableWorker['idle'] = true;
        task.reject(error);
        this.processNextTask(availableWorker);
      });
    }
  }

  private async finalizeJob(jobId: number, result: any) {
    try {
      await this.jobService.finalizeJob(jobId, result);
    } catch (error) {
      this.logger.error(`Error finalizing job ${jobId}: ${error.message}`);
    }
  }

  private async gracefulShutdown() {
    this.logger.log('Initiating graceful shutdown of worker pool');
    const shutdownPromises = this.workers.map((worker) => {
      return new Promise<void>((resolve) => {
        worker.once('exit', () => resolve());
        worker.postMessage('shutdown');
      });
    });
    await Promise.all(shutdownPromises);
    this.logger.log('All workers have been shut down');
  }
}
