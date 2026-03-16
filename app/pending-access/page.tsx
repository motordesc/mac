import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { ShieldOff, Clock } from "lucide-react";

export const metadata = { title: "Access Pending | Motor Auto Care" };

export default async function PendingAccessPage() {
  const { userId } = await auth();

  // Not signed in → go to sign-in
  if (!userId) redirect("/sign-in");

  // If the user is now provisioned, redirect to dashboard
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? "unknown";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <ShieldOff className="size-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Access Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your account <span className="font-medium text-foreground">{email}</span> has been
            registered but has not yet been granted access.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Clock className="size-4 shrink-0" />
            <span>Please contact your Motor Auto Care administrator to be provisioned.</span>
          </div>
          <div className="pt-2">
            <SignOutButton redirectUrl="/sign-in">
              <Button variant="outline" className="w-full">
                Sign out
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
