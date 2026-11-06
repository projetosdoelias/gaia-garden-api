import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private async ensureHabitatAccess(userId: number, habitatId: number) {
    const habitat = await this.prisma.habitat.findFirst({
      where: { id: habitatId, userId },
      select: { id: true },
    });

    if (!habitat) {
      throw new NotFoundException('Habitat not found');
    }
  }

  async create(habitatId: number, userId: number, createEventDto: CreateEventDto) {
    await this.ensureHabitatAccess(userId, habitatId);

    const data = {
      description: createEventDto.description,
      habitat: {
        connect: { id: habitatId },
      },
    };

    return this.prisma.event.create({
      data,
    });
  }

  async findAll(habitatId: number, userId: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    return this.prisma.event.findMany({
      where: {
        habitatId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(habitatId: number, userId: number, id: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    const event = await this.prisma.event.findFirst({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(
    habitatId: number,
    userId: number,
    id: number,
    updateEventDto: UpdateEventDto,
  ) {
    await this.ensureHabitatAccess(userId, habitatId);

    const result = await this.prisma.event.updateMany({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
      data: { description: updateEventDto.description },
    });

    if (result.count === 0) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.findFirst({
      where: { id, habitatId, deletedAt: null },
    });
  }

  async remove(habitatId: number, userId: number, id: number) {
    await this.ensureHabitatAccess(userId, habitatId);

    const result = await this.prisma.event.updateMany({
      where: {
        id,
        habitatId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Event not found');
    }

    return { deleted: true };
  }
}