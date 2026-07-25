import type { KpiTone } from "@/lib/kpi-tone";

const TONE_CLASSES: Record<KpiTone, string> = {
  neutral: "text-netfive-gray-100",
  good: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-netfive-red",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: KpiTone;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-netfive-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-netfive-gray-500">{hint}</p>}
    </div>
  );
}
