"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useUpdateDealStage, type DealListItem } from "@/hooks/useDeals";
import { useQueryClient } from "@tanstack/react-query";

const STAGES = [
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

interface KanbanBoardProps {
  deals: DealListItem[];
  onDealClick?: (deal: DealListItem) => void;
}

export function KanbanBoard({ deals, onDealClick }: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<DealListItem | null>(null);
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, string>>({});
  const updateStage = useUpdateDealStage();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, DealListItem[]> = {};
    for (const stage of STAGES) {
      grouped[stage] = [];
    }
    for (const deal of deals) {
      const effectiveStage = optimisticMoves[deal.id] || deal.stage;
      if (grouped[effectiveStage]) {
        grouped[effectiveStage].push({ ...deal, stage: effectiveStage });
      }
    }
    return grouped;
  }, [deals, optimisticMoves]);

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const deal = deals.find((d) => d.id === dealId);

    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setOptimisticMoves((prev) => ({ ...prev, [dealId]: newStage }));

    updateStage.mutate(
      { id: dealId, stage: newStage },
      {
        onSuccess: () => {
          setOptimisticMoves((prev) => {
            const next = { ...prev };
            delete next[dealId];
            return next;
          });
          queryClient.invalidateQueries({ queryKey: ["deals"] });
        },
        onError: () => {
          // Revert optimistic update
          setOptimisticMoves((prev) => {
            const next = { ...prev };
            delete next[dealId];
            return next;
          });
        },
      }
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          const totalValue = stageDeals.reduce(
            (sum, d) => sum + Number(d.value),
            0
          );
          return (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={stageDeals}
              totalValue={totalValue}
              onDealClick={onDealClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  deals,
  totalValue,
  onDealClick,
}: {
  stage: string;
  deals: DealListItem[];
  totalValue: number;
  onDealClick?: (deal: DealListItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border bg-muted/30 ${
        isOver ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(totalValue)}
        </p>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[100px] flex-1">
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
            onClick={() => onDealClick?.(deal)}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableDealCard({
  deal,
  onClick,
}: {
  deal: DealListItem;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-30" : ""}
      onClick={onClick}
    >
      <DealCard deal={deal} />
    </div>
  );
}

function DealCard({
  deal,
  isOverlay,
}: {
  deal: DealListItem;
  isOverlay?: boolean;
}) {
  const borderColor =
    deal.stage === "CLOSED_WON"
      ? "border-l-emerald-500"
      : deal.stage === "CLOSED_LOST"
        ? "border-l-red-500"
        : "border-l-transparent";

  return (
    <div
      className={`rounded-md border border-l-4 ${borderColor} bg-background p-3 shadow-sm cursor-grab hover:shadow-md transition-shadow ${
        isOverlay ? "shadow-lg rotate-2" : ""
      }`}
    >
      <p className="text-sm font-medium truncate">{deal.name}</p>
      {deal.company ? (
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {deal.company.name}
        </p>
      ) : null}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold">
          {formatCurrency(Number(deal.value), deal.currency)}
        </span>
        {deal.owner ? (
          <Avatar name={deal.owner.name} size="sm" />
        ) : null}
      </div>
      {deal.expectedCloseDate ? (
        <p className="text-xs text-muted-foreground mt-1">
          Close: {formatDate(deal.expectedCloseDate)}
        </p>
      ) : null}
    </div>
  );
}
