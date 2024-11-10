import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../jobs/entities/job.entity';
import { JobService } from '../jobs/job.service';
import { QueueService } from '../queue/queue.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { ConfigService } from '../config/config.service';
import { WorkerPoolService } from '../worker/worker-pool.service';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    private readonly jobService: JobService,
    private readonly queueService: QueueService,
    private readonly monitoringService: MonitoringService,
    private readonly configService: ConfigService,
    private readonly workerPoolService: WorkerPoolService,
  ) {}

  async executeJob(job: Job): Promise<void> {
    this.logger.log(`🔒 Attempting to lock job ${job.id}`);

    try {
      if (await this.jobService.lockJob(job.id)) {
        this.logger.log(`✅ Job ${job.id} locked successfully`);

        this.logger.log(`▶️ Starting execution of job ${job.id}`);

        try {
          const result = await this.workerPoolService.executeJob(
            job.id,
            job.type,
            job,
          );
          this.logger.log(`Job ${job.id} execution result:`, result);
          // Job finalization is now handled by WorkerPoolService
        } catch (error) {
          this.logger.error(
            `❌ Error during job ${job.id} execution: ${error.message}`,
          );
          await this.handleFailedJob(job, error.message);
        }
      } else {
        this.logger.warn(`⚠️ Failed to lock job ${job.id}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error in executeJob for job ${job.id}: ${error.message}`,
      );
    }
  }

  private async handleFailedJob(job: Job, errorMessage: string) {
    this.logger.error(`❌ Error executing job ${job.id}: ${errorMessage}`);

    if (job.retryCount < job.maxRetries) {
      await this.jobService.incrementRetryCount(job.id);
      await this.jobService.updateJobStatus(job.id, 'pending');
      await this.jobService.updateNextRun(job.id);
      this.logger.log(`⚠️ Job ${job.id} scheduled for retry`);
    } else {
      await this.jobService.updateJobStatus(job.id, 'failed');
      this.logger.log(`❌ Job ${job.id} failed after max retries`);
    }

    await this.jobService.updateLastError(job.id, errorMessage);
    this.monitoringService.incrementJobsFailed();
  }
}
