import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any)?.role;
  const userId = parseInt((session.user as any)?.id);

  const where = role === "YAZAKI" ? { userId } : {};

  const requests = await prisma.request.findMany({
    where,
    include: {
      user: { select: { fullName: true } },
      lines: true,
      planning: { include: { assignments: { include: { bus: true, driver: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "YAZAKI") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const userId = parseInt((session.user as any)?.id);
  const body = await req.json();
  const { date, lines } = body;

  if (!date || !lines || lines.length === 0) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const request = await prisma.request.create({
    data: {
      userId,
      date: new Date(date),
      lines: {
        create: lines.map((line: any) => ({
          station: line.station,
          numberOfBuses: parseInt(line.numberOfBuses),
          busType: line.busType,
          shuttleTime: line.shuttleTime,
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json(request);
}
