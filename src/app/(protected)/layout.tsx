import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSessionEmail } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CustomerDrawerHost } from "@/components/customers/CustomerDrawerHost";
import { DataRefreshProvider } from "@/lib/contexts/DataRefreshContext";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const email = await getCurrentSessionEmail();
  if (!email) {
    redirect("/login");
  }

  return (
    <DataRefreshProvider>
      <div className="flex h-screen overflow-hidden bg-netfive-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Suspense fallback={<div className="h-[57px] border-b border-netfive-border" />}>
            <Header email={email} />
          </Suspense>
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">{children}</main>
        </div>
        <Suspense fallback={null}>
          <CustomerDrawerHost currentUserEmail={email} />
        </Suspense>
      </div>
    </DataRefreshProvider>
  );
}
