import { PrismaClient } from '../prisma-client';

// Exportamos una única instancia de Prisma para toda la aplicación.
// Esto evita agotar las conexiones a la base de datos.
export const prisma = new PrismaClient();