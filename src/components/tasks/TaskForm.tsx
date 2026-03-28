"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";

interface LinkedRecord {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Record<string, unknown> | null;
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function TaskForm({ open, onOpenChange, initialData }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEditing = !!initialData;

  const [contacts, setContacts] = useState<LinkedRecord[]>([]);
  const [deals, setDeals] = useState<LinkedRecord[]>([]);
  const [companies, setCompanies] = useState<LinkedRecord[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    status: "TODO",
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
        title: (initialData.title as string) || "",
        description: (initialData.description as string) || "",
        dueDate: initialData.dueDate
          ? toDateInputValue(new Date(initialData.dueDate as string))
          : "",
        priority: (initialData.priority as string) || "MEDIUM",
        status: (initialData.status as string) || "TODO",
        contactId: (initialData.contactId as string) || "",
        dealId: (initialData.dealId as string) || "",
        companyId: (initialData.companyId as string) || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
        status: "TODO",
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

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description || undefined,
      dueDate: form.dueDate || undefined,
      priority: form.priority,
      status: form.status,
      contactId: form.contactId || undefined,
      dealId: form.dealId || undefined,
      companyId: form.companyId || undefined,
    };

    try {
      if (isEditing) {
        await updateTask.mutateAsync({ id: initialData.id as string, ...payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const pending = createTask.isPending || updateTask.isPending;

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
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                id="priority"
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
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
              {pending ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
