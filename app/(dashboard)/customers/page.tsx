import Link from "next/link";
import { getCustomers } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { CustomersList } from "./customers-list";

type SearchParams = { search?: string; page?: string };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { search, page } = await searchParams;
  const { items, total, page: currentPage, totalPages } = await getCustomers({
    search: search ?? undefined,
    page: page ? parseInt(page, 10) : 1,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button asChild size="lg">
          <Link href="/customers/new">
            <Plus className="mr-2 size-5" />
            New Customer
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersList
            customers={items}
            totalPages={totalPages}
            currentPage={currentPage}
            search={search ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
