import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-utils";
import { STAGE_PROBABILITY } from "@/lib/utils";
import { NextRequest } from "next/server";
import { DealStage, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const search = url.searchParams.get("search") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = (url.searchParams.get("order") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const stageFilter = url.searchParams.get("filter[stage]");
    const companyIdFilter = url.searchParams.get("filter[companyId]");

    const where: Prisma.DealWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { company: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(stageFilter && { stage: stageFilter as DealStage }),
      ...(companyIdFilter && { companyId: companyIdFilter }),
    };

    const [data, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          contacts: {
            include: {
              contact: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          _count: { select: { activities: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return Response.json({
      data,
      meta: { total, page, limit },
    });
  } catch {
    return Response.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { name, value, currency, stage, probability, expectedCloseDate, companyId, contactIds } = body;

    if (!name || value === undefined) {
      return Response.json({ error: "Name and value are required" }, { status: 400 });
    }

    const dealStage: DealStage = stage || "PROSPECT";
    const dealProbability = probability ?? STAGE_PROBABILITY[dealStage] ?? 10;

    const deal = await prisma.deal.create({
      data: {
        name,
        value,
        currency: currency || "USD",
        stage: dealStage,
        probability: dealProbability,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ownerId: user.id,
        companyId: companyId || null,
        ...(contactIds?.length && {
          contacts: {
            create: contactIds.map((contactId: string) => ({ contactId })),
          },
        }),
      },
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

    return Response.json({ data: deal }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return Response.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
