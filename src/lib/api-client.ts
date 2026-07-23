export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await response.json().catch(() => null)) as (ApiErrorBody & { data?: T }) | null;

  if (!response.ok) {
    const message = body?.error?.message ?? "Erro inesperado. Tente novamente.";
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    throw new ApiClientError(message, response.status, code, body?.error?.details);
  }

  return (body?.data ?? (body as unknown)) as T;
}
