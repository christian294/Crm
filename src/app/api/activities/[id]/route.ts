import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const includeRelations = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: includeRelations,
  });

  if (!activity) {
    return Response.json({ error: "Activity not found" }, { status: 404 });
  }

  return Response.json({ data: activity });
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

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Activity not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, subject, description, date, duration, contactId, dealId, companyId } = body;

  if (type) {
    const validTypes = ["CALL", "EMAIL", "MEETING", "NOTE", "OTHER"];
    if (!validTypes.includes(type)) {
      return Response.json({ error: "Invalid activity type" }, { status: 400 });
    }
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(subject !== undefined && { subject }),
      ...(description !== undefined && { description: description || null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(duration !== undefined && { duration: duration ? parseInt(duration, 10) : null }),
      ...(contactId !== undefined && { contactId: contactId || null }),
      ...(dealId !== undefined && { dealId: dealId || null }),
      ...(companyId !== undefined && { companyId: companyId || null }),
    },
    include: includeRelations,
  });

  return Response.json({ data: activity });
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

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Activity not found" }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id } });

  return Response.json({ data: { id } });
}
