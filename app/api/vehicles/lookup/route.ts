import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate");
  if (!plate || typeof plate !== "string") {
    return NextResponse.json({ error: "Missing plate" }, { status: 400 });
  }
  const normalized = plate.replace(/\s/g, "").toUpperCase();
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      numberPlate: {
        contains: normalized,
        mode: "insensitive",
      },
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });
  if (!vehicle) {
    return NextResponse.json({ customerId: null, vehicleId: null });
  }
  return NextResponse.json({
    customerId: vehicle.customerId,
    vehicleId: vehicle.id,
    customer: vehicle.customer,
    vehicle: { numberPlate: vehicle.numberPlate, make: vehicle.make, model: vehicle.model },
  });
}
