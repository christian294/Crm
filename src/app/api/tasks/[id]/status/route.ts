import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body;

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
  if (!status || !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status. Must be one of: TODO, IN_PROGRESS, DONE, CANCELLED" }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return Response.json({ data: task });
}
