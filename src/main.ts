import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
// import { MonitoringService } from './monitoring/monitoring.service';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // const monitoringService = app.get(MonitoringService);

  app.useGlobalPipes(new ValidationPipe());

  app.use(
    rateLimit({
      windowMs: configService.apiRateLimitWindowMs,
      max: configService.apiRateLimit,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Scheduler Microservice')
    .setDescription('API documentation for the Scheduler Microservice')
    .setVersion('1.0')
    .addTag('jobs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();

// if (process.argv.includes('--expose-gc')) {
// } else {
//   console.warn(
//     'Application should be started with --expose-gc flag for optimal memory management.',
//   );
//   process.exit(1);
// }
