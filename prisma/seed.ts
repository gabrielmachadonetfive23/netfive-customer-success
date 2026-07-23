import { PrismaClient } from "@prisma/client";
import { SERVICE_CATALOG } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const name of SERVICE_CATALOG) {
    await prisma.service.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed concluído: ${SERVICE_CATALOG.length} serviços garantidos no catálogo.`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
