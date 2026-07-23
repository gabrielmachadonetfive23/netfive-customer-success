export type SyncProvider = "smartsheet" | "pipedrive";
export type SyncDirection = "push" | "pull";
export type SyncStatus = "success" | "error" | "skipped";

/** Payload plano (chave/valor) trocado com os sistemas externos, já convertido para tipos primitivos. */
export type ExternalFieldValues = Record<string, string | number | null>;

export interface ExternalRecordRef {
  provider: SyncProvider;
  externalId: string;
  externalUpdatedAt: Date | null;
}

export interface PushOutcome {
  provider: SyncProvider;
  status: SyncStatus;
  message?: string;
}
