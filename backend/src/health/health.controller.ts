import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('db')
  @ApiOperation({ summary: 'Check database connection' })
  async checkDatabase() {
    // Simple query to test DB connection
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
