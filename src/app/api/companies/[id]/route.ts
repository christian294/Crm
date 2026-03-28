import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      contacts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        orderBy: { date: "desc" },
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      _count: { select: { contacts: true, deals: true, activities: true } },
    },
  });

  if (!company) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  return Response.json({ data: company });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.company.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  const body = await request.json();

  const allowedFields = [
    "name", "domain", "industry", "size", "phone", "email",
    "address", "city", "state", "zip", "country", "notes", "status",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field];
    }
  }

  const company = await prisma.company.update({
    where: { id },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ data: company });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.company.findUnique({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    return Response.json({ error: "Company not found" }, { status: 404 });
  }

  await prisma.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return Response.json({ data: { id } });
}
