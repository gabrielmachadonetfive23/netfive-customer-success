import { Suspense } from "react";
import { VisitsClient } from "@/components/visits/VisitsClient";

export default function VisitsPage() {
  return (
    <Suspense fallback={null}>
      <VisitsClient />
    </Suspense>
  );
}
