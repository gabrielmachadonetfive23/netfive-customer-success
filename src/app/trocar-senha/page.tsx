import { redirect } from "next/navigation";
import { getCurrentSessionEmail } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { NetfiveLogo } from "@/components/brand/NetfiveLogo";

export default async function ChangePasswordPage() {
  const email = await getCurrentSessionEmail();
  if (!email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { mustChangePassword: true } });

  return (
    <main className="flex min-h-screen items-center justify-center bg-netfive-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="w-40">
            <NetfiveLogo />
          </div>
        </div>
        <div className="glass-panel p-8">
          <h1 className="mb-1 text-center text-lg font-semibold text-netfive-gray-100">Trocar senha</h1>
          <p className="mb-6 text-center text-sm text-netfive-gray-500">{email}</p>
          <ChangePasswordForm forced={user?.mustChangePassword ?? false} />
        </div>
      </div>
    </main>
  );
}
