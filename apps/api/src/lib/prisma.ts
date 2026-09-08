import { PrismaClient } from "@prisma/client";

// Create a single Prisma instance and reuse it across the app
// This prevents creating too many database connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export default prisma;
