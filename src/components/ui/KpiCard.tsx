export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-netfive-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-netfive-gray-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-netfive-gray-500">{hint}</p>}
    </div>
  );
}
