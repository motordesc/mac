import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <h1 className="text-2xl font-semibold">Motor Auto Care</h1>
        <p className="text-muted-foreground">Welcome to your CRM dashboard.</p>
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <h1 className="text-3xl font-bold">Motor Auto Care</h1>
      <p className="max-w-md text-center text-muted-foreground">
        AI-powered workshop management. Sign in to access your dashboard.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    </div>
  );
}
