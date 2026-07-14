import 'dotenv/config';
import { defineConfig, env } from 'prisma/config'; // Importação corrigida aqui

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Usando o helper nativo do Prisma v7 para ler variáveis de ambiente
    url: env('DATABASE_URL'),
  },
});
