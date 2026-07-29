const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/** Extrai o e-mail do campo livre "Telefone/e-mail" (ex.: "nome@empresa.com · (51) 99999-9999"). */
export function extractEmail(contactInfo: string | null): string | null {
  if (!contactInfo) return null;
  return contactInfo.match(EMAIL_PATTERN)?.[0] ?? null;
}

/** Extrai o telefone em dígitos, com DDI 55 assumido quando ausente (números brasileiros). */
export function extractWhatsAppDigits(contactInfo: string | null): string | null {
  if (!contactInfo) return null;
  const withoutEmail = contactInfo.replace(EMAIL_PATTERN, "");
  const digits = withoutEmail.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

export function buildMailtoUrl(email: string): string {
  return `mailto:${email}`;
}

export function buildWhatsAppUrl(digits: string): string {
  return `https://wa.me/${digits}`;
}
