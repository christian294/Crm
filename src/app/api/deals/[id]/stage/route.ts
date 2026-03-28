import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { STAGE_PROBABILITY } from "@/lib/utils";
import { NextRequest } from "next/server";
import { DealStage } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const { stage, manualProbability } = body;

    if (!stage) {
      return Response.json({ error: "Stage is required" }, { status: 400 });
    }

    const validStages: DealStage[] = [
      "PROSPECT",
      "QUALIFIED",
      "PROPOSAL",
      "NEGOTIATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ];

    if (!validStages.includes(stage)) {
      return Response.json({ error: "Invalid stage" }, { status: 400 });
    }

    const existing = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, stage: true },
    });

    if (!existing) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { stage };

    // Auto-set probability unless manual override requested
    if (!manualProbability) {
      updateData.probability = STAGE_PROBABILITY[stage] ?? 10;
    }

    // Set actualCloseDate for closed stages
    if (stage === "CLOSED_WON" || stage === "CLOSED_LOST") {
      updateData.actualCloseDate = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        contacts: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    return Response.json({ data: deal });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Failed to update deal stage" }, { status: 500 });
  }
}
