import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const [openDeals, tasksDueToday, activitiesThisWeek] = await Promise.all([
    prisma.deal.findMany({
      where: {
        ownerId: session.user.id,
        deletedAt: null,
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
      },
      select: { value: true, probability: true },
    }),
    prisma.task.count({
      where: {
        ownerId: session.user.id,
        dueDate: { gte: todayStart, lte: todayEnd },
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),
    prisma.activity.count({
      where: {
        ownerId: session.user.id,
        createdAt: { gte: weekStart },
      },
    }),
  ]);

  const weightedPipeline = openDeals.reduce(
    (sum, d) => sum + (Number(d.value) * d.probability) / 100,
    0
  );

  return Response.json({
    data: {
      openDeals: openDeals.length,
      weightedPipeline: Math.round(weightedPipeline),
      tasksDueToday,
      activitiesThisWeek,
    },
  });
}
