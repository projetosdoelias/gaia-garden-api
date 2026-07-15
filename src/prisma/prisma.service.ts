import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Cria a pool de conexões nativa do driver 'pg'
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // 2. Instancia o adaptador do Prisma para o PostgreSQL
    const adapter = new PrismaPg(pool);

    // 3. Passa o adaptador obrigatorio para o construtor
    super({ adapter } as Prisma.PrismaClientOptions);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
