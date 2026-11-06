import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantsService {
  constructor(private prisma: PrismaService) {}

  private toDateOrUndefined(value?: string): Date | undefined {
    return value ? new Date(value) : undefined;
  }

  private buildDatesDto(
    dto: Pick<
      CreatePlantDto,
      'germinatedAt' | 'seedlingAt' | 'vegetativeAt' | 'floweringAt'
    >,
  ) {
    return {
      germinatedAt: this.toDateOrUndefined(dto.germinatedAt),
      seedlingAt: this.toDateOrUndefined(dto.seedlingAt),
      vegetativeAt: this.toDateOrUndefined(dto.vegetativeAt),
      floweringAt: this.toDateOrUndefined(dto.floweringAt),
    };
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

  async create(habitatId: number, userId: number, createPlantDto: CreatePlantDto) {
    await this.ensureHabitatAccess(userId, habitatId);

    const data = {
      name: createPlantDto.name,
      description: createPlantDto.description,
      strain: createPlantDto.strain,
      ...this.buildDatesDto(createPlantDto),
      habitat: {
        connect: { id: habitatId },
      },
    };

    return this.prisma.plant.create({
      data,
    });
  }

  async findAll(habitatId: number, userId: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    return this.prisma.plant.findMany({
      where: {
        habitatId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(habitatId: number, userId: number, id: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    const plant = await this.prisma.plant.findFirst({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return plant;
  }

  async update(
    habitatId: number,
    userId: number,
    id: number,
    updatePlantDto: UpdatePlantDto,
  ) {
    await this.ensureHabitatAccess(userId, habitatId);

    const result = await this.prisma.plant.updateMany({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
      data: {
        name: updatePlantDto.name,
        description: updatePlantDto.description,
        strain: updatePlantDto.strain,
        ...this.buildDatesDto(updatePlantDto),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Plant not found');
    }

    return this.prisma.plant.findFirst({
      where: { id, habitatId, deletedAt: null },
    });
  }

  async remove(habitatId: number, userId: number, id: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    const result = await this.prisma.plant.updateMany({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Plant not found');
    }

    return { deleted: true };
  }
}