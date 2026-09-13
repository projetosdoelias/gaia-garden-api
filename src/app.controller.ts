import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  async getHealth(): Promise<{ status: string }> {
    try {
      return await this.appService.checkHealth();
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new HttpException(
        { status: 'Service Unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
