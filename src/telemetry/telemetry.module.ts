import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { AuthModule } from '../auth/auth.module';
import { HabitatTelemetryController } from './habitat-telemetry.controller';
import { HabitatTelemetryService } from './habitat-telemetry.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TelemetryController, HabitatTelemetryController],
  providers: [TelemetryService, HabitatTelemetryService],
})
export class TelemetryModule {}
