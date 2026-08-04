/**
 * Marca (ou desmarca) um usuário já existente como admin — acesso total a
 * dados restritos por CS (hoje, só a lista completa de Reuniões). Não mexe
 * na senha.
 *
 * Uso: npm run user:set-admin -- email@netfive.com.br true
 *      npm run user:set-admin -- email@netfive.com.br false
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const flag = process.argv[3]?.trim().toLowerCase();

  if (!email || (flag !== "true" && flag !== "false")) {
    console.error("Uso: npm run user:set-admin -- email@netfive.com.br true|false");
    process.exitCode = 1;
    return;
  }

  const isAdmin = flag === "true";
  const user = await prisma.user.update({ where: { email }, data: { isAdmin } });
  console.log(`${user.email}: isAdmin = ${user.isAdmin}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
