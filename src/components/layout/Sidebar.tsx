"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NetfiveLogo } from "@/components/brand/NetfiveLogo";
import { CalendarIcon, ChartIcon, ChecklistIcon, LogoutIcon, NewsIcon, OverviewIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { apiFetch } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão geral", icon: OverviewIcon },
  { href: "/visitas", label: "Visitas", icon: CalendarIcon },
  { href: "/clientes", label: "Clientes", icon: UsersIcon },
  { href: "/estatisticas", label: "Estatísticas", icon: ChartIcon },
  { href: "/noticias", label: "Notícias", icon: NewsIcon },
  { href: "/nps", label: "NPS", icon: ShieldIcon },
  { href: "/qbr", label: "QBR/SBR", icon: ChecklistIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-screen w-16 flex-col items-center gap-2 border-r border-netfive-border bg-netfive-surface/60 py-4 md:w-56 md:items-stretch md:px-3"
    >
      <div className="mb-4 flex justify-center md:px-1">
        <div className="w-9 md:w-full">
          <NetfiveLogo compact />
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-netfive-red ${
                  isActive
                    ? "bg-netfive-red/15 text-netfive-red"
                    : "text-netfive-gray-500 hover:bg-netfive-overlay/5 hover:text-netfive-gray-100"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-netfive-gray-500 transition-colors hover:bg-netfive-overlay/5 hover:text-netfive-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-netfive-red disabled:opacity-50"
      >
        <LogoutIcon className="h-5 w-5 shrink-0" />
        <span className="hidden md:inline">{isLoggingOut ? "Saindo..." : "Sair"}</span>
      </button>
    </nav>
  );
}
