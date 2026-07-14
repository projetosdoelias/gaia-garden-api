import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg'; // Importe PoolConfig para ajudar na tipagem
import * as parse from 'pg-connection-string';

import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionOptions = parse.parse(process.env.DATABASE_URL || '');

    // CORREÇÃO AQUI: Montamos o objeto PoolConfig tratando os valores nulos
    const poolConfig: PoolConfig = {
      host: connectionOptions.host ?? undefined,
      port: connectionOptions.port
        ? parseInt(connectionOptions.port, 10)
        : undefined,
      user: connectionOptions.user ?? undefined,
      password: connectionOptions.password ?? undefined,
      database: connectionOptions.database ?? undefined, // Transforma null em undefined
      ssl: connectionOptions.ssl ? (connectionOptions.ssl as any) : undefined,
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
