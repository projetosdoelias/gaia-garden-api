# ==========================================
# Estágio 1: Builder (Ambiente de Construção)
# ==========================================
FROM node:22-alpine AS builder

# Correção 1: Instala o openssl que o motor do Prisma exige no Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copia os manifestos de dependências
COPY package*.json ./

# Copia a pasta prisma inteira (contendo o schema.prisma)
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo devDependencies)
RUN npm ci

# Copia o restante do código fonte da sua máquina para o container
COPY . .

# Injeta a variável temporária para o primeiro generate funcionar
RUN DATABASE_URL="postgresql://fakeuser:fakepass@localhost:5432/fakedb" npx prisma generate --schema=./prisma/schema.prisma

# ALTERADO AQUI: Injeta a variável para o generate que está embutido no "npm run build"
RUN DATABASE_URL="postgresql://fakeuser:fakepass@localhost:5432/fakedb" npm run build

# Remove dependências de desenvolvimento antes de mover para o estágio final
RUN npm prune --production

# ==========================================
# Estágio 2: Runner (Imagem Final de Produção)
# ==========================================
FROM node:22-alpine

# Garante o openssl e o cliente postgres também na imagem final
RUN apk add --no-cache postgresql-client openssl

WORKDIR /app

# Copia apenas o necessário da etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000


# Executa as migrações apontando para a pasta prisma antes de ligar a API
CMD ["sh", "-c", " npm run start:prod:lean"]
