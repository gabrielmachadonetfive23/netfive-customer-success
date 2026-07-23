/**
 * Placeholder da marca Netfive: bloco branco com cantos arredondados, como
 * pedido no spec visual. Troque o conteúdo do <span> por um <Image> com o
 * arquivo oficial da logo (ex.: public/netfive-logo.svg) quando disponível.
 */
export function NetfiveLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-white shadow-glass-sm ${
        compact ? "h-9 w-9" : "h-12 w-full px-4"
      }`}
    >
      <span className={`font-bold tracking-tight text-netfive-red ${compact ? "text-sm" : "text-lg"}`}>
        {compact ? "N5" : "NETFIVE"}
      </span>
    </div>
  );
}
