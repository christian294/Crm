"use client";

import { Phone, Mail, Calendar, FileText, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  date: string;
  duration: number | null;
  owner: { id: string; name: string };
  contact: { id: string; firstName: string; lastName: string } | null;
  deal: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
  OTHER: <MoreHorizontal className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
  OTHER: "Other",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex gap-4 pl-0">
            {/* Dot / Icon */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
              {typeIcons[activity.type] || typeIcons.OTHER}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{activity.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeLabels[activity.type] || activity.type}
                    {activity.duration != null ? (
                      <span> &middot; {formatDuration(activity.duration)}</span>
                    ) : null}
                    <span> &middot; {activity.owner.name}</span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                </span>
              </div>

              {activity.description ? (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {activity.description.length > 150
                    ? activity.description.slice(0, 150) + "..."
                    : activity.description}
                </p>
              ) : null}

              {/* Linked record chips */}
              {(activity.contact || activity.deal || activity.company) ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activity.contact ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {activity.contact.firstName} {activity.contact.lastName}
                    </Badge>
                  ) : null}
                  {activity.deal ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {activity.deal.name}
                    </Badge>
                  ) : null}
                  {activity.company ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {activity.company.name}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
