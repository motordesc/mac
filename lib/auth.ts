import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/constants";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { role: true },
  });
  if (!user) {
    const adminRole = await prisma.role.findFirst({ where: { name: "Admin" } });
    if (adminRole) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          roleId: adminRole.id,
        },
        include: { role: true },
      });
    }
  }
  return user;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  if (!user?.role?.name) return null;
  const name = user.role.name as string;
  if (["Admin", "Manager", "Technician"].includes(name)) return name as AppRole;
  return null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(allowed: AppRole[]) {
  const user = await requireAuth();
  const role = user.role?.name as string | undefined;
  if (!role || !allowed.includes(role as AppRole))
    throw new Error("Forbidden");
  return user;
}
