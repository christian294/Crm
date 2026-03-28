"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCompanies, useCreateCompany } from "@/hooks/useCompanies";
import { Header } from "@/components/layout/Header";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Building2, Plus } from "lucide-react";

const statusVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "success",
  PROSPECT: "default",
  INACTIVE: "secondary",
  CHURNED: "destructive",
};

export default function CompaniesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useCompanies({ search, sort, order, page, limit: 25, status: statusFilter });
  const createCompany = useCreateCompany();

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setFormOpen(true);
    }
  }, [searchParams]);

  function handleSort(key: string) {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("asc");
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.name as string}</div>
          {item.domain ? <div className="text-xs text-muted-foreground">{item.domain as string}</div> : null}
        </div>
      ),
    },
    {
      key: "industry",
      label: "Industry",
      sortable: true,
      render: (item) => <span className="text-muted-foreground">{(item.industry as string) || "\u2014"}</span>,
    },
    {
      key: "size",
      label: "Size",
      render: (item) => item.size ? <Badge variant="secondary">{item.size as string}</Badge> : <span className="text-muted-foreground">{"\u2014"}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item) => (
        <Badge variant={statusVariant[(item.status as string)] || "secondary"}>
          {item.status as string}
        </Badge>
      ),
    },
    {
      key: "_count",
      label: "Contacts",
      render: (item) => {
        const count = (item._count as Record<string, number>)?.contacts;
        return <span className="text-muted-foreground">{count ?? 0}</span>;
      },
    },
  ];

  const companies = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <Header
        title="Companies"
        description="Manage your company accounts"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Company
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search companies..."
          className="w-72"
        />
        <Select
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "PROSPECT", label: "Prospect" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "CHURNED", label: "Churned" },
          ]}
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {!isLoading && companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No companies yet"
          description="Add your first company to start tracking your accounts."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={companies}
            loading={isLoading}
            sort={sort}
            order={order}
            onSort={handleSort}
            onRowClick={(item) => router.push(`/companies/${item.id}`)}
            keyExtractor={(item) => item.id as string}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (formData) => {
          await createCompany.mutateAsync(formData);
          setFormOpen(false);
        }}
        loading={createCompany.isPending}
      />
    </div>
  );
}
