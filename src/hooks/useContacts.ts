"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ContactFilters {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  companyId?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function useContacts(filters: ContactFilters = {}) {
  const { search, sort, order, page = 1, limit = 25, status, source, companyId } = filters;

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("filter[status]", status);
  if (source) params.set("filter[source]", source);
  if (companyId) params.set("filter[companyId]", companyId);

  return useQuery({
    queryKey: ["contacts", filters],
    queryFn: () =>
      fetchJson<{
        data: ContactListItem[];
        meta: { total: number; page: number; limit: number };
      }>(`/api/contacts?${params.toString()}`),
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contacts", id],
    queryFn: () => fetchJson<{ data: ContactDetail }>(`/api/contacts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactPayload) =>
      fetchJson("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateContactPayload & { id: string }) =>
      fetchJson(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts", variables.id] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Types

export interface ContactListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  department: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
}

export interface ContactDetail extends ContactListItem {
  metadata: unknown;
  deals: {
    deal: {
      id: string;
      name: string;
      value: string;
      currency: string;
      stage: string;
      expectedCloseDate: string | null;
    };
  }[];
  activities: {
    id: string;
    type: string;
    subject: string;
    description: string | null;
    date: string;
    duration: number | null;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    priority: string;
    status: string;
  }[];
}

export interface CreateContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  status?: string;
  source?: string;
  companyId?: string;
}

export type UpdateContactPayload = Partial<CreateContactPayload>;
