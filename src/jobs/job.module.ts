import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobRepository } from './repositories/job.repository';
import { Job } from './entities/job.entity';
import { JobHistory } from './entities/job-history.entity';
import { QueueModule } from '../queue/queue.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { JobUnlockService } from './job-unlock.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobHistory]),
    QueueModule,
    MonitoringModule,
    ConfigModule,
  ],
  providers: [JobService, JobRepository, JobUnlockService],
  controllers: [JobController],
  exports: [JobService],
})
export class JobModule {}
