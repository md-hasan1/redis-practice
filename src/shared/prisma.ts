import { PrismaClient } from "@prisma/client";
import { initiateSuperAdmin } from "../app/db/db";
import { systemLogger } from "../app/middlewares/logger";

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const startTime = Date.now();
        const opName = `${model || 'Database'}.${operation}`;
        try {
          const result = await query(args);
          const executionTime = Date.now() - startTime;
          systemLogger.logDatabaseQuery(opName, executionTime);
          return result;
        } catch (error: any) {
          const executionTime = Date.now() - startTime;
          systemLogger.logError(
            `DB_QUERY: ${opName} (Time: ${executionTime}ms)`,
            error?.message || 'Database query failed',
            error?.stack
          );
          throw error;
        }
      },
    },
  },
});


async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log("Prisma connected to the database successfully!");

    // initiate super admin
    initiateSuperAdmin();
    
  } catch (error) {
    console.error("Prisma connection failed:", error);
    process.exit(1); // Exit process with failure
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected due to application termination.");
    process.exit(0);
  });
}

connectPrisma();

export default prisma;
