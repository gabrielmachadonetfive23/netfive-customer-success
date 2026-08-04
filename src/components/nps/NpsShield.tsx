"use client";

import { useEffect, useState } from "react";

interface NpsShieldProps {
  /** NPS varia de -100 a 100; null quando ainda não há nenhuma resposta com nota. */
  score: number | null;
  size?: number;
}

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 240;
const ANIMATION_DURATION_MS = 1400;

// Contorno de escudo heráldico: topo reto com dois "ombros", afunilando até uma ponta embaixo.
const SHIELD_PATH = "M100,6 L184,34 L184,116 C184,182 140,222 100,236 C60,222 16,182 16,116 L16,34 Z";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function NpsShield({ score, size = 260 }: NpsShieldProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (score === null) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let raf: number;
    let cancelled = false;

    function runAnimation() {
      const start = performance.now();
      function tick(now: number) {
        if (cancelled) return;
        const elapsed = now - start;
        const t = Math.min(1, elapsed / ANIMATION_DURATION_MS);
        setProgress(easeOutCubic(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    // Navegadores pausam requestAnimationFrame em abas ocultas (ex.: página
    // aberta em segundo plano) — nesse caso a animação nunca rodaria. Espera
    // a aba ficar visível antes de começar, em vez de travar em 0.
    if (document.hidden) {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          runAnimation();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        cancelled = true;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        cancelAnimationFrame(raf);
      };
    }

    runAnimation();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [score]);

  const targetValue = score ?? 0;
  const targetFillPercent = Math.max(0, Math.min(100, targetValue));

  const currentValue = Math.round(targetValue * progress);
  const currentFillPercent = targetFillPercent * progress;

  const fillHeight = (currentFillPercent / 100) * VIEWBOX_HEIGHT;
  const fillY = VIEWBOX_HEIGHT - fillHeight;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        width={size}
        height={(size * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH}
        role="img"
        aria-label={score === null ? "NPS: sem dados" : `NPS: ${score}`}
      >
        <defs>
          <clipPath id="nps-shield-clip">
            <path d={SHIELD_PATH} />
          </clipPath>
          {/* Vermelho embaixo → amarelo no meio → verde no topo. Fixo no espaço do
              escudo inteiro: conforme o preenchimento sobe, revela uma faixa maior
              do degradê, terminando em verde perto do topo quando quase cheio. */}
          <linearGradient id="nps-fill-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        <path d={SHIELD_PATH} className="fill-netfive-overlay/[0.06]" />

        <g clipPath="url(#nps-shield-clip)">
          <rect x={0} y={fillY} width={VIEWBOX_WIDTH} height={fillHeight} fill="url(#nps-fill-gradient)" />
        </g>

        <path d={SHIELD_PATH} fill="none" className="stroke-netfive-border" strokeWidth={2} />

        <text
          x="100"
          y="112"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-bold"
          style={{ fontSize: 62, paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 3 }}
        >
          {currentValue}
        </text>
        <text
          x="100"
          y="150"
          textAnchor="middle"
          className="fill-white/85 font-semibold uppercase"
          style={{ fontSize: 15, letterSpacing: "0.15em", paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 2 }}
        >
          NPS
        </text>
      </svg>

      {score === null && (
        <p className="max-w-[220px] text-center text-xs text-netfive-gray-500">
          Nenhuma resposta com nota lançada ainda — adicione as empresas participantes ao lado.
        </p>
      )}
    </div>
  );
}
