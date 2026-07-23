import { AppError } from "@/lib/api/errors";

/** Lê a lista de e-mails autorizados a partir de ALLOWED_EMAILS (separados por vírgula). */
export function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) {
    throw new AppError("ALLOWED_EMAILS não configurado.", 500, "CONFIG_ERROR");
  }
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isEmailAllowed(rawEmail: string): boolean {
  const email = rawEmail.trim().toLowerCase();
  return getAllowedEmails().includes(email);
}
