import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class QueueCleanupService {
  private readonly logger = new Logger(QueueCleanupService.name);

  constructor(@InjectQueue('jobs') private jobsQueue: Queue) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupCompletedJobs() {
    this.logger.log('Cleaning up completed jobs');
    await this.jobsQueue.clean(24 * 3600 * 1000, 'completed');
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanupFailedJobs() {
    this.logger.log('Cleaning up failed jobs');
    await this.jobsQueue.clean(7 * 24 * 3600 * 1000, 'failed');
  }
}
