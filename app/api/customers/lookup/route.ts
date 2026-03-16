import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const phone = request.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json(null);

  const customer = await prisma.customer.findFirst({
    where: { phone: { contains: phone, mode: "insensitive" } },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      vehicles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, numberPlate: true, make: true, model: true, year: true },
      },
    },
  });

  if (!customer) return NextResponse.json(null);

  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    latestVehicle: customer.vehicles[0] ?? null,
  });
}
