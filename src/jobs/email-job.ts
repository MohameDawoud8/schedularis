import { Logger } from '@nestjs/common';
import { BaseJob } from './base-job';
import { Job } from './entities/job.entity';

export class EmailJob extends BaseJob {
  private readonly logger = new Logger(EmailJob.name);

  constructor(job: Job) {
    super(job);
  }

  async execute(): Promise<void> {
    this.logger.log(`Sending email: ${this.job.data.subject}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.logger.log(`Email sent: ${this.job.data.subject}`);
  }
}
