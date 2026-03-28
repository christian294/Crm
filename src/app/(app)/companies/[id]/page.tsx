"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useCompany, useUpdateCompany, useDeleteCompany } from "@/hooks/useCompanies";
import { Header } from "@/components/layout/Header";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  User,
  Briefcase,
  Clock,
  StickyNote,
  ArrowLeft,
} from "lucide-react";

const statusVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "success",
  PROSPECT: "default",
  INACTIVE: "secondary",
  CHURNED: "destructive",
};

const dealStageVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  PROSPECT: "secondary",
  QUALIFIED: "default",
  PROPOSAL: "warning",
  NEGOTIATION: "warning",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
};

const activityTypeVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  CALL: "default",
  EMAIL: "secondary",
  MEETING: "warning",
  NOTE: "success",
  OTHER: "secondary",
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48 col-span-2" />
      </div>
    </div>
  );
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useCompany(id);
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteText, setNoteText] = useState("");

  const company = data?.data;

  async function handleDelete() {
    await deleteCompany.mutateAsync(id);
    router.push("/companies");
  }

  async function handleNoteSave() {
    if (!noteText.trim()) return;
    const existingNotes = (company?.notes as string) || "";
    const timestamp = new Date().toLocaleString();
    const updated = existingNotes
      ? `${existingNotes}\n\n[${timestamp}]\n${noteText.trim()}`
      : `[${timestamp}]\n${noteText.trim()}`;
    await updateCompany.mutateAsync({ id, notes: updated });
    setNoteText("");
  }

  if (isLoading) {
    return (
      <div>
        <Header title="Company" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div>
        <Header title="Company" />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Company not found</h2>
          <p className="text-muted-foreground mt-1">This company may have been deleted.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/companies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  const contacts = (company.contacts as Array<Record<string, unknown>>) || [];
  const deals = (company.deals as Array<Record<string, unknown>>) || [];
  const activities = (company.activities as Array<Record<string, unknown>>) || [];
  const counts = company._count as Record<string, number>;

  const address = [company.address, company.city, company.state, company.zip, company.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Header
        title={company.name as string}
        description={company.industry ? `${company.industry}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/companies")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteCompany.isPending}>
                  {deleteCompany.isPending ? "Deleting..." : "Confirm"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={statusVariant[company.status as string] || "secondary"}>
                {company.status as string}
              </Badge>
              {company.size ? (
                <Badge variant="secondary">{company.size as string}</Badge>
              ) : null}
            </div>
            <DetailRow icon={<Globe className="h-4 w-4" />} label="Domain" value={company.domain as string} />
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={company.email as string} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={company.phone as string} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={address || null} />
            {company.owner ? (
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label="Owner"
                value={(company.owner as Record<string, string>).name}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{counts?.contacts ?? 0}</p>
                <p className="text-sm text-muted-foreground">Contacts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{counts?.deals ?? 0}</p>
                <p className="text-sm text-muted-foreground">Deals</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{counts?.activities ?? 0}</p>
                <p className="text-sm text-muted-foreground">Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          {contacts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No contacts associated with this company.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <Card
                  key={contact.id as string}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {(contact.firstName as string)?.[0]}
                        {(contact.lastName as string)?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {contact.firstName as string} {contact.lastName as string}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.email as string}
                          {contact.title ? ` · ${contact.title as string}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={contact.status === "ACTIVE" ? "success" : "secondary"}>
                      {contact.status as string}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals">
          {deals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No deals associated with this company.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deals.map((deal) => (
                <Card
                  key={deal.id as string}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{deal.name as string}</CardTitle>
                      <Badge variant={dealStageVariant[deal.stage as string] || "secondary"}>
                        {(deal.stage as string).replace("_", " ")}
                      </Badge>
                    </div>
                    <CardDescription>
                      {deal.currency as string}{" "}
                      {Number(deal.value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {deal.probability != null ? (
                        <span>Probability: {deal.probability as number}%</span>
                      ) : null}
                      {deal.expectedCloseDate ? (
                        <span>
                          Close: {new Date(deal.expectedCloseDate as string).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No activities recorded for this company.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {activities.map((activity) => {
                  const contact = activity.contact as Record<string, string> | null;
                  return (
                    <div key={activity.id as string} className="relative pl-10">
                      <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <Card>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={activityTypeVariant[activity.type as string] || "secondary"}>
                                {activity.type as string}
                              </Badge>
                              <span className="text-sm font-medium">{activity.subject as string}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.date as string).toLocaleDateString()}{" "}
                              {new Date(activity.date as string).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {activity.description ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description as string}
                            </p>
                          ) : null}
                          {contact ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Contact: {contact.firstName} {contact.lastName}
                            </p>
                          ) : null}
                          {activity.duration != null ? (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {activity.duration as number} min
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.notes ? (
                <div className="whitespace-pre-wrap text-sm bg-muted/50 rounded-md p-4">
                  {company.notes as string}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  placeholder="Add a note..."
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleNoteSave}
                    disabled={!noteText.trim() || updateCompany.isPending}
                  >
                    {updateCompany.isPending ? "Saving..." : "Add Note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CompanyForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={async (formData) => {
          await updateCompany.mutateAsync({ id, ...formData });
          setEditOpen(false);
        }}
        loading={updateCompany.isPending}
        initialData={company}
      />
    </div>
  );
}
