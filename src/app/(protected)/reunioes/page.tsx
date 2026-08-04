import { Suspense } from "react";
import { MeetingsClient } from "@/components/meetings/MeetingsClient";

export default function ReunioesPage() {
  return (
    <Suspense fallback={null}>
      <MeetingsClient />
    </Suspense>
  );
}
