import { Injectable } from '@nestjs/common';
import { Registry, Gauge } from 'prom-client';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class MonitoringService {
  private prometheus: Registry;
  private logger: any;

  private jobsProcessed: Gauge<string>;
  private jobsFailedTotal: Gauge<string>;
  private jobsSuccessTotal: Gauge<string>;

  constructor() {
    this.setupPrometheus();
    this.setupLogger();
  }

  private setupLogger() {
    const customFormat = format.printf(
      ({ level, message, timestamp, ...metadata }) => {
        let formatted = `${timestamp} [${level.toUpperCase()}] ${message}`;

        if (metadata.jobId) {
          formatted += ` [Job #${metadata.jobId}]`;
        }
        if (metadata.jobName) {
          formatted += ` (${metadata.jobName})`;
        }
        if (metadata.error) {
          formatted += `\nError: ${metadata.error}`;
        }

        return formatted;
      },
    );

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat,
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: 'error.log',
          level: 'error',
        }),
      ],
    });
  }

  private setupPrometheus() {
    this.prometheus = new Registry();

    this.jobsProcessed = new Gauge({
      name: 'jobs_processed_total',
      help: 'Total number of jobs processed',
      labelNames: ['status'],
    });

    this.jobsFailedTotal = new Gauge({
      name: 'jobs_failed_total',
      help: 'Total number of failed jobs',
    });

    this.jobsSuccessTotal = new Gauge({
      name: 'jobs_success_total',
      help: 'Total number of successful jobs',
    });

    this.prometheus.registerMetric(this.jobsProcessed);
    this.prometheus.registerMetric(this.jobsFailedTotal);
    this.prometheus.registerMetric(this.jobsSuccessTotal);
  }

  incrementJobsProcessed(status: string) {
    this.jobsProcessed.inc({ status });
  }

  incrementJobsFailed() {
    this.jobsFailedTotal.inc();
  }

  incrementJobsSuccess() {
    this.jobsSuccessTotal.inc();
  }

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, meta);
  }

  getMetrics() {
    return this.prometheus.metrics();
  }
}
