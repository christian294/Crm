"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  Building2,
  Handshake,
  Plus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "contact" | "company" | "deal";
  title: string;
  subtitle?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  contact: Users,
  company: Building2,
  deal: Handshake,
};

const quickActions = [
  { id: "new-contact", label: "New Contact", href: "/contacts?new=true", icon: Plus },
  { id: "new-company", label: "New Company", href: "/companies?new=true", icon: Plus },
  { id: "new-deal", label: "New Deal", href: "/deals?new=true", icon: Plus },
  { id: "new-activity", label: "Log Activity", href: "/activities?new=true", icon: Activity },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const allItems = query.trim()
    ? results
    : quickActions.map((a) => ({
        id: a.id,
        type: "action" as const,
        title: a.label,
        href: a.href,
      }));

  function handleSelect(index: number) {
    const item = allItems[index];
    if (!item) return;
    onOpenChange(false);
    if ("href" in item && item.href) {
      router.push(item.href);
    } else if ("type" in item && item.type !== "action") {
      const paths: Record<string, string> = {
        contact: "/contacts",
        company: "/companies",
        deal: "/deals",
      };
      router.push(`${paths[item.type as string]}/${item.id}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="rounded-lg border bg-background shadow-lg overflow-hidden" onKeyDown={handleKeyDown}>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search contacts, companies, deals..."
              className="flex h-11 w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {!query.trim() && (
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick Actions
              </div>
            )}
            {query.trim() && loading && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {query.trim() && !loading && results.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
            {allItems.map((item, i) => {
              const Icon =
                "type" in item && item.type !== "action"
                  ? typeIcons[item.type as keyof typeof typeIcons]
                  : quickActions.find((a) => a.id === item.id)?.icon || Search;
              return (
                <button
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-left transition-colors",
                    i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(i)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.title}</div>
                    {"subtitle" in item && item.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  {"type" in item && item.type !== "action" && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.type}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
