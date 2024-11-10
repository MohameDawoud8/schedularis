import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker } from 'worker_threads';
import { ConfigService } from '../config/config.service';
import { JobService } from '../jobs/job.service';
import { ExecutorService } from '../executor/executor.service';
import * as path from 'path';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private configService: ConfigService,
    private jobService: JobService,
    private executorService: ExecutorService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing SchedulerService');
    this.startSchedulerWorker();
  }

  async onModuleDestroy() {
    await this.stopSchedulerWorker();
  }

  private startSchedulerWorker() {
    this.worker = new Worker(path.join(__dirname, 'scheduler.worker.js'), {
      workerData: {
        checkInterval: this.configService.schedulerCheckInterval,
      },
    });

    this.worker.on('message', async (message) => {
      if (message.type === 'checkJobs') {
        this.logger.log('Received checkJobs message from worker');
        await this.checkAndExecuteJobs();
      }
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Scheduler worker error: ${error.message}`);
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        this.logger.warn(`Scheduler worker stopped with exit code ${code}`);
        this.startSchedulerWorker();
      }
    });

    this.logger.log('Scheduler worker started');
  }

  private async stopSchedulerWorker() {
    if (this.worker) {
      await this.worker.terminate();
      this.logger.log('Scheduler worker stopped');
    }
  }

  private async checkAndExecuteJobs() {
    try {
      const jobs = await this.jobService.getJobsDueForExecution(
        this.configService.maxConcurrentJobs,
      );
      this.logger.log(`Found ${jobs.length} jobs due for execution`);

      for (const job of jobs) {
        this.logger.log(`Executing job ${job.id}`);
        await this.executorService.executeJob(job);
      }
    } catch (error) {
      this.logger.error(`Error checking and executing jobs: ${error.message}`);
    }
  }
}
