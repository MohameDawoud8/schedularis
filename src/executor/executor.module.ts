// src/executor/executor.module.ts

import { Module } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { JobModule } from '../jobs/job.module';
import { QueueModule } from '../queue/queue.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { ConfigModule } from '../config/config.module';
import { WorkerPoolService } from '../worker/worker-pool.service';

@Module({
  imports: [JobModule, QueueModule, MonitoringModule, ConfigModule],
  providers: [ExecutorService, WorkerPoolService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
