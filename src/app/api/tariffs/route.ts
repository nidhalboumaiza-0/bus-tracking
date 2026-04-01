import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tariffs = await prisma.tariff.findMany({
    orderBy: [{ destination: "asc" }, { busType: "asc" }],
  });
  return NextResponse.json(tariffs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { destination, busType, pricePerTrip } = body;

  if (!destination || !busType || !pricePerTrip) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const tariff = await prisma.tariff.upsert({
    where: { destination_busType: { destination, busType } },
    update: { pricePerTrip: parseFloat(pricePerTrip), effectiveDate: new Date() },
    create: { destination, busType, pricePerTrip: parseFloat(pricePerTrip) },
  });

  return NextResponse.json(tariff);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { id, pricePerTrip } = body;

  if (!id || !pricePerTrip) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const tariff = await prisma.tariff.update({
    where: { id },
    data: { pricePerTrip: parseFloat(pricePerTrip), effectiveDate: new Date() },
  });

  return NextResponse.json(tariff);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  await prisma.tariff.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
