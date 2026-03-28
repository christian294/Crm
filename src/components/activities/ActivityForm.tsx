"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateActivity, useUpdateActivity } from "@/hooks/useActivities";

interface LinkedRecord {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Record<string, unknown> | null;
}

const TYPE_OPTIONS = [
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Meeting" },
  { value: "NOTE", label: "Note" },
  { value: "OTHER", label: "Other" },
];

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ActivityForm({ open, onOpenChange, initialData }: ActivityFormProps) {
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const isEditing = !!initialData;

  const [contacts, setContacts] = useState<LinkedRecord[]>([]);
  const [deals, setDeals] = useState<LinkedRecord[]>([]);
  const [companies, setCompanies] = useState<LinkedRecord[]>([]);

  const [form, setForm] = useState({
    type: "CALL",
    subject: "",
    description: "",
    date: toLocalDatetimeString(new Date()),
    duration: "",
    contactId: "",
    dealId: "",
    companyId: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/contacts?limit=100").then((r) => r.json()).then((res) => res.data ?? []),
        fetch("/api/deals?limit=100").then((r) => r.json()).then((res) => res.data ?? []),
        fetch("/api/companies?limit=100").then((r) => r.json()).then((res) => res.data ?? []),
      ])
        .then(([c, d, co]) => {
          setContacts(c);
          setDeals(d);
          setCompanies(co);
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({
        type: (initialData.type as string) || "CALL",
        subject: (initialData.subject as string) || "",
        description: (initialData.description as string) || "",
        date: initialData.date
          ? toLocalDatetimeString(new Date(initialData.date as string))
          : toLocalDatetimeString(new Date()),
        duration: initialData.duration != null ? String(initialData.duration) : "",
        contactId: (initialData.contactId as string) || "",
        dealId: (initialData.dealId as string) || "",
        companyId: (initialData.companyId as string) || "",
      });
    } else {
      setForm({
        type: "CALL",
        subject: "",
        description: "",
        date: toLocalDatetimeString(new Date()),
        duration: "",
        contactId: "",
        dealId: "",
        companyId: "",
      });
    }
    setError("");
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }

    const payload: Record<string, unknown> = {
      type: form.type,
      subject: form.subject.trim(),
      description: form.description || undefined,
      date: form.date ? new Date(form.date).toISOString() : undefined,
      duration: form.duration ? parseInt(form.duration, 10) : undefined,
      contactId: form.contactId || undefined,
      dealId: form.dealId || undefined,
      companyId: form.companyId || undefined,
    };

    try {
      if (isEditing) {
        await updateActivity.mutateAsync({ id: initialData.id as string, ...payload });
      } else {
        await createActivity.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const pending = createActivity.isPending || updateActivity.isPending;

  const contactOptions = contacts.map((c) => ({
    value: c.id,
    label: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || c.id,
  }));

  const dealOptions = deals.map((d) => ({
    value: d.id,
    label: d.name || d.id,
  }));

  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: c.name || c.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Activity" : "Log Activity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                placeholder="Optional"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactId">Contact</Label>
            <Select
              id="contactId"
              options={contactOptions}
              placeholder="Select a contact..."
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealId">Deal</Label>
            <Select
              id="dealId"
              options={dealOptions}
              placeholder="Select a deal..."
              value={form.dealId}
              onChange={(e) => setForm({ ...form, dealId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Company</Label>
            <Select
              id="companyId"
              options={companyOptions}
              placeholder="Select a company..."
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEditing ? "Update" : "Log Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
