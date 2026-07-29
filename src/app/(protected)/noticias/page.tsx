import { Suspense } from "react";
import { NoticiasClient } from "@/components/news/NoticiasClient";

export default function NoticiasPage() {
  return (
    <Suspense fallback={null}>
      <NoticiasClient />
    </Suspense>
  );
}
