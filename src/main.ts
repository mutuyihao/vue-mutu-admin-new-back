import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs'

declare const module: any;
async function bootstrap() {
  fs.mkdirSync('./upload', { recursive: true });
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
