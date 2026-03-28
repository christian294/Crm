"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Metrics {
  openDeals: number;
  weightedPipeline: number;
  tasksDueToday: number;
  activitiesThisWeek: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  date: string;
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const json = await res.json();
  return json.data;
}

// ─── Stage colors ────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "bg-slate-400",
  QUALIFIED: "bg-blue-400",
  PROPOSAL: "bg-indigo-400",
  NEGOTIATION: "bg-amber-400",
  CLOSED_WON: "bg-emerald-400",
  CLOSED_LOST: "bg-red-400",
};

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning" | "success" | "outline"> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "warning",
  URGENT: "destructive",
};

const ACTIVITY_ICONS: Record<string, string> = {
  CALL: "\u{1F4DE}",
  EMAIL: "\u{2709}\u{FE0F}",
  MEETING: "\u{1F91D}",
  NOTE: "\u{1F4DD}",
  OTHER: "\u{1F4CC}",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => fetchJson("/api/dashboard/metrics"),
  });

  const { data: pipeline, isLoading: pipelineLoading } = useQuery<PipelineStage[]>({
    queryKey: ["dashboard", "pipeline"],
    queryFn: () => fetchJson("/api/dashboard/pipeline"),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["dashboard", "tasks"],
    queryFn: () => fetchJson("/api/tasks?sort=dueDate&order=asc&filter[status]=TODO&limit=5"),
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["dashboard", "activities"],
    queryFn: () => fetchJson("/api/activities?sort=date&order=desc&limit=10"),
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "metrics"] });
    },
  });

  const pipelineTotal = pipeline?.reduce((sum, s) => sum + s.value, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is your CRM overview.</p>
      </div>

      {/* ── Key Metrics ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Deals"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          value={metrics?.openDeals}
          loading={metricsLoading}
        />
        <MetricCard
          title="Weighted Pipeline"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          value={metrics ? formatCurrency(metrics.weightedPipeline) : undefined}
          loading={metricsLoading}
        />
        <MetricCard
          title="Tasks Due Today"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          value={metrics?.tasksDueToday}
          loading={metricsLoading}
        />
        <MetricCard
          title="Activities This Week"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          value={metrics?.activitiesThisWeek}
          loading={metricsLoading}
        />
      </div>

      {/* ── Pipeline Chart ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : pipelineTotal > 0 ? (
            <>
              <div className="flex h-8 w-full overflow-hidden rounded-md">
                {pipeline?.map((s) =>
                  s.value > 0 ? (
                    <div
                      key={s.stage}
                      className={`${STAGE_COLORS[s.stage]} transition-all`}
                      style={{ width: `${(s.value / pipelineTotal) * 100}%` }}
                      title={`${STAGE_LABELS[s.stage]}: ${formatCurrency(s.value)}`}
                    />
                  ) : null
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {pipeline?.map((s) => (
                  <div key={s.stage} className="flex items-center gap-2 text-sm">
                    <span className={`inline-block h-3 w-3 rounded-sm ${STAGE_COLORS[s.stage]}`} />
                    <span className="text-muted-foreground">
                      {STAGE_LABELS[s.stage]}
                    </span>
                    <span className="ml-auto font-medium tabular-nums">{s.count}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(s.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No deals in the pipeline yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Two-Column: Tasks & Activities ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => completeTask.mutate(task.id)}
                      disabled={completeTask.isPending}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input transition-colors hover:border-primary hover:bg-primary/10"
                      aria-label={`Complete task: ${task.title}`}
                    >
                      {completeTask.isPending && completeTask.variables === task.id && (
                        <svg className="h-3 w-3 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {task.dueDate ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(task.dueDate)}
                          </span>
                        ) : null}
                        <Badge variant={PRIORITY_VARIANT[task.priority] ?? "outline"}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <ul className="space-y-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                      {ACTIVITY_ICONS[activity.type] ?? ACTIVITY_ICONS.OTHER}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {activity.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {activity.type}
                        {activity.contact
                          ? ` with ${activity.contact.firstName} ${activity.contact.lastName}`
                          : ""}
                        {activity.deal ? ` on ${activity.deal.name}` : ""}
                        {" \u00B7 "}
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activities.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  title,
  icon,
  value,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  value: string | number | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
