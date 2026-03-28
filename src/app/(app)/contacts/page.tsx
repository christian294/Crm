"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { Header } from "@/components/layout/Header";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Users, Plus } from "lucide-react";

const statusVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  LEAD: "default",
  ACTIVE: "success",
  INACTIVE: "secondary",
  CHURNED: "destructive",
};

const sourceVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  MANUAL: "secondary",
  IMPORT: "default",
  WEB: "success",
  REFERRAL: "warning",
  OTHER: "secondary",
};

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useContacts({ search, sort, order, page, limit: 25, status: statusFilter });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">
            {item.firstName as string} {item.lastName as string}
          </div>
          <div className="text-xs text-muted-foreground">{item.email as string}</div>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (item) => {
        const company = item.company as { id: string; name: string } | null;
        return company ? (
          <span>{company.name}</span>
        ) : (
          <span className="text-muted-foreground">{"\u2014"}</span>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (item) => (
        <span className="text-muted-foreground">{(item.phone as string) || "\u2014"}</span>
      ),
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
      key: "source",
      label: "Source",
      sortable: true,
      render: (item) => (
        <Badge variant={sourceVariant[(item.source as string)] || "secondary"}>
          {item.source as string}
        </Badge>
      ),
    },
  ];

  const contacts = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <Header
        title="Contacts"
        description="Manage your contacts and leads"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search contacts..."
          className="w-72"
        />
        <Select
          options={[
            { value: "LEAD", label: "Lead" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "CHURNED", label: "Churned" },
          ]}
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {!isLoading && contacts.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No contacts yet"
          description="Add your first contact to start building relationships."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={contacts}
            loading={isLoading}
            sort={sort}
            order={order}
            onSort={handleSort}
            onRowClick={(item) => router.push(`/contacts/${item.id}`)}
            keyExtractor={(item) => item.id as string}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
