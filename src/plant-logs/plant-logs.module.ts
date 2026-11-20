import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlantLogsController } from './plant-logs.controller';
import { PlantLogsService } from './plant-logs.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlantLogsController],
  providers: [PlantLogsService],
})
export class PlantLogsModule {}
