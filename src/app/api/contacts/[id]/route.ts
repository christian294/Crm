import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, deletedAt: null, ownerId: session.user.id },
    include: {
      company: { select: { id: true, name: true } },
      deals: {
        include: {
          deal: {
            select: {
              id: true,
              name: true,
              value: true,
              currency: true,
              stage: true,
              expectedCloseDate: true,
            },
          },
        },
      },
      activities: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          date: true,
          duration: true,
        },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          priority: true,
          status: true,
        },
      },
    },
  });

  if (!contact) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  return Response.json({ data: contact });
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

  const existing = await prisma.contact.findFirst({
    where: { id, deletedAt: null, ownerId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, title, department, status, source, companyId, metadata } = body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(status !== undefined && { status }),
        ...(source !== undefined && { source }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return Response.json({ data: contact });
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
    return Response.json({ error: "Failed to update contact" }, { status: 500 });
  }
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

  const existing = await prisma.contact.findFirst({
    where: { id, deletedAt: null, ownerId: session.user.id },
  });

  if (!existing) {
    return Response.json({ error: "Contact not found" }, { status: 404 });
  }

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return Response.json({ data: { id } });
}
