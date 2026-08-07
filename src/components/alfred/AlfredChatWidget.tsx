"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { AlfredIcon, ChatBubbleIcon, CloseIcon, SendIcon } from "@/components/icons";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  text: "Oi! Eu sou o Alfred. Posso consultar clientes, saúde da carteira, NPS, QBR e reuniões pra te ajudar. O que você quer saber?",
};

export function AlfredChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const { reply } = await apiFetch<{ reply: string }>("/api/alfred/chat", {
        method: "POST",
        body: JSON.stringify({ messages: nextMessages }),
      });
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Não consegui falar com o Alfred agora. Tente de novo.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="glass-panel flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border-netfive-red/25 shadow-glow-red-sm">
          <div className="flex items-center gap-3 border-b border-netfive-border bg-netfive-red/10 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-netfive-red/20 text-netfive-red">
              <AlfredIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-netfive-gray-100">Alfred</p>
              <p className="truncate text-xs text-netfive-gray-500">Assistente de CS · só leitura</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat do Alfred"
              className="rounded-md p-1 text-netfive-gray-500 hover:text-netfive-gray-100"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl2 px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-netfive-red text-white"
                      : "border border-netfive-border bg-netfive-overlay/5 text-netfive-gray-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-xl2 border border-netfive-border bg-netfive-overlay/5 px-3 py-2 text-sm text-netfive-gray-500">
                  Alfred está consultando os dados...
                </div>
              </div>
            )}
          </div>

          {error && <p className="px-4 pb-1 text-xs text-netfive-red">{error}</p>}

          <div className="flex items-center gap-2 border-t border-netfive-border p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pergunte algo ao Alfred..."
              disabled={isSending}
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              aria-label="Enviar mensagem"
              className="btn-primary shrink-0 !px-3"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fechar chat do Alfred" : "Abrir chat do Alfred"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-netfive-red text-white shadow-glow-red transition-transform hover:scale-105"
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatBubbleIcon className="h-6 w-6" />}
      </button>
    </div>
  );
}
