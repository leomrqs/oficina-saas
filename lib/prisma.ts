import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool };

// Cria o pool de conexão apenas uma vez para não derrubar o banco no Next.js
if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({ connectionString });
}

const adapter = new PrismaPg(globalForPrisma.pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}