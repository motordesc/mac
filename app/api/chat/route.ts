import { streamText, convertToModelMessages } from "ai";
import { openrouter, FREE_MODEL } from "@/lib/ai/openrouter";
import { aiTools } from "@/lib/ai/tools";

const SYSTEM_PROMPT = `You are the Motor Auto Care workshop AI assistant. You help staff with questions about job cards, customers, vehicles, inventory, and revenue. Use the provided tools to fetch real data when the user asks about business metrics. Answer concisely and in a helpful tone.`;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Array<{ role: string; content: string; id?: string }> };
  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: openrouter(FREE_MODEL),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: aiTools,
    maxSteps: 3,
  });
  return result.toUIMessageStreamResponse();
}
