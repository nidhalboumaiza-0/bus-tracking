import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, fullName, role } = body;

  if (!username || !password || !fullName || !role) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password: hashedPassword, fullName, role },
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { id, username, fullName, role, password } = body;

  const data: any = { username, fullName, role };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { requests: true } } },
    });
    if (user && user._count.requests > 0) {
      return NextResponse.json({ error: "Impossible de supprimer : cet utilisateur a des demandes associées" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
