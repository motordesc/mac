"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/constants";

/**
 * Returns true if the currently signed-in Clerk user's primary email
 * matches the SUPER_ADMIN_EMAIL environment variable.
 *
 * Super admins bypass all role checks and are auto-provisioned in the DB.
 * Set SUPER_ADMIN_EMAIL in your .env.local to designate the super admin.
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
 * Ensures the caller is authenticated AND has a provisioned DB account.
 * Super admins are always allowed through regardless of DB record.
 * Throws with clear messages so form error toasts are informative.
 */
export async function requireAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: You must be signed in to perform this action.");
  }

  // Super admin always passes — auto-provision if needed
  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true },
    });
    if (!user) {
      // Should not happen because getCurrentUser() auto-provisions super admins,
      // but guard here just in case.
      throw new Error(
        "Super admin account not yet provisioned. Please visit the dashboard first to initialize."
      );
    }
    return user;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { role: true },
  });

  if (!user) {
    throw new Error(
      "Access denied: Your account has not been provisioned yet. Contact an administrator."
    );
  }

  return user;
}

/**
 * Requires the caller to hold one of the specified roles.
 * Super admins bypass all role requirements.
 */
export async function requireRole(allowed: AppRole[]) {
  // Super admin bypasses all role restrictions
  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    return requireAuthenticatedUser();
  }

  const user = await requireAuthenticatedUser();
  const roleName = user.role?.name as AppRole | undefined;

  if (!roleName || !allowed.includes(roleName)) {
    throw new Error(
      `Forbidden: This action requires one of the following roles: ${allowed.join(", ")}.`
    );
  }

  return user;
}
