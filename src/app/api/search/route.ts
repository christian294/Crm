import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return Response.json({ data: [] });
  }

  const [contacts, companies, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 5,
    }),
    prisma.company.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { domain: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, domain: true },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        deletedAt: null,
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, value: true, stage: true },
      take: 5,
    }),
  ]);

  const results = [
    ...contacts.map((c) => ({
      id: c.id,
      type: "contact" as const,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.email,
    })),
    ...companies.map((c) => ({
      id: c.id,
      type: "company" as const,
      title: c.name,
      subtitle: c.domain || undefined,
    })),
    ...deals.map((d) => ({
      id: d.id,
      type: "deal" as const,
      title: d.name,
      subtitle: `${d.stage} · $${Number(d.value).toLocaleString()}`,
    })),
  ];

  return Response.json({ data: results });
}
