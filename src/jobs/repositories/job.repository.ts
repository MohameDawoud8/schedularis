import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';

@Injectable()
export class JobRepository {
  private readonly logger = new Logger(JobRepository.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(job: Partial<Job>): Promise<Job> {
    const newJob = this.jobRepository.create(job);
    const savedJob = await this.jobRepository.save(newJob);
    return savedJob;
  }

  async findAll(): Promise<Job[]> {
    return this.jobRepository.find();
  }

  async findOne(id: number): Promise<Job | undefined> {
    return this.jobRepository.findOne({ where: { id } });
  }

  async update(id: number, job: Partial<Job>): Promise<Job> {
    await this.jobRepository.update(id, job);
    const updatedJob = await this.findOne(id);
    return updatedJob;
  }

  async delete(id: number): Promise<void> {
    await this.jobRepository.delete(id);
  }

  async getOverdueJobs(): Promise<Job[]> {
    const now = new Date();
    return this.jobRepository
      .createQueryBuilder('job')
      .where('job.nextRun <= :now', { now })
      .andWhere('job.status = :status', { status: 'pending' })
      .andWhere('job.isLocked = :isLocked', { isLocked: false })
      .orderBy('job.priority', 'DESC')
      .addOrderBy('job.nextRun', 'ASC')
      .getMany();
  }

  async getJobsDueForExecution(limit: number): Promise<Job[]> {
    const now = new Date();
    return this.jobRepository
      .createQueryBuilder('job')
      .where('(job.nextRun <= :now OR job.nextRun IS NULL)', { now })
      .andWhere('job.status = :status', { status: 'pending' })
      .andWhere('job.isLocked = :isLocked', { isLocked: false })
      .orderBy('job.priority', 'DESC')
      .addOrderBy('job.nextRun', 'ASC')
      .limit(limit)
      .getMany();
  }

  async lockJob(id: number): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({ isLocked: true, lockedAt: new Date() })
      .where('id = :id', { id })
      .andWhere('isLocked = :isLocked', { isLocked: false })
      .execute();

    return result.affected > 0;
    // return true;
  }

  async unlockJob(id: number): Promise<void> {
    await this.jobRepository.update(id, { isLocked: false, lockedAt: null });
  }

  async unlockStuckJobs(lockTimeout: number): Promise<number> {
    const result = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({ isLocked: false, lockedAt: null })
      .where('isLocked = :isLocked', { isLocked: true })
      .andWhere('lockedAt <= :timeoutThreshold', {
        timeoutThreshold: new Date(Date.now() - lockTimeout),
      })
      .execute();

    return result.affected || 0;
  }
}
