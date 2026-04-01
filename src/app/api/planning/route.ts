import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const plannings = await prisma.planning.findMany({
    include: {
      request: {
        include: {
          user: { select: { fullName: true } },
          lines: true,
        },
      },
      assignments: {
        include: {
          bus: true,
          driver: true,
          requestLine: true,
          revenue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plannings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "SRTG") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { requestId } = body;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { planning: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (request.planning) {
    return NextResponse.json({ error: "Un planning existe déjà" }, { status: 400 });
  }

  const planning = await prisma.planning.create({
    data: {
      requestId,
      date: request.date,
    },
  });

  await prisma.request.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  return NextResponse.json(planning);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "SRTG") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { planningId, status } = body;

  const planning = await prisma.planning.update({
    where: { id: planningId },
    data: { status },
  });

  return NextResponse.json(planning);
}
