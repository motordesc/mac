"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Model config (must match lib/ai/openrouter.ts) ──────────────────────────
const CHAT_MODELS = [
  { key: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek v3 (Free)" },
  { key: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)" },
  { key: "mistralai/mistral-nemo:free", label: "Mistral Nemo (Free)" },
  { key: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash" },
  { key: "openrouter/auto", label: "Auto (OpenRouter)" },
] as const;

const DEFAULT_MODEL = CHAT_MODELS[0].key; // DeepSeek v3 (Free)

function getMessageText(message: {
  role: string;
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string {
  if (typeof message.content === "string") return message.content;
  if (message.parts) {
    const textPart = message.parts.find((p: { type: string }) => p.type === "text");
    return (textPart as { text?: string })?.text ?? "";
  }
  return "";
}

export function AIChat() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { model: selectedModel },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="space-y-4">
      {/* Model Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Model:
        </label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {CHAT_MODELS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Messages */}
      <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-lg border border-border p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Send a message to get started.</p>
        )}
        {messages.map((m: any) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 ${m.role === "user" ? "bg-muted ml-8" : "bg-muted/50 mr-8"}`}
          >
            <p className="text-xs font-medium text-muted-foreground">{m.role}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{getMessageText(m)}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about job cards, revenue, inventory..."
          className="min-h-[44px] flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="lg" disabled={isLoading} className="min-h-[44px]">
          {isLoading ? "Thinking…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
