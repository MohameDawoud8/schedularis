import { Logger } from '@nestjs/common';
import { BaseJob } from './base-job';
import { Job } from './entities/job.entity';

export class ProcessingJob extends BaseJob {
  private readonly logger = new Logger(ProcessingJob.name);

  constructor(job: Job) {
    super(job);
  }

  async execute(): Promise<void> {
    this.logger.log(`Processing data: ${this.job.data.dataId}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.logger.log(`Data processed: ${this.job.data.dataId}`);
  }
}
