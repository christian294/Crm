"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { Header } from "@/components/layout/Header";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Edit,
  Trash2,
  FileText,
  PhoneCall,
  StickyNote,
  CheckSquare,
  DollarSign,
} from "lucide-react";

const statusVariant: Record<string, "default" | "success" | "secondary" | "destructive"> = {
  LEAD: "default",
  ACTIVE: "success",
  INACTIVE: "secondary",
  CHURNED: "destructive",
};

const stageVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  PROSPECT: "secondary",
  QUALIFIED: "default",
  PROPOSAL: "warning",
  NEGOTIATION: "warning",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
};

const priorityVariant: Record<string, "default" | "success" | "secondary" | "destructive" | "warning"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

const taskStatusVariant: Record<string, "default" | "success" | "secondary" | "destructive"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
  CANCELLED: "destructive",
};

const typeIcons: Record<string, React.ReactNode> = {
  CALL: <PhoneCall className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  MEETING: <Briefcase className="h-4 w-4" />,
  NOTE: <StickyNote className="h-4 w-4" />,
  OTHER: <FileText className="h-4 w-4" />,
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, refetch } = useContact(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [editOpen, setEditOpen] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const contact = data?.data;

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    await deleteContact.mutateAsync(id);
    router.push("/contacts");
  }

  async function handleAddNote() {
    if (!noteSubject.trim()) return;
    setNoteSubmitting(true);
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          subject: noteSubject,
          description: noteBody || undefined,
          contactId: id,
          companyId: contact?.company?.id || undefined,
        }),
      });
      setNoteSubject("");
      setNoteBody("");
      refetch();
    } catch {
      // silently fail
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleLogCall() {
    const subject = prompt("Call subject:");
    if (!subject) return;
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CALL",
        subject,
        contactId: id,
        companyId: contact?.company?.id || undefined,
      }),
    });
    refetch();
  }

  function handleCreateTask() {
    router.push(`/tasks?new=true&contactId=${id}`);
  }

  function handleCreateDeal() {
    router.push(`/deals?new=true&contactId=${id}`);
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 pb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div>
        <Header title="Contact not found" />
        <p className="text-muted-foreground">
          This contact does not exist or has been deleted.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/contacts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/contacts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.title ? (
              <p className="text-sm text-muted-foreground">{contact.title}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contact info card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">
                  {contact.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{contact.phone || "\u2014"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                {contact.company ? (
                  <button
                    className="text-sm text-primary hover:underline text-left"
                    onClick={() => router.push(`/companies/${contact.company!.id}`)}
                  >
                    {contact.company.name}
                  </button>
                ) : (
                  <p className="text-sm">{"\u2014"}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm">{contact.department || "\u2014"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <Badge variant={statusVariant[contact.status] || "secondary"}>
              {contact.status}
            </Badge>
            <Badge variant="secondary">{contact.source}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleLogCall}>
          <PhoneCall className="h-4 w-4 mr-2" />
          Log Call
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          setNoteSubject("");
          setNoteBody("");
        }}>
          <StickyNote className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        <Button variant="outline" size="sm" onClick={handleCreateTask}>
          <CheckSquare className="h-4 w-4 mr-2" />
          Create Task
        </Button>
        <Button variant="outline" size="sm" onClick={handleCreateDeal}>
          <DollarSign className="h-4 w-4 mr-2" />
          Create Deal
        </Button>
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">
            Activities ({contact.activities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals ({contact.deals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({contact.tasks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Activities tab */}
        <TabsContent value="activities">
          {contact.activities && contact.activities.length > 0 ? (
            <div className="relative mt-4">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {contact.activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-4">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                      {typeIcons[activity.type] || typeIcons.OTHER}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{activity.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.type}
                            {activity.duration != null ? (
                              <span> &middot; {activity.duration}m</span>
                            ) : null}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                        </span>
                      </div>
                      {activity.description ? (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No activities recorded yet.
            </p>
          )}
        </TabsContent>

        {/* Deals tab */}
        <TabsContent value="deals">
          {contact.deals && contact.deals.length > 0 ? (
            <div className="space-y-3 mt-4">
              {contact.deals.map((dc) => (
                <Card
                  key={dc.deal.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/deals/${dc.deal.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{dc.deal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dc.deal.currency} {Number(dc.deal.value).toLocaleString()}
                        {dc.deal.expectedCloseDate ? (
                          <span>
                            {" "}&middot; Expected close:{" "}
                            {format(new Date(dc.deal.expectedCloseDate), "MMM d, yyyy")}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Badge variant={stageVariant[dc.deal.stage] || "secondary"}>
                      {dc.deal.stage.replace("_", " ")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No deals associated with this contact.
            </p>
          )}
        </TabsContent>

        {/* Tasks tab */}
        <TabsContent value="tasks">
          {contact.tasks && contact.tasks.length > 0 ? (
            <div className="space-y-3 mt-4">
              {contact.tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description ? (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        ) : null}
                        {task.dueDate ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityVariant[task.priority] || "secondary"}>
                          {task.priority}
                        </Badge>
                        <Badge variant={taskStatusVariant[task.status] || "secondary"}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks for this contact.
            </p>
          )}
        </TabsContent>

        {/* Notes tab (quick add) */}
        <TabsContent value="notes">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Add a Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  placeholder="Subject"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Write your note here..."
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!noteSubject.trim() || noteSubmitting}
                    onClick={handleAddNote}
                  >
                    {noteSubmitting ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show existing notes from activities */}
          {contact.activities && contact.activities.filter((a) => a.type === "NOTE").length > 0 ? (
            <div className="space-y-3 mt-4">
              {contact.activities
                .filter((a) => a.type === "NOTE")
                .map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{note.subject}</p>
                          {note.description ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              {note.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(note.date), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Edit form dialog */}
      <ContactForm
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
      />
    </div>
  );
}
