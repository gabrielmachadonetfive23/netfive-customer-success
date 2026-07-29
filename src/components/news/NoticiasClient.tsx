"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { KNOWN_NEWS_SEGMENTS } from "@/lib/services/news-classification";
import { SearchInput } from "@/components/filters/FilterControls";
import { SegmentFilterSelect } from "@/components/news/SegmentFilterSelect";
import { NewsCard } from "@/components/news/NewsCard";
import { Pagination } from "@/components/ui/Pagination";
import type { NewsArticleDTO, PaginatedResult } from "@/lib/types";

type CategoryFilter = "" | "segmento" | "seguranca";

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "segmento", label: "Financeiro & Tecnologia" },
  { value: "seguranca", label: "Segurança" },
];

export function NoticiasClient() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState<CategoryFilter>("");
  const [segments, setSegments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [result, setResult] = useState<PaginatedResult<NewsArticleDTO> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search, category, segments]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (segments.length > 0) params.set("segments", segments.join(","));
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    apiFetch<PaginatedResult<NewsArticleDTO>>(`/api/news?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as notícias.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, category, segments, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-netfive-gray-100">Notícias</h1>
          <p className="text-sm text-netfive-gray-500">
            Atualizado todo dia às 8h — financeiro, tecnologia e investimentos dos segmentos da carteira, mais alertas de segurança.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar por título ou assunto..." />
        <SegmentFilterSelect segments={KNOWN_NEWS_SEGMENTS} selectedSegments={segments} onChange={setSegments} />
        <div className="flex gap-1 rounded-lg border border-netfive-border p-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                category === tab.value
                  ? "bg-netfive-red text-white"
                  : "text-netfive-gray-500 hover:text-netfive-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="glass-card p-4 text-sm text-netfive-red">{error}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-card h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {result?.items.length === 0 && (
            <div className="glass-card p-6 text-center text-sm text-netfive-gray-500">
              Nenhuma notícia encontrada com os filtros atuais.
            </div>
          )}

          <div className="space-y-3">
            {result?.items.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>

          {result && result.total > 0 && (
            <div className="glass-panel">
              <Pagination page={page} pageSize={pageSize} total={result.total} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
