import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HabitatModule } from './habitat/habitat.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [HabitatModule, PrismaModule, TelemetryModule, ApiKeyModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
