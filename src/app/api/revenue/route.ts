import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const revenues = await prisma.revenue.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      assignment: {
        include: {
          bus: true,
          driver: true,
          requestLine: true,
          planning: {
            include: {
              request: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const totalRevenue = revenues.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0);

  const dailyRevenues: Record<string, { date: string; total: number; details: any[] }> = {};

  revenues.forEach((rev: any) => {
    const dateKey = rev.date.toISOString().split("T")[0];
    if (!dailyRevenues[dateKey]) {
      dailyRevenues[dateKey] = { date: dateKey, total: 0, details: [] };
    }
    dailyRevenues[dateKey].total += rev.amount;
    dailyRevenues[dateKey].details.push({
      bus: rev.assignment.bus.busNumber,
      busType: rev.assignment.bus.busType,
      driver: rev.assignment.driver.fullName,
      driverMatricule: rev.assignment.driver.matricule,
      station: rev.assignment.requestLine.station,
      amount: rev.amount,
    });
  });

  return NextResponse.json({
    month,
    year,
    totalRevenue,
    dailyRevenues: Object.values(dailyRevenues),
    count: revenues.length,
  });
}
