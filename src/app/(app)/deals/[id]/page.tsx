"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeal, useDeleteDeal, type DealDetail } from "@/hooks/useDeals";
import { DealForm } from "@/components/deals/DealForm";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  CheckSquare,
} from "lucide-react";

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

const PRIORITY_VARIANT: Record<string, "default" | "warning" | "destructive" | "secondary"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

const STATUS_VARIANT: Record<string, "default" | "success" | "secondary" | "destructive"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
  CANCELLED: "destructive",
};

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useDeal(id);
  const deleteDeal = useDeleteDeal();
  const [editOpen, setEditOpen] = useState(false);

  const deal = data?.data as DealDetail | undefined;

  async function handleDelete() {
    if (!deal) return;
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    await deleteDeal.mutateAsync(deal.id);
    router.push("/deals");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Deal not found.</p>
        <Button variant="link" onClick={() => router.push("/deals")}>
          Back to Deals
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/deals")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Deals
        </Button>
      </div>

      <Header
        title={deal.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/activities?new=true&dealId=${deal.id}`)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Log Activity
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/tasks?new=true&dealId=${deal.id}`)}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Add Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteDeal.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(deal.value), deal.currency)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Stage</p>
              <Badge variant={STAGE_VARIANT[deal.stage] || "secondary"} className="mt-1">
                {STAGE_LABELS[deal.stage] || deal.stage}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Probability</p>
              <p className="text-sm font-medium">{deal.probability}%</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Expected Close</p>
              <p className="text-sm">
                {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "\u2014"}
              </p>
            </div>

            {deal.actualCloseDate ? (
              <div>
                <p className="text-sm text-muted-foreground">Actual Close</p>
                <p className="text-sm">{formatDate(deal.actualCloseDate)}</p>
              </div>
            ) : null}

            {deal.company ? (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <button
                  onClick={() => router.push(`/companies/${deal.company!.id}`)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline mt-0.5"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {deal.company.name}
                </button>
              </div>
            ) : null}

            {deal.owner ? (
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar
                    name={deal.owner.name}
                    src={deal.owner.avatarUrl}
                    size="sm"
                  />
                  <span className="text-sm">{deal.owner.name}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tabbed Sections */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="contacts">
            <TabsList>
              <TabsTrigger value="contacts">
                Contacts ({deal.contacts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activities">
                Activities ({deal.activities?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({deal.tasks?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              <Card>
                <CardContent className="pt-6">
                  {deal.contacts?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No contacts associated with this deal.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deal.contacts?.map(({ contact }) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={`${contact.firstName} ${contact.lastName}`}
                              size="sm"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.title ? (
                                <p className="text-xs text-muted-foreground">
                                  {contact.title}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {contact.email ? (
                              <span className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            ) : null}
                            {contact.phone ? (
                              <span className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card>
                <CardContent className="pt-6">
                  {deal.activities?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No activities recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deal.activities?.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{activity.subject}</p>
                              <Badge variant="secondary" className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                            {activity.description ? (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {activity.description}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(activity.date)}
                              </span>
                              {activity.contact ? (
                                <span>
                                  with {activity.contact.firstName}{" "}
                                  {activity.contact.lastName}
                                </span>
                              ) : null}
                              {activity.duration ? (
                                <span>{activity.duration} min</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardContent className="pt-6">
                  {deal.tasks?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No tasks created yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deal.tasks?.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <CheckSquare
                              className={`h-4 w-4 ${
                                task.status === "DONE"
                                  ? "text-emerald-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  task.status === "DONE"
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.description ? (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.dueDate ? (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(task.dueDate)}
                              </span>
                            ) : null}
                            <Badge
                              variant={PRIORITY_VARIANT[task.priority] || "secondary"}
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                            <Badge
                              variant={STATUS_VARIANT[task.status] || "secondary"}
                              className="text-xs"
                            >
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DealForm
        open={editOpen}
        onOpenChange={setEditOpen}
        deal={deal as unknown as import("@/hooks/useDeals").DealListItem}
      />
    </div>
  );
}
