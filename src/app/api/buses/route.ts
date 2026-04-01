import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const buses = await prisma.bus.findMany({
    include: { assignedDriver: { select: { id: true, fullName: true, matricule: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(buses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { busNumber, busType, capacity } = body;

  if (!busNumber || !busType || !capacity) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const existing = await prisma.bus.findUnique({ where: { busNumber } });
  if (existing) {
    return NextResponse.json({ error: "Ce numéro de bus existe déjà" }, { status: 400 });
  }

  const bus = await prisma.bus.create({
    data: { busNumber, busType, capacity: parseInt(capacity) },
    include: { assignedDriver: true },
  });

  return NextResponse.json(bus);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, busNumber, busType, capacity, isActive, assignedDriverId } = body;

    const data: Record<string, unknown> = {};
    if (busNumber !== undefined) data.busNumber = busNumber;
    if (busType !== undefined) data.busType = busType;
    if (capacity !== undefined) data.capacity = parseInt(String(capacity));
    if (isActive !== undefined) data.isActive = isActive;
    if (assignedDriverId !== undefined) data.assignedDriverId = assignedDriverId || null;

    // If assigning a driver, unassign them from any other bus first
    if (assignedDriverId) {
      await prisma.bus.updateMany({
        where: { assignedDriverId, id: { not: id } },
        data: { assignedDriverId: null },
      });
    }

    const bus = await prisma.bus.update({
      where: { id },
      data,
      include: { assignedDriver: { select: { id: true, fullName: true, matricule: true } } },
    });

    return NextResponse.json(bus);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur de mise à jour";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  try {
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: { _count: { select: { assignments: true } } },
    });
    if (bus && bus._count.assignments > 0) {
      return NextResponse.json({ error: "Impossible de supprimer : ce bus est utilisé dans des affectations" }, { status: 400 });
    }
    await prisma.bus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 400 });
  }
}
