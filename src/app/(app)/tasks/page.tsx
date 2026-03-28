"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTasks, useCreateTask, useUpdateTaskStatus } from "@/hooks/useTasks";
import { Header } from "@/components/layout/Header";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CheckSquare, Plus } from "lucide-react";
import { format, isPast } from "date-fns";

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const QUICK_ADD_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const priorityVariant: Record<string, "secondary" | "default" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

const statusVariant: Record<string, "secondary" | "default" | "success" | "outline"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
  CANCELLED: "outline",
};

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

function cycleStatus(current: string): string {
  if (current === "TODO") return "IN_PROGRESS";
  if (current === "IN_PROGRESS") return "DONE";
  return current;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string };
  [key: string]: unknown;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("dueDate");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Quick-add state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [quickPriority, setQuickPriority] = useState("MEDIUM");

  const { data, isLoading } = useTasks({
    search,
    sort,
    order,
    page,
    limit: 20,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    overdue: overdueFilter ? "true" : undefined,
  });

  const createTask = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();

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

  function handleStatusClick(task: TaskRecord) {
    const next = cycleStatus(task.status);
    if (next !== task.status) {
      updateTaskStatus.mutate({ id: task.id, status: next });
    }
  }

  async function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    await createTask.mutateAsync({
      title: quickTitle.trim(),
      dueDate: quickDueDate || undefined,
      priority: quickPriority,
    });
    setQuickTitle("");
    setQuickDueDate("");
    setQuickPriority("MEDIUM");
  }

  const columns: Column<TaskRecord>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      className: "min-w-[200px]",
      render: (item) => (
        <div>
          <div className="font-medium">{item.title}</div>
          {item.description ? (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {item.description.length > 80
                ? item.description.slice(0, 80) + "..."
                : item.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item) => (
        <Badge
          variant={statusVariant[item.status] || "secondary"}
          className={
            item.status !== "DONE" && item.status !== "CANCELLED"
              ? "cursor-pointer hover:opacity-80"
              : ""
          }
          onClick={(e) => {
            e.stopPropagation();
            handleStatusClick(item);
          }}
        >
          {statusLabels[item.status] || item.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (item) => (
        <Badge variant={priorityVariant[item.priority] || "secondary"}>
          {item.priority}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (item) => {
        if (!item.dueDate) return <span className="text-muted-foreground">{"\u2014"}</span>;
        const date = new Date(item.dueDate);
        const overdue =
          isPast(date) && item.status !== "DONE" && item.status !== "CANCELLED";
        return (
          <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      key: "linked",
      label: "Linked",
      render: (item) => {
        const chips: string[] = [];
        if (item.contact) chips.push(`${item.contact.firstName} ${item.contact.lastName}`);
        if (item.deal) chips.push(item.deal.name);
        if (item.company) chips.push(item.company.name);
        if (chips.length === 0) return <span className="text-muted-foreground">{"\u2014"}</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {chip}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "owner",
      label: "Owner",
      render: (item) => (
        <span className="text-muted-foreground text-sm">{item.owner.name}</span>
      ),
    },
  ];

  const tasks = (data?.data || []) as TaskRecord[];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <Header
        title="Tasks"
        description="Manage your to-dos and follow-ups"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        }
      />

      {/* Quick-add row */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border bg-muted/30">
        <Input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add task..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
        />
        <Input
          type="date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          className="w-40"
        />
        <Select
          options={QUICK_ADD_PRIORITY_OPTIONS}
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value)}
          className="w-32"
        />
        <Button
          onClick={handleQuickAdd}
          disabled={!quickTitle.trim() || createTask.isPending}
          size="sm"
        >
          {createTask.isPending ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search tasks..."
          className="w-72"
        />
        <Select
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Select
          options={PRIORITY_OPTIONS}
          placeholder="All priorities"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Button
          variant={overdueFilter ? "destructive" : "outline"}
          size="sm"
          onClick={() => { setOverdueFilter(!overdueFilter); setPage(1); }}
        >
          Overdue
        </Button>
      </div>

      {!isLoading && tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6" />}
          title="No tasks yet"
          description="Create your first task to start tracking your work."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tasks}
            loading={isLoading}
            sort={sort}
            order={order}
            onSort={handleSort}
            keyExtractor={(item) => item.id}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
