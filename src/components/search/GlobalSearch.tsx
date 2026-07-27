"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { SearchIcon, CloseIcon } from "@/components/icons";
import type { CustomerDTO, PaginatedResult } from "@/lib/types";

export function GlobalSearch() {
  const { openCustomer } = useCustomerDrawer();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CustomerDTO[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await apiFetch<PaginatedResult<CustomerDTO>>(
          `/api/customers?search=${encodeURIComponent(term)}&pageSize=8`,
        );
        setResults(result.items);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [term]);

  function handleSelect(customerId: string) {
    openCustomer(customerId);
    setIsOpen(false);
    setTerm("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netfive-gray-700" />
        <input
          type="search"
          className="input-field pl-9 pr-8"
          placeholder="Buscar empresa, contato, serviço, segmento ou CS..."
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => term.trim().length >= 2 && setIsOpen(true)}
          aria-label="Pesquisa global"
        />
        {term && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-netfive-gray-700 hover:text-netfive-gray-300"
            onClick={() => setTerm("")}
            aria-label="Limpar busca"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="glass-panel absolute z-30 mt-2 max-h-80 w-full overflow-y-auto p-2">
          {isLoading && <p className="px-3 py-2 text-sm text-netfive-gray-500">Buscando...</p>}
          {!isLoading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-netfive-gray-500">Nenhum resultado encontrado.</p>
          )}
          {!isLoading &&
            results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer.id)}
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-netfive-overlay/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
              >
                <span className="font-medium text-netfive-gray-100">{customer.companyName}</span>
                <span className="text-xs text-netfive-gray-500">
                  {customer.csOwner} · {customer.category}
                  {customer.segment ? ` · ${customer.segment}` : ""}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
