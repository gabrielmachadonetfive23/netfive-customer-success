/**
 * `action_items` e `topics` vêm do Read.ai em formato ainda não documentado
 * publicamente (a API está em beta aberta) — pode ser uma lista de strings ou
 * de objetos com campos como `text`/`title`/`description`. Essa função tenta
 * extrair um texto legível de qualquer um desses formatos, sem quebrar caso a
 * API mude o shape exato.
 */
export function normalizeToTextList(raw: unknown): string[] {
  if (raw == null) return [];
  const items = Array.isArray(raw) ? raw : [raw];

  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "number") return String(item);
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const candidate = record.text ?? record.title ?? record.description ?? record.content ?? record.name ?? record.summary;
        if (typeof candidate === "string") return candidate;
        return JSON.stringify(item);
      }
      return null;
    })
    .filter((value): value is string => Boolean(value && value.trim()));
}
