import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { JobHistory } from './job-history.entity';

@Entity('jobs')
@Index(['status', 'nextRun', 'isLocked'])
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'boolean', default: false })
  recurring: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  priority: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ default: null, nullable: true })
  lastError: string;

  @Column({ default: 'pending' })
  @Index()
  status: string;

  @Column({ nullable: true })
  cronSchedule: string;

  @Column({ type: 'timestamp', nullable: true })
  lastRun: Date;

  @Index()
  @Column({ type: 'timestamp' })
  nextRun: Date;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  concurrency: number;

  @Column({ default: false })
  @Index()
  isLocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => JobHistory, (history) => history.job)
  history: JobHistory[];
}
