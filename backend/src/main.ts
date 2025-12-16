import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit to 50MB for image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Load config
  const configPath = path.join(__dirname, '../..', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // CORS
  app.enableCors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  // Swagger Setup
  if (config.swagger.enabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(config.swagger.title)
      .setDescription(config.swagger.description)
      .setVersion(config.swagger.version)
      .addTag('gate', 'Gate operations - ANPR events')
      .addTag('job-cards', 'Job card management')
      .addTag('vehicles', 'Vehicle management')
      .addTag('gate-logs', 'Gate event history')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(config.swagger.path, app, document);
  }

  const port = process.env.BACKEND_PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const publicIp = process.env.PUBLIC_IP || 'localhost';
  
  await app.listen(port, host);
  console.log(`🚗 Smart Garage Backend running on http://${publicIp}:${port}`);
  console.log(`📚 Swagger docs available at http://${publicIp}:${port}/${config.swagger.path}`);
}
bootstrap();
