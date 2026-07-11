import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Garden } from '../generated/client';

@Injectable()
export class GardensService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Garden[]> {
    return this.prisma.garden.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
