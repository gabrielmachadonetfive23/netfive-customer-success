"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-netfive-red/40 bg-netfive-red/10 px-3 py-2 text-sm text-netfive-red">
          {error}
        </div>
      )}

      <label htmlFor="login-email" className="field-label">
        E-mail
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        className="input-field mb-4"
        placeholder="seuemail@netfive.com.br"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting || !email}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
