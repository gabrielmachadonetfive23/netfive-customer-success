import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

// Salt/hash fixos (sem correspondência a nenhuma senha real) usados só para manter
// o tempo de resposta do login constante quando o e-mail não existe — evita que um
// atacante descubra, pela diferença de tempo, se um e-mail tem conta ou não.
const DUMMY_SALT = "0".repeat(32);
const DUMMY_HASH = scryptSync("dummy-password-para-timing-constante", DUMMY_SALT, KEY_LENGTH).toString("hex");

export interface PasswordHash {
  hash: string;
  salt: string;
}

/** Gera um novo par salt+hash para uma senha em texto plano. Nunca armazenamos a senha em claro. */
export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return { hash, salt };
}

/** Verifica uma senha em texto plano contra o hash+salt armazenados, em tempo constante. */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/** Roda o mesmo custo de verifyPassword sem checar contra um usuário real — usar quando o e-mail não existe. */
export function verifyDummyPassword(password: string): boolean {
  verifyPassword(password, DUMMY_HASH, DUMMY_SALT);
  return false;
}

/** Gera uma senha provisória aleatória e legível (ex.: para provisionar contas antes do primeiro login). */
export function generateTemporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}
