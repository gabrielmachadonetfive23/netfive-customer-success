import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebhookBasicAuth, type PipedriveOrganization } from "@/lib/integrations/pipedrive/client";
import { pipedriveOrganizationToFieldValues } from "@/lib/integrations/pipedrive/mapper";
import { applyIncomingChange } from "@/lib/integrations/sync-orchestrator";

interface PipedriveWebhookPayload {
  meta: { action: string; object: string };
  current: PipedriveOrganization | null;
}

/** Callback de eventos do Pipedrive, autenticado via Basic Auth configurado no cadastro do webhook. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyWebhookBasicAuth(request.headers.get("authorization"))) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Autenticação inválida." } }, { status: 401 });
  }

  const payload = (await request.json()) as PipedriveWebhookPayload;

  if (payload.meta.object !== "organization" || !payload.current) {
    return NextResponse.json({ received: true });
  }

  try {
    const values = await pipedriveOrganizationToFieldValues(payload.current);
    await applyIncomingChange({
      provider: "pipedrive",
      externalId: String(payload.current.id),
      externalUpdatedAt: new Date(payload.current.update_time),
      values,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[webhook:pipedrive] falha ao processar evento de organização:", error);
  }

  return NextResponse.json({ received: true });
}
