import { z } from "zod";

export const alfredChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export type AlfredChatInput = z.infer<typeof alfredChatSchema>;
