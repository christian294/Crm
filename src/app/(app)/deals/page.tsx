"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeals, type DealListItem } from "@/hooks/useDeals";
import { Header } from "@/components/layout/Header";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { KanbanBoard } from "@/components/deals/KanbanBoard";
import { DealForm } from "@/components/deals/DealForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Plus, LayoutGrid, Table } from "lucide-react";

const STAGE_VARIANT: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  PROSPECT: "secondary",
  QUALIFIED: "default",
  PROPOSAL: "warning",
  NEGOTIATION: "default",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
};

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const STAGE_FILTER_OPTIONS = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

export default function DealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [stageFilter, setStageFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealListItem | null>(null);

  const limit = view === "kanban" ? 200 : 25;
  const { data, isLoading } = useDeals({
    search,
    sort,
    order,
    page: view === "kanban" ? 1 : page,
    limit,
    stage: stageFilter || undefined,
  });

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

  const columns: Column<DealListItem>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "company",
      label: "Company",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.company?.name || "\u2014"}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      render: (item) => (
        <span className="font-medium">
          {formatCurrency(Number(item.value), item.currency)}
        </span>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      render: (item) => (
        <Badge variant={STAGE_VARIANT[item.stage] || "secondary"}>
          {STAGE_LABELS[item.stage] || item.stage}
        </Badge>
      ),
    },
    {
      key: "probability",
      label: "Probability",
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground">{item.probability}%</span>
      ),
    },
    {
      key: "expectedCloseDate",
      label: "Expected Close",
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground">
          {item.expectedCloseDate
            ? new Date(item.expectedCloseDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "\u2014"}
        </span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (item) =>
        item.owner ? (
          <div className="flex items-center gap-2">
            <Avatar name={item.owner.name} size="sm" />
            <span className="text-sm">{item.owner.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{"\u2014"}</span>
        ),
    },
  ];

  const deals = (data?.data || []) as DealListItem[];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <Header
        title="Deals"
        description="Track and manage your sales pipeline"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search deals..."
          className="w-72"
        />
        <Select
          options={STAGE_FILTER_OPTIONS}
          placeholder="All stages"
          value={stageFilter}
          onChange={(e) => {
            setStageFilter(e.target.value);
            setPage(1);
          }}
          className="w-44"
        />
        <div className="ml-auto flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </button>
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
              view === "table"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Table className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

      {!isLoading && deals.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-6 w-6" />}
          title="No deals yet"
          description="Create your first deal to start tracking your pipeline."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard
          deals={deals}
          onDealClick={(deal) => router.push(`/deals/${deal.id}`)}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={deals}
            loading={isLoading}
            sort={sort}
            order={order}
            onSort={handleSort}
            onRowClick={(item) => router.push(`/deals/${item.id}`)}
            keyExtractor={(item) => item.id}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <DealForm
        open={formOpen || !!editingDeal}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingDeal(null);
          }
        }}
        deal={editingDeal}
      />
    </div>
  );
}
