import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService) {}

  private calculateVPD(temperature: number, humidity: number): number {
    if (humidity < 0 || humidity > 100) {
      throw new Error('Humidity must be between 0 and 100');
    }

    // Calculate Saturated Vapor Pressure (SVP) using Tetens' equation
    const svp =
      0.61078 * Math.exp((17.27 * temperature) / (temperature + 237.3));

    // Calculate Vapor Pressure Deficit (VPD)
    const vpd = svp * (1 - humidity / 100);

    // Round to 2 decimal places
    return parseFloat(vpd.toFixed(2));
  }

  async create(createTelemetryDto: CreateTelemetryDto) {
    const vpd = this.calculateVPD(
      createTelemetryDto.temperature,
      createTelemetryDto.humidity,
    );

    const data = {
      ...createTelemetryDto,
      vpd,
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
