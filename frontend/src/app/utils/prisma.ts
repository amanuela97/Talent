// At the top of your file
import { PrismaClient } from '@prisma/client';

// Best practice: create a singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default globalForPrisma;
