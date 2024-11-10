import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JobModule } from '../jobs/job.module';
import { ExecutorModule } from '../executor/executor.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [JobModule, ExecutorModule, ConfigModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
