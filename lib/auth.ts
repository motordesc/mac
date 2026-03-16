import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/constants";

/**
 * Returns true if the currently authenticated Clerk user's email
 * matches the SUPER_ADMIN_EMAIL environment variable.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) return false;
  const clerkUser = await currentUser();
  if (!clerkUser) return false;
  return clerkUser.emailAddresses.some(
    (e) => e.emailAddress.toLowerCase() === superAdminEmail.toLowerCase()
  );
}

/**
 * Returns the DB user for the current Clerk session.
 *
 * Rules:
 * - SUPER_ADMIN_EMAIL → always auto-provisioned with Admin role on first login.
 * - Everyone else     → must be explicitly provisioned by an Admin; returns null if not found.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { role: true },
  });

  if (user) return user;

  // Only the super admin is auto-provisioned on first login.
  // All other users must be provisioned manually by an Admin.
  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    const adminRole = await prisma.role.findFirst({ where: { name: "Admin" } });
    if (!adminRole) return null;

    const clerkUser = await currentUser();
    const primaryEmail = clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;
    const fullName = clerkUser?.fullName ?? clerkUser?.firstName ?? undefined;

    return prisma.user.create({
      data: {
        clerkId: userId,
        roleId: adminRole.id,
        email: primaryEmail,
        name: fullName,
      },
      include: { role: true },
    });
  }

  // Regular user — not provisioned, no access.
  return null;
}

export async function getCurrentRole(): Promise<AppRole | null> {
  // Super admin always has Admin role
  if (await isSuperAdmin()) return "Admin";

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
  // Super admin bypasses all role checks
  if (await isSuperAdmin()) {
    return requireAuth();
  }

  const user = await requireAuth();
  const role = user.role?.name as string | undefined;
  if (!role || !allowed.includes(role as AppRole)) {
    throw new Error("Forbidden");
  }
  return user;
}
