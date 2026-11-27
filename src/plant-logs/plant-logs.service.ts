import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantLogDto } from './dto/create-plant-log.dto';
import { PlantLogQueryDto } from './dto/plant-log-query.dto';
import { UpdatePlantLogDto } from './dto/update-plant-log.dto';

@Injectable()
export class PlantLogsService {
  constructor(private prisma: PrismaService) {}

  private toDateOrUndefined(value?: string): Date | undefined {
    return value ? new Date(value) : undefined;
  }

  private async ensureHabitatAccess(userId: number, habitatId: number) {
    const habitat = await this.prisma.habitat.findFirst({
      where: { id: habitatId, userId },
      select: { id: true },
    });

    if (!habitat) {
      throw new NotFoundException('Habitat not found');
    }
  }

  private async ensurePlantAccess(
    userId: number,
    habitatId: number,
    plantId: number,
  ) {
    await this.ensureHabitatAccess(userId, habitatId);

    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, habitatId, deletedAt: null },
      select: { id: true },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }
  }

  async create(
    habitatId: number,
    plantId: number,
    userId: number,
    dto: CreatePlantLogDto,
  ) {
    await this.ensurePlantAccess(userId, habitatId, plantId);

    return this.prisma.plantLog.create({
      data: {
        type: dto.type,
        notes: dto.notes,
        healthScore: dto.healthScore,
        details: dto.details as Prisma.InputJsonObject | undefined,
        occurredAt: this.toDateOrUndefined(dto.occurredAt),
        plant: { connect: { id: plantId } },
      },
    });
  }

  async findAll(
    habitatId: number,
    plantId: number,
    userId: number,
    query: PlantLogQueryDto,
  ) {
    await this.ensurePlantAccess(userId, habitatId, plantId);

    const from = this.toDateOrUndefined(query.from);
    const to = this.toDateOrUndefined(query.to);
    if (from && to && from >= to) {
      throw new BadRequestException('from must be earlier than to');
    }

    const where: Prisma.PlantLogWhereInput = {
      plantId,
      deletedAt: null,
      type: query.type,
    };
    if (from || to) {
      where.occurredAt = { gte: from, lt: to };
    }

    return this.prisma.plantLog.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(
    habitatId: number,
    plantId: number,
    userId: number,
    logId: number,
  ) {
    await this.ensurePlantAccess(userId, habitatId, plantId);
    return this.findActiveLogOrThrow(plantId, logId);
  }

  async update(
    habitatId: number,
    plantId: number,
    userId: number,
    logId: number,
    dto: UpdatePlantLogDto,
  ) {
    await this.ensurePlantAccess(userId, habitatId, plantId);

    const result = await this.prisma.plantLog.updateMany({
      where: { id: logId, plantId, deletedAt: null },
      data: {
        notes: dto.notes,
        healthScore: dto.healthScore,
        occurredAt: this.toDateOrUndefined(dto.occurredAt),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Plant log not found');
    }

    return this.findActiveLogOrThrow(plantId, logId);
  }

  async remove(
    habitatId: number,
    plantId: number,
    userId: number,
    logId: number,
  ) {
    await this.ensurePlantAccess(userId, habitatId, plantId);

    const result = await this.prisma.plantLog.updateMany({
      where: { id: logId, plantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Plant log not found');
    }

    return { deleted: true };
  }

  private async findActiveLogOrThrow(plantId: number, logId: number) {
    const log = await this.prisma.plantLog.findFirst({
      where: { id: logId, plantId, deletedAt: null },
    });

    if (!log) {
      throw new NotFoundException('Plant log not found');
    }

    return log;
  }
}
