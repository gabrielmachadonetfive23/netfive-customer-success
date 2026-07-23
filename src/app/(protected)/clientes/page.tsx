import { Suspense } from "react";
import { ClientsClient } from "@/components/clients/ClientsClient";

export default function ClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsClient />
    </Suspense>
  );
}
