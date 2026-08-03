/**
 * Cria (ou reseta a senha de) um usuário com uma senha provisória — usar ao dar
 * acesso a uma nova pessoa, já que ainda não há uma tela de administração para isso.
 *
 * Uso: npm run user:create -- novo.email@netfive.com.br
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateTemporaryPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npm run user:create -- email@netfive.com.br");
    process.exitCode = 1;
    return;
  }

  const tempPassword = generateTemporaryPassword();
  const { hash, salt } = hashPassword(tempPassword);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, passwordSalt: salt, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null },
    create: { email, passwordHash: hash, passwordSalt: salt, mustChangePassword: true },
  });

  console.log(`Senha provisória para ${email}: ${tempPassword}`);
  console.log("A pessoa será obrigada a trocar a senha no primeiro login.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
