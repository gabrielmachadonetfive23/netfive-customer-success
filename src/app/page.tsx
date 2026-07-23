import { redirect } from "next/navigation";
import { getCurrentSessionEmail } from "@/lib/auth/session";

export default async function HomePage() {
  const email = await getCurrentSessionEmail();
  redirect(email ? "/dashboard" : "/login");
}
