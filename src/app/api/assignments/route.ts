import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "SRTG") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { planningId, requestLineId, busId, driverId } = body;

  if (!planningId || !requestLineId || !busId || !driverId) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  // Get the planning date and request line shuttle time
  const planning = await prisma.planning.findUnique({ where: { id: planningId } });
  if (!planning) {
    return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });
  }

  const requestLine = await prisma.requestLine.findUnique({
    where: { id: requestLineId },
  });
  if (!requestLine) {
    return NextResponse.json({ error: "Ligne de demande introuvable" }, { status: 404 });
  }

  // Check if bus is already assigned on the same date + same shuttle time in ANY planning
  const busConflict = await prisma.assignment.findFirst({
    where: {
      busId,
      planning: { date: planning.date },
      requestLine: { shuttleTime: requestLine.shuttleTime },
    },
    include: { planning: true, requestLine: true },
  });
  if (busConflict) {
    return NextResponse.json(
      { error: `Ce bus est déjà affecté à un autre planning pour la même date et le même horaire (${requestLine.shuttleTime})` },
      { status: 400 }
    );
  }

  // Check if driver is already assigned on the same date + same shuttle time in ANY planning
  const driverConflict = await prisma.assignment.findFirst({
    where: {
      driverId,
      planning: { date: planning.date },
      requestLine: { shuttleTime: requestLine.shuttleTime },
    },
    include: { planning: true, requestLine: true },
  });
  if (driverConflict) {
    return NextResponse.json(
      { error: `Ce chauffeur est déjà affecté à un autre planning pour la même date et le même horaire (${requestLine.shuttleTime})` },
      { status: 400 }
    );
  }

  // Extract destination from station field (format: "Yazaki → Destination")
  const destination = requestLine.station.includes("→")
    ? requestLine.station.split("→").pop()?.trim() || ""
    : requestLine.station;

  const tariff = await prisma.tariff.findUnique({
    where: { destination_busType: { destination, busType: requestLine.busType } },
  });

  const assignment = await prisma.assignment.create({
    data: {
      planningId,
      requestLineId,
      busId,
      driverId,
      confirmed: true,
      revenue: {
        create: {
          date: new Date(),
          amount: tariff ? tariff.pricePerTrip : 0,
        },
      },
    },
    include: { bus: true, driver: true, revenue: true },
  });

  return NextResponse.json(assignment);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "SRTG") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
