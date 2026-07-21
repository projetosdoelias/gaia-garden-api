import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService) {}

  async create(createTelemetryDto: CreateTelemetryDto) {
    const data = {
      ...createTelemetryDto,
    };

    if (createTelemetryDto.recordedAt) {
      data.recordedAt = new Date(createTelemetryDto.recordedAt);
    }

    return this.prisma.telemetry.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.telemetry.findMany();
  }

  async findOne(id: number) {
    return this.prisma.telemetry.findUnique({
      where: { id },
    });
  }
}
