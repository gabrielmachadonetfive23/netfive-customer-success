import Image from "next/image";

/** Marca Netfive: logo oficial sobre um bloco branco com cantos arredondados. */
export function NetfiveLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-white shadow-glass-sm ${
        compact ? "h-9 w-full p-1.5" : "h-12 w-full px-4 py-2"
      }`}
    >
      <Image src="/netfive-logo.png" alt="Netfive" fill className="object-contain p-0.5" priority sizes="200px" />
    </div>
  );
}
