import { GlobalSearch } from "@/components/search/GlobalSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-netfive-border bg-netfive-surface/40 px-4 py-3 md:px-6">
      <GlobalSearch />
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-sm text-netfive-gray-500 md:inline">{email}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
