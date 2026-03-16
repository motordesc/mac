"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getMessageText(message: { role: string; parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (typeof message.content === "string") return message.content;
  if (message.parts) {
    const textPart = message.parts.find((p: { type: string }) => p.type === "text");
    return (textPart as { text?: string })?.text ?? "";
  }
  return "";
}

export function AIChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
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
