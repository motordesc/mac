import { streamText, convertToModelMessages, validateUIMessages } from "ai";
import { openrouter, FREE_MODEL } from "@/lib/ai/openrouter";
import { aiTools } from "@/lib/ai/tools";
import { auth } from "@clerk/nextjs/server";
import { getAuthorizedBranchId } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branchId = await getAuthorizedBranchId();
  let branchContext = "No specific branch selected — you have access to data from all branches.";
  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
    branchContext = `Currently viewing branch: ${branch?.name ?? branchId}. Focus on this branch unless asked about all branches.`;
  }

  const SYSTEM_PROMPT = `You are the Motor Auto Care workshop AI assistant — a smart business advisor for an automobile service shop.

${branchContext}

You help staff with:
- Job card status and workload management
- Revenue, expenses, and profit analysis
- Inventory levels and low-stock alerts
- Customer and vehicle history lookups
- Branch comparisons and performance insights
- Business growth recommendations

Use the provided tools to fetch real data. Always present numbers in Indian Rupees (₹).
Be concise, professional, and actionable. When you identify a business problem (e.g. many unpaid invoices, low stock, idle technicians), suggest a concrete next step.`;

  try {
    const body = await req.json();

    // Validate and convert using AI SDK 6 built-in functions
    const validatedMessages = await validateUIMessages(body.messages);
    const modelMessages = await convertToModelMessages(validatedMessages);

    const result = streamText({
      model: openrouter(FREE_MODEL),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: aiTools,
      maxRetries: 5,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "AI service unavailable. Please try again." },
      { status: 503 }
    );
  }
}
