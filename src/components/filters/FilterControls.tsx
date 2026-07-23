"use client";

import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";
import { SearchIcon } from "@/components/icons";

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar empresa ou serviço...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full md:max-w-xs">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netfive-gray-700" />
      <input
        type="search"
        className="input-field pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

export function CsOwnerSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      className="input-field w-auto"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filtrar por CS responsável"
    >
      <option value="">Todos os CS</option>
      {options.map((owner) => (
        <option key={owner} value={owner}>
          {owner}
        </option>
      ))}
    </select>
  );
}

export function CategorySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      className="input-field w-auto"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filtrar por categoria"
    >
      <option value="">Todas as categorias</option>
      {ALLOWED_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
}

export function HealthStatusSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      className="input-field w-auto"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filtrar por status de saúde"
    >
      <option value="">Todos os status</option>
      {HEALTH_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

export function uniqueCsOwners(customers: { csOwner: string }[]): string[] {
  return Array.from(new Set(customers.map((c) => c.csOwner))).sort((a, b) => a.localeCompare(b));
}
