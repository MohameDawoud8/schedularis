// src/jobs/job.processor.ts

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobService } from './job.service';

@Processor('jobs')
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(private readonly jobService: JobService) {}

  @Process('process')
  async processJob(job: Job<any>) {
    this.logger.log(`Processing job ${job.data.id}`);
    try {
      const jobInstance = this.jobService.createJobInstance(job.data);
      await jobInstance.run();
      this.logger.log(`Job ${job.data.id} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.data.id}: ${error.message}`,
      );
      throw error; // Rethrow to trigger Bull's retry mechanism
    }
  }
}
