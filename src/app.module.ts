import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { JobModule } from './jobs/job.module';
import { QueueModule } from './queue/queue.module';
import { ExecutorModule } from './executor/executor.module';
import { CommonModule } from './common/common.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.databaseUrl,
        autoLoadEntities: true,
        synchronize: configService.isDevelopment,
        // logging: configService.isDevelopment,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    JobModule,
    QueueModule,
    ExecutorModule,
    CommonModule,
    SchedulerModule,
  ],
})
export class AppModule {}
