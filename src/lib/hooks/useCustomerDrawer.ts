"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DRAWER_PARAM = "cliente";
const CREATE_PARAM = "novoCliente";

/** Abre/fecha a ficha do cliente (ou o formulário de novo cliente) via query param, preservando os demais filtros da URL atual. */
export function useCustomerDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openCustomer = useCallback(
    (customerId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(CREATE_PARAM);
      params.set(DRAWER_PARAM, customerId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openCreateCustomer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(DRAWER_PARAM);
    params.set(CREATE_PARAM, "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeCustomer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(DRAWER_PARAM);
    params.delete(CREATE_PARAM);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const openCustomerId = searchParams.get(DRAWER_PARAM);
  const isCreating = searchParams.get(CREATE_PARAM) === "1";

  return { openCustomer, openCreateCustomer, closeCustomer, openCustomerId, isCreating };
}
