import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const status = searchParams.get("filter[status]") || undefined;

  const where: Prisma.CompanyWhereInput = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(status && { status: status as Prisma.CompanyWhereInput["status"] }),
  };

  const allowedSortFields = ["name", "industry", "status", "size", "createdAt", "updatedAt"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";

  const [data, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { contacts: true, deals: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return Response.json({ data, meta: { total, page, limit } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ error: "Company name is required" }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      name: body.name.trim(),
      domain: body.domain || null,
      industry: body.industry || null,
      size: body.size || undefined,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      country: body.country || null,
      notes: body.notes || null,
      status: body.status || undefined,
      ownerId: session.user.id,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ data: company }, { status: 201 });
}
