const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const MAX_TOOL_ITERATIONS = 6;

export class AlfredNotConfiguredError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY não configurada.");
    this.name = "AlfredNotConfiguredError";
  }
}

export interface AlfredToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AlfredChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type AnthropicResponseBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

type AnthropicRequestMessage = {
  role: "user" | "assistant";
  content: string | AnthropicResponseBlock[] | AnthropicToolResultBlock[];
};

interface AnthropicResponse {
  content: AnthropicResponseBlock[];
  stop_reason: string;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  system: string,
  messages: AnthropicRequestMessage[],
  tools: AlfredToolDefinition[],
): Promise<AnthropicResponse> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API respondeu ${response.status}: ${body.slice(0, 300)}`);
  }

  return (await response.json()) as AnthropicResponse;
}

/**
 * Roda a conversa com o Alfred até obter uma resposta final em texto,
 * executando as tool calls que o modelo pedir contra a base de dados
 * (só leitura — quem decide o que cada ferramenta pode fazer é `executeTool`).
 */
export async function runAlfredConversation(options: {
  systemPrompt: string;
  history: AlfredChatMessage[];
  tools: AlfredToolDefinition[];
  executeTool: (name: string, input: Record<string, unknown>) => Promise<unknown>;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AlfredNotConfiguredError();
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const messages: AnthropicRequestMessage[] = options.history.map((message) => ({
    role: message.role,
    content: message.text,
  }));

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await callAnthropic(apiKey, model, options.systemPrompt, messages, options.tools);

    const toolUses = response.content.filter(
      (block): block is AnthropicToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) {
      const text = response.content
        .filter((block): block is AnthropicTextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      return text || "Não consegui gerar uma resposta agora. Tente reformular a pergunta.";
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: AnthropicToolResultBlock[] = await Promise.all(
      toolUses.map(async (toolUse) => {
        let content: string;
        try {
          const result = await options.executeTool(toolUse.name, toolUse.input);
          content = JSON.stringify(result);
        } catch (error) {
          content = JSON.stringify({
            error: error instanceof Error ? error.message : "Erro ao executar ferramenta.",
          });
        }
        return { type: "tool_result", tool_use_id: toolUse.id, content };
      }),
    );

    messages.push({ role: "user", content: toolResults });
  }

  return "Não consegui concluir a resposta dentro do limite de passos. Tente uma pergunta mais específica.";
}
