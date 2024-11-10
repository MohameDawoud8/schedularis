import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Job } from './entities/job.entity';
import { JobRepository } from './repositories/job.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { EmailJob } from './email-job';
import { ProcessingJob } from './processing-job';
import { BaseJob } from './base-job';
import { QueueService } from '../queue/queue.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import * as cronParser from 'cron-parser';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private jobRepository: JobRepository,
    private queueService: QueueService,
    private monitoringService: MonitoringService,
  ) {}

  async findAll(): Promise<Job[]> {
    return this.jobRepository.findAll();
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async create(createJobDto: CreateJobDto): Promise<Job> {
    try {
      if (createJobDto.cronSchedule) {
        cronParser.parseExpression(createJobDto.cronSchedule);
      }

      const now = new Date();
      const job = await this.jobRepository.create({
        ...createJobDto,
        status: 'pending',
        nextRun: now,
        version: 1,
        recurring: !!createJobDto.cronSchedule,
      });

      const jobInstance = this.createJobInstance(job);
      job.nextRun = jobInstance.getNextRunTime() || now;

      const savedJob = await this.jobRepository.update(job.id, {
        nextRun: job.nextRun,
      });

      // await this.queueService.addJob(savedJob);

      this.logger.log(`Created new job: ${JSON.stringify(savedJob)}`);
      return savedJob;
    } catch (error) {
      this.logger.error(`Failed to create job: ${error.message}`);
      throw error;
    }
  }

  async getOverdueJobs(): Promise<Job[]> {
    return this.jobRepository.getOverdueJobs();
  }

  async getJobsDueForExecution(limit: number = 10): Promise<Job[]> {
    this.logger.log(`Fetching jobs due for execution (limit: ${limit})`);
    try {
      const jobs = await this.jobRepository.getJobsDueForExecution(limit);
      this.logger.log(`Found ${jobs.length} jobs due for execution`);
      return jobs;
    } catch (error) {
      this.logger.error(
        `Error fetching jobs due for execution: ${error.message}`,
      );
      throw error;
    }
  }
  async update(id: number, updateJobDto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);
    Object.assign(job, updateJobDto);
    const jobInstance = this.createJobInstance(job);
    job.nextRun = jobInstance.getNextRunTime() || new Date();
    const updatedJob = await this.jobRepository.update(id, job);
    await this.queueService.addJob(updatedJob);
    return updatedJob;
  }

  async delete(id: number): Promise<void> {
    await this.jobRepository.delete(id);
  }

  async updateJobStatus(id: number, status: string): Promise<Job> {
    const updatedJob = await this.jobRepository.update(id, { status });
    this.monitoringService.log('info', `Updated job status`, {
      jobId: id,
      status: status,
    });
    return updatedJob;
  }

  async incrementRetryCount(id: number): Promise<Job> {
    const job = await this.findOne(id);
    const updatedJob = await this.jobRepository.update(id, {
      retryCount: job.retryCount + 1,
    });
    this.monitoringService.log('info', `Incremented retry count`, {
      jobId: id,
      retryCount: updatedJob.retryCount,
    });
    return updatedJob;
  }

  async updateLastError(id: number, error: string): Promise<Job> {
    const job = await this.findOne(id);
    const updatedJob = await this.jobRepository.update(id, {
      lastError: error,
      failureCount: job.failureCount + 1,
    });
    this.monitoringService.log('info', `Updated last error`, {
      jobId: id,
      error: error,
      failureCount: updatedJob.failureCount,
    });
    return updatedJob;
  }

  async lockJob(id: number): Promise<boolean> {
    const locked = await this.jobRepository.lockJob(id);
    this.monitoringService.log('info', `Attempted to lock job`, {
      jobId: id,
      locked: locked,
    });
    return locked;
  }

  async updateLastRun(id: number): Promise<void> {
    const now = new Date();
    await this.jobRepository.update(id, { lastRun: now });
    this.monitoringService.log('info', `Updated last run time`, {
      jobId: id,
      lastRun: now,
    });
  }

  createJobInstance(job: Job): BaseJob {
    switch (job.type) {
      case 'email':
        return new EmailJob(job);
      case 'processing':
        return new ProcessingJob(job);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  async handleJobCompletion(
    id: number,
    result: { success: boolean; error?: string },
  ) {
    const job = await this.findOne(id);

    if (result.success) {
      await this.handleSuccessfulJob(job);
    } else {
      await this.handleFailedJob(job, result.error);
    }

    await this.unlockJob(id);
  }

  private async handleSuccessfulJob(job: Job) {
    await this.updateJobStatus(job.id, job.recurring ? 'pending' : 'completed');
    await this.updateLastRun(job.id);
    if (job.recurring) {
      await this.updateNextRun(job.id);
    }
    this.monitoringService.incrementJobsSuccess();
    this.logger.log(`✅ Job ${job.id} completed successfully`);
  }

  private async handleFailedJob(job: Job, errorMessage: string) {
    this.logger.error(`❌ Error executing job ${job.id}: ${errorMessage}`);

    if (job.retryCount < job.maxRetries) {
      await this.incrementRetryCount(job.id);
      await this.updateJobStatus(job.id, 'pending');
      await this.updateNextRun(job.id);
      this.logger.log(`⚠️ Job ${job.id} scheduled for retry`);
    } else {
      await this.updateJobStatus(job.id, 'failed');
      this.logger.log(`❌ Job ${job.id} failed after max retries`);
    }

    await this.updateLastError(job.id, errorMessage);
    this.monitoringService.incrementJobsFailed();
  }

  async updateNextRun(id: number): Promise<void> {
    const job = await this.findOne(id);
    if (job.recurring && job.cronSchedule) {
      const nextRun = cronParser
        .parseExpression(job.cronSchedule)
        .next()
        .toDate();
      await this.jobRepository.update(id, { nextRun });
      this.logger.log(`Next run for job ${id} updated to ${nextRun}`);
    }
  }

  async unlockJob(id: number): Promise<void> {
    await this.jobRepository.update(id, { isLocked: false, lockedAt: null });
    this.logger.log(`Job ${id} unlocked`);
  }

  async finalizeJob(id: number, result: any): Promise<void> {
    const job = await this.findOne(id);
    if (job.recurring) {
      await this.updateJobStatus(id, 'pending');
      await this.updateNextRun(id);
    } else {
      await this.updateJobStatus(id, 'completed');
    }
    await this.updateLastRun(id);
    await this.unlockJob(id);
    this.monitoringService.log('info', `Job ${id} finalized`, { result });
    this.logger.log(`✅ Job ${id} completed successfully`);
  }
}
