"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useActivities } from "@/hooks/useActivities";
import { Header } from "@/components/layout/Header";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Activity, Plus } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Meeting" },
  { value: "NOTE", label: "Note" },
  { value: "OTHER", label: "Other" },
];

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useActivities({
    search,
    sort: "date",
    order: "desc",
    page,
    limit: 20,
    type: typeFilter || undefined,
  });

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setFormOpen(true);
    }
  }, [searchParams]);

  const activities = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <Header
        title="Activities"
        description="Track calls, emails, meetings, and notes"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search activities..."
          className="w-72"
        />
        <Select
          options={TYPE_OPTIONS}
          placeholder="All types"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

      {!isLoading && activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No activities yet"
          description="Log your first activity to start tracking interactions."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          }
        />
      ) : (
        <>
          <ActivityTimeline activities={activities} loading={isLoading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
