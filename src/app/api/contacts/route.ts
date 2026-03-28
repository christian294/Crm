import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? "createdAt";
  const order = (params.get("order") ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "25", 10)));
  const filterStatus = params.get("filter[status]");
  const filterSource = params.get("filter[source]");
  const filterCompanyId = params.get("filter[companyId]");

  const where: Prisma.ContactWhereInput = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filterStatus) {
    where.status = filterStatus as Prisma.EnumContactStatusFilter;
  }

  if (filterSource) {
    where.source = filterSource as Prisma.EnumContactSourceFilter;
  }

  if (filterCompanyId) {
    where.companyId = filterCompanyId;
  }

  const allowedSortFields = ["firstName", "lastName", "email", "status", "source", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.contact.count({ where }),
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

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, title, department, status, source, companyId, metadata } = body;

    if (!firstName || !lastName || !email) {
      return Response.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        title: title ?? null,
        department: department ?? null,
        status: status ?? "LEAD",
        source: source ?? "MANUAL",
        companyId: companyId ?? null,
        metadata: metadata ?? null,
        ownerId: session.user.id,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return Response.json({ data: contact }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "A contact with this email already exists" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
