import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';

@Injectable()
export class HabitatService {
  constructor(private prisma: PrismaService) {}

  async create(createHabitatDto: CreateHabitatDto) {
    return this.prisma.habitat.create({
      data: createHabitatDto,
    });
  }

  async findAll() {
    return this.prisma.habitat.findMany();
  }

  async findOne(id: number) {
    return this.prisma.habitat.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateHabitatDto: UpdateHabitatDto) {
    return this.prisma.habitat.update({
      where: { id },
      data: updateHabitatDto,
    });
  }

  async remove(id: number) {
    return this.prisma.habitat.delete({
      where: { id },
    });
  }
}
