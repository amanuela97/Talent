import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser'; // Change this line
import { PrismaService } from './prisma.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable shutdown hooks for Prisma
    const prismaService = app.get(PrismaService);
    prismaService.enableShutdownHooks(app);

    // Perform a simple database query to test the connection
    try {
      await prismaService.$executeRawUnsafe('SELECT 1');
      console.log('Database connection verified');
    } catch (dbError) {
      if (dbError instanceof Error) {
        console.warn('Database connection test failed:', dbError.message);
      } else {
        console.warn('Database connection test failed:', dbError);
      }
      // Continue anyway - the app will handle connection issues at runtime
    }

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
    console.log(`Application listening on port ${process.env.PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}
bootstrap();
