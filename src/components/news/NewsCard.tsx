"use client";

import { useState } from "react";
import { ChevronUpDownIcon, ExternalLinkIcon } from "@/components/icons";
import { formatDateTime } from "@/lib/format";
import type { NewsArticleDTO } from "@/lib/types";

const CATEGORY_LABEL: Record<NewsArticleDTO["category"], string> = {
  segmento: "Financeiro & Tecnologia",
  seguranca: "Segurança",
};

const CATEGORY_BADGE_CLASS: Record<NewsArticleDTO["category"], string> = {
  segmento: "bg-netfive-gray-700/30 text-netfive-gray-300",
  seguranca: "bg-netfive-red/15 text-netfive-red",
};

export function NewsCard({ article }: { article: NewsArticleDTO }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_CLASS[article.category]}`}>
              {CATEGORY_LABEL[article.category]}
            </span>
            {article.segments.map((segment) => (
              <span key={segment} className="rounded-full bg-netfive-overlay/[0.06] px-2 py-0.5 text-xs text-netfive-gray-500">
                {segment}
              </span>
            ))}
          </div>
          <h3 className="font-medium text-netfive-gray-100">{article.title}</h3>
          <p className="text-xs text-netfive-gray-500">
            {article.sourceName} · {formatDateTime(article.publishedAt)}
          </p>
        </div>
        <ChevronUpDownIcon className={`h-4 w-4 shrink-0 text-netfive-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-netfive-border px-4 py-3">
          {article.summary && <p className="text-sm text-netfive-gray-300">{article.summary}</p>}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-netfive-red hover:underline"
          >
            Ler notícia completa <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
