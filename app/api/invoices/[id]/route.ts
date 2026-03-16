import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { validateId } from "@/lib/utils/validate-id";
import { getCurrentRole } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getCurrentRole();
  if (role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  const { id: rawId } = await params;
  let id: string;
  try {
    id = validateId(rawId);
  } catch {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
