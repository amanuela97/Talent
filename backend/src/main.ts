import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', // allow frontend origin
    credentials: true, // optional: if you're using cookies or sessions
  });
  app.use(bodyParser.json({ limit: '60mb' }));
  app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
