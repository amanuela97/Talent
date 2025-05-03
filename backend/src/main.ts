import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser'; // Change this line

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '60mb' }));
  app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
