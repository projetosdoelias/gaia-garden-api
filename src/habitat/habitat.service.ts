import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';

@Injectable()
export class HabitatService {
  constructor(private prisma: PrismaService) {}

  async create(createHabitatDto: CreateHabitatDto & { userId: number }) {
    return this.prisma.habitat.create({
      data: {
        title: createHabitatDto.title,
        description: createHabitatDto.description,
        user: {
          connect: {
            id: createHabitatDto.userId,
          },
        },
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.habitat.findMany({
      where: { userId },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.habitat.findFirst({
      where: { id, userId },
    });
  }

  async update(id: number, userId: number, updateHabitatDto: UpdateHabitatDto) {
    return this.prisma.habitat.updateMany({
      where: { id, userId },
      data: updateHabitatDto,
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.habitat.deleteMany({
      where: { id, userId },
    });
  }
}
