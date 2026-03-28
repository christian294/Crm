import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "dueDate";
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const filterStatus = searchParams.get("filter[status]") || undefined;
  const filterPriority = searchParams.get("filter[priority]") || undefined;
  const filterOverdue = searchParams.get("filter[overdue]") || undefined;

  const where: Record<string, unknown> = {};

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }
  if (filterStatus) {
    where.status = filterStatus;
  }
  if (filterPriority) {
    where.priority = filterPriority;
  }
  if (filterOverdue === "true") {
    where.dueDate = { lt: new Date() };
    where.status = { notIn: ["DONE", "CANCELLED"] };
  }

  const allowedSortFields = ["dueDate", "title", "priority", "status", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sort) ? sort : "dueDate";

  const [data, total] = await Promise.all([
    prisma.task.findMany({
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
    prisma.task.count({ where }),
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
  const { title, description, dueDate, priority, status, contactId, dealId, companyId } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  if (priority && !validPriorities.includes(priority)) {
    return Response.json({ error: "Invalid priority" }, { status: 400 });
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
  if (status && !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "MEDIUM",
      status: status || "TODO",
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

  return Response.json({ data: task }, { status: 201 });
}
