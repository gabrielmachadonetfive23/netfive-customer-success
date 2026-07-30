const STATUS_TEXT_TONE: Record<string, string> = {
  Encerrada: "text-emerald-400",
  Pendente: "text-amber-400",
  "Em atendimento": "text-amber-400",
  "Aguardando cliente": "text-amber-400",
  "Projeto em andamento": "text-amber-400",
  Agendado: "text-netfive-gray-500",
  Suspensa: "text-netfive-gray-500",
};

const STATUS_BADGE_TONE: Record<string, string> = {
  Encerrada: "bg-emerald-500/15 text-emerald-400",
  Pendente: "bg-amber-500/15 text-amber-400",
  "Em atendimento": "bg-amber-500/15 text-amber-400",
  "Aguardando cliente": "bg-amber-500/15 text-amber-400",
  "Projeto em andamento": "bg-amber-500/15 text-amber-400",
  Agendado: "bg-netfive-overlay/[0.06] text-netfive-gray-500",
  Suspensa: "bg-netfive-overlay/[0.06] text-netfive-gray-500",
};

export function qbrStatusTextTone(status: string | null): string {
  return status ? (STATUS_TEXT_TONE[status] ?? "text-netfive-gray-500") : "text-netfive-gray-500";
}

export function qbrStatusBadgeTone(status: string | null): string {
  return status ? (STATUS_BADGE_TONE[status] ?? "bg-netfive-overlay/[0.06] text-netfive-gray-500") : "bg-netfive-overlay/[0.06] text-netfive-gray-500";
}
