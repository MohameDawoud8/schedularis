import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobRepository } from './repositories/job.repository';
import { ConfigService } from '../config/config.service';

@Injectable()
export class JobUnlockService {
  private readonly logger = new Logger(JobUnlockService.name);

  constructor(
    private jobRepository: JobRepository,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async unlockStuckJobs() {
    const lockTimeout = this.configService.jobLockTimeout;

    try {
      const unlockedCount =
        await this.jobRepository.unlockStuckJobs(lockTimeout);
      if (unlockedCount > 0) {
        this.logger.log(`Unlocked ${unlockedCount} stuck job(s)`);
      } else {
        this.logger.debug('No stuck jobs found');
      }
    } catch (error) {
      this.logger.error(`Error unlocking stuck jobs: ${error.message}`);
    }
  }
}
