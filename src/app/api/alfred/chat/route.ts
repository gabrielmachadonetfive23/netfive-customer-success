import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { prisma } from "@/lib/db";
import { alfredChatSchema } from "@/lib/validations/alfred";
import { AlfredNotConfiguredError, runAlfredConversation } from "@/lib/integrations/anthropic/client";
import { ALFRED_TOOLS, executeAlfredTool } from "@/lib/services/alfred-tools";
import { AppError, toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

function buildSystemPrompt(viewerEmail: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "Você é o Alfred, o assistente de IA da plataforma de Customer Success da Netfive.",
    `Hoje é ${today}. Você está conversando com ${viewerEmail}.`,
    "Responda sempre em português do Brasil, de forma direta e objetiva.",
    "Você só tem acesso de LEITURA aos dados da plataforma, através das ferramentas disponíveis — nunca invente informações sobre clientes, contratos, NPS, reuniões ou atividades de QBR.",
    "Sempre que a pergunta envolver dados de clientes, contratos, saúde da carteira, NPS, QBR ou reuniões, use as ferramentas para consultar os dados reais antes de responder.",
    "Se uma busca não encontrar nada ou for ambígua, diga isso claramente e peça mais detalhes em vez de supor.",
    "Seja conciso: respostas curtas e acionáveis, com nomes de empresas e números concretos quando existirem.",
  ].join(" ");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    const { messages } = alfredChatSchema.parse(await request.json());
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      throw new AppError("A última mensagem precisa ser do usuário.", 422, "VALIDATION_ERROR");
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { isAdmin: true } });
    const viewer = { email, isAdmin: user?.isAdmin ?? false };

    const reply = await runAlfredConversation({
      systemPrompt: buildSystemPrompt(email),
      history: messages,
      tools: ALFRED_TOOLS,
      executeTool: (name, input) => executeAlfredTool(name, input, { viewer }),
    });

    return NextResponse.json({ data: { reply } });
  } catch (error) {
    if (error instanceof AlfredNotConfiguredError) {
      return toErrorResponse(
        new AppError(
          "O Alfred ainda não está configurado nesta plataforma — peça para o administrador configurar a chave de API.",
          503,
          "ALFRED_NOT_CONFIGURED",
        ),
      );
    }
    return toErrorResponse(error);
  }
}
