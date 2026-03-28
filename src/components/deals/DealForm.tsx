"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCreateDeal, useUpdateDeal, type DealListItem } from "@/hooks/useDeals";
import { STAGE_PROBABILITY } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: DealListItem | null;
}

const STAGE_OPTIONS = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];

export function DealForm({ open, onOpenChange, deal }: DealFormProps) {
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const isEditing = !!deal;
  const manualProbabilityRef = useRef(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({
    name: "",
    value: "",
    currency: "USD",
    stage: "PROSPECT",
    probability: "10",
    expectedCloseDate: "",
    companyId: "",
    contactIds: [] as string[],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/companies?limit=100")
        .then((r) => r.json())
        .then((res) => setCompanies(res.data ?? []))
        .catch(() => {});

      fetch("/api/contacts?limit=100")
        .then((r) => r.json())
        .then((res) => setContacts(res.data ?? []))
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    manualProbabilityRef.current = false;
    if (deal) {
      setForm({
        name: deal.name,
        value: String(deal.value),
        currency: deal.currency,
        stage: deal.stage,
        probability: String(deal.probability),
        expectedCloseDate: deal.expectedCloseDate
          ? deal.expectedCloseDate.slice(0, 10)
          : "",
        companyId: deal.company?.id ?? "",
        contactIds: deal.contacts?.map((c) => c.contact.id) ?? [],
      });
    } else {
      setForm({
        name: "",
        value: "",
        currency: "USD",
        stage: "PROSPECT",
        probability: "10",
        expectedCloseDate: "",
        companyId: "",
        contactIds: [],
      });
    }
    setError("");
  }, [deal, open]);

  function handleStageChange(newStage: string) {
    const updates: Partial<typeof form> = { stage: newStage };
    if (!manualProbabilityRef.current) {
      updates.probability = String(STAGE_PROBABILITY[newStage] ?? 10);
    }
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleProbabilityChange(val: string) {
    manualProbabilityRef.current = true;
    setForm((prev) => ({ ...prev, probability: val }));
  }

  function toggleContact(contactId: string) {
    setForm((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId],
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.value) {
      setError("Name and value are required.");
      return;
    }

    const payload = {
      name: form.name,
      value: parseFloat(form.value),
      currency: form.currency,
      stage: form.stage,
      probability: parseInt(form.probability, 10),
      expectedCloseDate: form.expectedCloseDate || undefined,
      companyId: form.companyId || undefined,
      contactIds: form.contactIds.length > 0 ? form.contactIds : undefined,
    };

    try {
      if (isEditing) {
        await updateDeal.mutateAsync({ id: deal.id, ...payload });
      } else {
        await createDeal.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const pending = createDeal.isPending || updateDeal.isPending;

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Deal" : "New Deal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="deal-name">Deal Name *</Label>
            <Input
              id="deal-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Value *</Label>
              <Input
                id="deal-value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-currency">Currency</Label>
              <Select
                id="deal-currency"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-stage">Stage</Label>
              <Select
                id="deal-stage"
                options={STAGE_OPTIONS}
                value={form.stage}
                onChange={(e) => handleStageChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-probability">Probability (%)</Label>
              <Input
                id="deal-probability"
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => handleProbabilityChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-close-date">Expected Close Date</Label>
            <Input
              id="deal-close-date"
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) =>
                setForm({ ...form, expectedCloseDate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-company">Company</Label>
            <Select
              id="deal-company"
              options={companyOptions}
              placeholder="Select a company..."
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            />
          </div>

          {contacts.length > 0 && (
            <div className="space-y-2">
              <Label>Contacts</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                {contacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.contactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="rounded border-input"
                    />
                    {contact.firstName} {contact.lastName}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEditing ? "Update Deal" : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
