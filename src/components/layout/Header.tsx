import { GlobalSearch } from "@/components/search/GlobalSearch";

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-netfive-border bg-netfive-surface/40 px-4 py-3 md:px-6">
      <GlobalSearch />
      <span className="hidden shrink-0 text-sm text-netfive-gray-500 md:inline">{email}</span>
    </header>
  );
}
