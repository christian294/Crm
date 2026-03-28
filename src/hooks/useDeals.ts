"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DealFilters {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  stage?: string;
  companyId?: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useDeals(filters: DealFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.stage) params.set("filter[stage]", filters.stage);
  if (filters.companyId) params.set("filter[companyId]", filters.companyId);

  const qs = params.toString();

  return useQuery<{ data: DealListItem[]; meta: { total: number; page: number; limit: number } }>({
    queryKey: ["deals", filters],
    queryFn: () => fetchJson(`/api/deals${qs ? `?${qs}` : ""}`),
  });
}

export function useDeal(id: string | undefined) {
  return useQuery<{ data: DealDetail }>({
    queryKey: ["deals", id],
    queryFn: () => fetchJson(`/api/deals/${id}`),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealPayload) =>
      fetchJson("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateDealPayload>) =>
      fetchJson(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/deals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      manualProbability,
    }: {
      id: string;
      stage: string;
      manualProbability?: boolean;
    }) =>
      fetchJson(`/api/deals/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, manualProbability }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// Types

export interface DealListItem {
  id: string;
  name: string;
  value: string;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
  contacts: {
    contact: { id: string; firstName: string; lastName: string };
  }[];
  _count: { activities: number };
}

export interface DealDetail extends DealListItem {
  metadata: unknown;
  owner: { id: string; name: string; avatarUrl: string | null } | null;
  contacts: {
    contact: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      title: string | null;
    };
  }[];
  activities: {
    id: string;
    type: string;
    subject: string;
    description: string | null;
    date: string;
    duration: number | null;
    contact: { id: string; firstName: string; lastName: string } | null;
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

export interface CreateDealPayload {
  name: string;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expectedCloseDate?: string;
  companyId?: string;
  contactIds?: string[];
}
