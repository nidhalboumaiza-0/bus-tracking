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

  const assignments = await prisma.assignment.findMany({
    where: {
      planning: {
        date: { gte: startDate, lte: endDate },
      },
    },
    include: {
      bus: true,
      driver: true,
      requestLine: true,
      revenue: true,
      planning: {
        include: {
          request: {
            include: { user: { select: { fullName: true } } },
          },
        },
      },
    },
    orderBy: { planning: { date: "asc" } },
  });

  const reportData = assignments.map((a: any) => ({
    date: a.planning.date.toISOString().split("T")[0],
    bus: a.bus.busNumber,
    busType: a.bus.busType,
    driver: a.driver.fullName,
    driverMatricule: a.driver.matricule,
    station: a.requestLine.station,
    shuttleTime: a.requestLine.shuttleTime,
    revenue: a.revenue?.amount || 0,
    demandeur: a.planning.request.user.fullName,
  }));

  const totalRevenue = reportData.reduce((sum: number, r: { revenue: number }) => sum + r.revenue, 0);

  return NextResponse.json({
    month,
    year,
    data: reportData,
    totalRevenue,
    totalTrips: reportData.length,
  });
}
