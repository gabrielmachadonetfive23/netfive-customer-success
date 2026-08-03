"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {forced && (
        <p className="mb-4 text-sm text-netfive-gray-300">
          Esta é sua primeira vez aqui — defina uma senha nova antes de continuar.
        </p>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-netfive-red/40 bg-netfive-red/10 px-3 py-2 text-sm text-netfive-red">
          {error}
        </div>
      )}

      <label htmlFor="current-password" className="field-label">
        Senha atual
      </label>
      <input
        id="current-password"
        type="password"
        autoComplete="current-password"
        className="input-field mb-4"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
      />

      <label htmlFor="new-password" className="field-label">
        Nova senha
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        className="input-field mb-4"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        minLength={8}
        required
      />

      <label htmlFor="confirm-new-password" className="field-label">
        Confirmar nova senha
      </label>
      <input
        id="confirm-new-password"
        type="password"
        autoComplete="new-password"
        className="input-field mb-4"
        value={confirmNewPassword}
        onChange={(event) => setConfirmNewPassword(event.target.value)}
        minLength={8}
        required
      />

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isSubmitting || !currentPassword || !newPassword || !confirmNewPassword}
      >
        {isSubmitting ? "Salvando..." : "Trocar senha"}
      </button>
    </form>
  );
}
