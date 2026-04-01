import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({}, { status: 401 });

  const role = (session.user as any)?.role;
  const userId = parseInt((session.user as any)?.id);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let totalRequests = 0;
  let pendingRequests = 0;
  let confirmedPlannings = 0;
  let approvedRequests = 0;
  let rejectedRequests = 0;

  if (role === "YAZAKI") {
    totalRequests = await prisma.request.count({ where: { userId } });
    pendingRequests = await prisma.request.count({
      where: { userId, status: "PENDING" },
    });
    approvedRequests = await prisma.request.count({
      where: { userId, status: "APPROVED" },
    });
    rejectedRequests = await prisma.request.count({
      where: { userId, status: "REJECTED" },
    });
    confirmedPlannings = await prisma.request.count({
      where: { userId, status: "APPROVED" },
    });
  } else {
    totalRequests = await prisma.request.count();
    pendingRequests = await prisma.request.count({
      where: { status: "PENDING" },
    });
    approvedRequests = await prisma.request.count({
      where: { status: "APPROVED" },
    });
    rejectedRequests = await prisma.request.count({
      where: { status: "REJECTED" },
    });
    confirmedPlannings = await prisma.planning.count({
      where: { status: "CONFIRMED" },
    });
  }

  const totalBuses = await prisma.bus.count({ where: { isActive: true } });
  const totalDrivers = await prisma.driver.count({ where: { isActive: true } });
  const draftPlannings = await prisma.planning.count({ where: { status: "DRAFT" } });

  const revenues = await prisma.revenue.aggregate({
    _sum: { amount: true },
    where: {
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Recent requests (last 5)
  const recentRequestsWhere = role === "YAZAKI" ? { userId } : {};
  const recentRequests = await prisma.request.findMany({
    where: recentRequestsWhere,
    include: {
      user: { select: { fullName: true } },
      lines: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Recent plannings (last 5)
  const recentPlannings = await prisma.planning.findMany({
    include: {
      request: {
        include: {
          user: { select: { fullName: true } },
          lines: true,
        },
      },
      assignments: {
        include: { bus: true, driver: true, requestLine: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    totalBuses,
    totalDrivers,
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    confirmedPlannings,
    draftPlannings,
    monthlyRevenue: revenues._sum.amount || 0,
    recentRequests,
    recentPlannings,
  });
}
