// src/config/config.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {
    const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
    for (const envVar of requiredEnvVars) {
      if (!this.nestConfigService.get<string>(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
  }

  get databaseUrl(): string {
    return this.nestConfigService.getOrThrow<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.nestConfigService.getOrThrow<string>('REDIS_URL');
  }

  get maxConcurrentJobs(): number {
    return this.nestConfigService.get<number>('MAX_CONCURRENT_JOBS', 5);
  }

  get nodeEnv(): string {
    return this.nestConfigService.get<string>('NODE_ENV', 'development');
  }

  get apiRateLimit(): number {
    return this.nestConfigService.get<number>('API_RATE_LIMIT', 100);
  }

  get apiRateLimitWindowMs(): number {
    return this.nestConfigService.get<number>(
      'API_RATE_LIMIT_WINDOW_MS',
      60000,
    );
  }

  get schedulerCheckInterval(): number {
    return this.nestConfigService.get<number>('SCHEDULER_CHECK_INTERVAL', 1000);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get jobLockTimeout(): number {
    return this.nestConfigService.get<number>('JOB_LOCK_TIMEOUT', 30 * 1000);
  }
}
