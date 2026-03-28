import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { STAGE_PROBABILITY } from "@/lib/utils";
import { NextRequest } from "next/server";
import { DealStage } from "@prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const deal = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true, avatarUrl: true } },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                title: true,
              },
            },
          },
        },
        activities: {
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { date: "desc" },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!deal) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    return Response.json({ data: deal });
  } catch {
    return Response.json({ error: "Failed to fetch deal" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      select: { stage: true },
    });

    if (!existing) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    const { name, value, currency, stage, probability, expectedCloseDate, companyId, contactIds } = body;

    // Auto-update probability when stage changes and probability wasn't explicitly set
    let finalProbability = probability;
    if (stage && stage !== existing.stage && finalProbability === undefined) {
      finalProbability = STAGE_PROBABILITY[stage as DealStage];
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (currency !== undefined) updateData.currency = currency;
    if (stage !== undefined) updateData.stage = stage;
    if (finalProbability !== undefined) updateData.probability = finalProbability;
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (companyId !== undefined) updateData.companyId = companyId || null;

    // Handle contact associations
    if (contactIds !== undefined) {
      await prisma.dealContact.deleteMany({ where: { dealId: id } });
      if (contactIds.length > 0) {
        await prisma.dealContact.createMany({
          data: contactIds.map((contactId: string) => ({ dealId: id, contactId })),
        });
      }
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
    return Response.json({ error: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    await requireUser();
    const { id } = await params;

    const existing = await prisma.deal.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    await prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return Response.json({ data: { id } });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Failed to delete deal" }, { status: 500 });
  }
}
