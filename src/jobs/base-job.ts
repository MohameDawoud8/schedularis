import { Job } from './entities/job.entity';
import * as cronParser from 'cron-parser';

export abstract class BaseJob {
  protected job: Job;

  constructor(job: Job) {
    this.job = job;
  }

  abstract execute(): Promise<void>;

  async run(): Promise<void> {
    try {
      await this.execute();
      this.job.status = this.job.recurring ? 'pending' : 'completed';
    } catch (error) {
      this.job.status = 'failed';
      this.job.lastError = error.message;
      this.job.failureCount++;
    }
  }

  getNextRunTime(): Date | null {
    if (this.job.recurring && this.job.cronSchedule) {
      const interval = cronParser.parseExpression(this.job.cronSchedule);
      return interval.next().toDate();
    }
    return null;
  }
}
