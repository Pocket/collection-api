import { PrismaClient } from '@prisma/client';

let prisma;

export function client(): PrismaClient {
  if (prisma) return prisma;

  prisma = new PrismaClient({
    // log: ['query', 'info', `warn`, `error`],
  });

  return prisma;
}
