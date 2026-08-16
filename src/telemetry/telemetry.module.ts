import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
})
export class TelemetryModule {}
