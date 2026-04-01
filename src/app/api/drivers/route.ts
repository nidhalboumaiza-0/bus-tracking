import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const drivers = await prisma.driver.findMany({
    include: { assignedBus: { select: { id: true, busNumber: true, busType: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { matricule, fullName, phone } = body;

  if (!matricule || !fullName || !phone) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const existing = await prisma.driver.findUnique({ where: { matricule } });
  if (existing) {
    return NextResponse.json({ error: "Ce matricule existe déjà" }, { status: 400 });
  }

  const driver = await prisma.driver.create({
    data: { matricule, fullName, phone },
    include: { assignedBus: true },
  });

  return NextResponse.json(driver);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, matricule, fullName, phone, isActive } = body;

    const data: Record<string, unknown> = {};
    if (matricule !== undefined) data.matricule = matricule;
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;

    const driver = await prisma.driver.update({
      where: { id },
      data,
      include: { assignedBus: { select: { id: true, busNumber: true, busType: true } } },
    });

    return NextResponse.json(driver);
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
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { _count: { select: { assignments: true } } },
    });
    if (driver && driver._count.assignments > 0) {
      return NextResponse.json({ error: "Impossible de supprimer : ce chauffeur est utilisé dans des affectations" }, { status: 400 });
    }
    // Unassign from bus if assigned
    await prisma.bus.updateMany({ where: { assignedDriverId: id }, data: { assignedDriverId: null } });
    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 400 });
  }
}
