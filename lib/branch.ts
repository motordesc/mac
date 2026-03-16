import { cookies } from "next/headers";

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
