import { Suspense } from "react";
import { QbrClient } from "@/components/qbr/QbrClient";

export default function QbrPage() {
  return (
    <Suspense fallback={null}>
      <QbrClient />
    </Suspense>
  );
}
