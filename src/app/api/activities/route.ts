import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "date";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const filterType = searchParams.get("filter[type]") || undefined;
  const filterContactId = searchParams.get("filter[contactId]") || undefined;
  const filterDealId = searchParams.get("filter[dealId]") || undefined;
  const filterCompanyId = searchParams.get("filter[companyId]") || undefined;

  const where: Record<string, unknown> = {};

  if (search) {
    where.subject = { contains: search, mode: "insensitive" };
  }
  if (filterType) {
    where.type = filterType;
  }
  if (filterContactId) {
    where.contactId = filterContactId;
  }
  if (filterDealId) {
    where.dealId = filterDealId;
  }
  if (filterCompanyId) {
    where.companyId = filterCompanyId;
  }

  const allowedSortFields = ["date", "subject", "type", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sort) ? sort : "date";

  const [data, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return Response.json({
    data,
    meta: { total, page, limit },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, subject, description, date, duration, contactId, dealId, companyId } = body;

  if (!type || !subject) {
    return Response.json({ error: "Type and subject are required" }, { status: 400 });
  }

  const validTypes = ["CALL", "EMAIL", "MEETING", "NOTE", "OTHER"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid activity type" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      type,
      subject,
      description: description || null,
      date: date ? new Date(date) : new Date(),
      duration: duration ? parseInt(duration, 10) : null,
      contactId: contactId || null,
      dealId: dealId || null,
      companyId: companyId || null,
      ownerId: session.user.id,
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return Response.json({ data: activity }, { status: 201 });
}
