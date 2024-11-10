import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity('job_history')
export class JobHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  @Column({ type: 'text', nullable: true })
  result: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Job, (job) => job.history)
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column()
  jobId: number;
}
