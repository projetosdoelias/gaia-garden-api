import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HabitatModule } from './habitat/habitat.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [PrismaModule, HabitatModule, TelemetryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
