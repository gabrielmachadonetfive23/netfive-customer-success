"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface DataRefreshContextValue {
  version: number;
  bump: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);

/**
 * Fornece um contador global que é incrementado sempre que um cliente é
 * criado, editado ou excluído. Como as páginas buscam dados via fetch no
 * cliente (não via Server Components), `router.refresh()` não as atualiza —
 * elas escutam este contador para saber quando refazer as requisições.
 */
export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);

  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>;
}

export function useDataRefresh(): DataRefreshContextValue {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error("useDataRefresh deve ser usado dentro de DataRefreshProvider.");
  }
  return context;
}
