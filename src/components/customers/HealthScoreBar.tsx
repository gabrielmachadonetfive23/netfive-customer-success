import type { HealthStatus } from "@/lib/constants";

/** Cor de preenchimento por status de saúde — reutilizada em qualquer barra que represente o status. */
export const STATUS_COLORS: Record<HealthStatus, string> = {
  Saudável: "bg-emerald-500",
  Atenção: "bg-amber-500",
  Crítico: "bg-netfive-red",
  "Não avaliado": "bg-netfive-gray-700",
};

/** Cor de texto por status de saúde — verde (bom), amarelo (médio), vermelho (preocupante). */
export const HEALTH_STATUS_TEXT_COLOR: Record<HealthStatus, string> = {
  Saudável: "text-emerald-400",
  Atenção: "text-amber-400",
  Crítico: "text-netfive-red",
  "Não avaliado": "text-netfive-gray-500",
};

export function HealthScoreBar({ score, status }: { score: number | null; status: HealthStatus }) {
  const percent = score ?? 0;

  return (
    <div className="w-full">
      <div className={`mb-1 flex items-center justify-between text-xs font-medium ${HEALTH_STATUS_TEXT_COLOR[status]}`}>
        <span>{status}</span>
        <span>{score !== null ? `${score}/100` : "—"}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={score ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Health Score: ${status}`}
      >
        <div
          className={`h-full rounded-full transition-all ${STATUS_COLORS[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
