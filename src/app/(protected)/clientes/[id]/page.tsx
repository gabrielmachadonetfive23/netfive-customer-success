import { getCurrentSessionEmail } from "@/lib/auth/session";
import { CustomerFullPageClient } from "@/components/customers/CustomerFullPageClient";

export default async function CustomerFullPage({ params }: { params: { id: string } }) {
  const email = (await getCurrentSessionEmail()) ?? "";
  return <CustomerFullPageClient customerId={params.id} currentUserEmail={email} />;
}
