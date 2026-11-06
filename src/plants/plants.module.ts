import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlantsService } from './plants.service';
import { PlantsController } from './plants.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PlantsController],
  providers: [PlantsService],
})
export class PlantsModule {}