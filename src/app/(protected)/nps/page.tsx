import { Suspense } from "react";
import { NpsClient } from "@/components/nps/NpsClient";

export default function NpsPage() {
  return (
    <Suspense fallback={null}>
      <NpsClient />
    </Suspense>
  );
}
