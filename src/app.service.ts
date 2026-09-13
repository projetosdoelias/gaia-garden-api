import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'Everything OK' };
    } catch (error) {
      this.logger.error('Health check — database connection failed', error);
      throw new Error('Database connection failed');
    }
  }
}
