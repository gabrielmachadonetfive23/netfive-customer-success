import { Suspense } from "react";
import { StatisticsClient } from "@/components/statistics/StatisticsClient";

export default function StatisticsPage() {
  return (
    <Suspense fallback={null}>
      <StatisticsClient />
    </Suspense>
  );
}
