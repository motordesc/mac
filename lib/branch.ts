import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const BRANCH_COOKIE = "mac_branch_id";

/**
 * Reads the currently selected branch ID from the request cookie.
 * Returns null when no branch is selected (→ show aggregate dashboard).
 * Works in Server Components, Server Actions, and Route Handlers. 
 */
export async function getSelectedBranchId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(BRANCH_COOKIE)?.value ?? null;
}

/**
 * Checks if the current authenticated user has access to a specific branch.
 * Super admins (defined by SUPER_ADMIN_EMAIL) bypass all checks.
 */
export async function verifyBranchAccess(branchId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  // Super admin bypass
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (superAdminEmail) {
    const clerkUser = await currentUser();
    const isSuper = clerkUser?.emailAddresses.some(
      (e) => e.emailAddress.toLowerCase() === superAdminEmail.toLowerCase()
    );
    if (isSuper) return true;
  }

  // Check UserBranch table
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { branches: true },
  });

  if (!user) return false;

  // If the user is linked to the branch in the DB
  return user.branches.some((ub: { branchId: string }) => ub.branchId === branchId);
}

/**
 * Secure version of getSelectedBranchId that also verifies access.
 * Returns null if no branch is selected OR if access is denied.
 */
export async function getAuthorizedBranchId(): Promise<string | null> {
  const branchId = await getSelectedBranchId();
  if (!branchId) return null;

  const hasAccess = await verifyBranchAccess(branchId);
  return hasAccess ? branchId : null;
}
