import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService) {}

  async create(createTelemetryDto: CreateTelemetryDto) {
    return this.prisma.telemetry.create({
      data: createTelemetryDto,
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
