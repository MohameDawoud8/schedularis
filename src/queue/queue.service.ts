// src/queue/queue.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Job } from '../jobs/entities/job.entity';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('jobs') private jobsQueue: Queue) {}

  async addJob(job: Job): Promise<void> {
    try {
      await this.jobsQueue.add('process', job, {
        priority: job.priority,
        delay: job.nextRun.getTime() - Date.now(),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      this.logger.log(`Job ${job.id} added to queue`);
    } catch (error) {
      this.logger.error(
        `Failed to add job ${job.id} to queue: ${error.message}`,
      );
      throw error;
    }
  }
}
