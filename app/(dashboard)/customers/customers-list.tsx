"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  _count: { vehicles: number; jobCards: number };
};

export function CustomersList({
  customers,
  totalPages,
  currentPage,
  search,
}: {
  customers: Customer[];
  totalPages: number;
  currentPage: number;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("search", q);
    else params.delete("search");
    params.delete("page");
    startTransition(() => router.push(`/customers?${params.toString()}`));
  }

  if (customers.length === 0) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            name="q"
            defaultValue={search}
            placeholder="Search by name or phone"
            className="max-w-xs"
          />
          <Button type="submit" disabled={isPending}>
            Search
          </Button>
        </form>
        <p className="py-8 text-center text-muted-foreground">No customers found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Search by name or phone"
          className="max-w-xs"
        />
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
      </form>
      <div className="space-y-3">
        {customers.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">{c.name}</p>
            <p className="text-sm text-muted-foreground">
              {c.phone} · {c._count.vehicles} vehicles · {c._count.jobCards} job cards
            </p>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/customers?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              >
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/customers?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
