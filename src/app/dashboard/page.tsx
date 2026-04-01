"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Bus,
  Users,
  FileText,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  MapPin,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Bus as BusIcon,
} from "lucide-react";

interface RequestLine {
  station: string;
  numberOfBuses: number;
  busType: string;
  shuttleTime: string;
}

interface RecentRequest {
  id: number;
  date: string;
  status: string;
  createdAt: string;
  user: { fullName: string };
  lines: RequestLine[];
}

interface RecentPlanning {
  id: number;
  date: string;
  status: string;
  createdAt: string;
  request: {
    id: number;
    user: { fullName: string };
    lines: RequestLine[];
  };
  assignments: {
    bus: { busNumber: string; busType: string };
    driver: { fullName: string };
    requestLine: { station: string };
  }[];
}

interface Stats {
  totalBuses: number;
  totalDrivers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  confirmedPlannings: number;
  draftPlannings: number;
  monthlyRevenue: number;
  recentRequests: RecentRequest[];
  recentPlannings: RecentPlanning[];
}

const statusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return { label: "En attente", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    case "APPROVED":
      return { label: "Approuvée", cls: "bg-green-100 text-green-700 border-green-200" };
    case "REJECTED":
      return { label: "Rejetée", cls: "bg-red-100 text-red-700 border-red-200" };
    case "CONFIRMED":
      return { label: "Confirmé", cls: "bg-green-100 text-green-700 border-green-200" };
    case "DRAFT":
      return { label: "Brouillon", cls: "bg-amber-100 text-amber-700 border-amber-200" };
    default:
      return { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }
};

const busTypeColor = (type: string) => {
  switch (type) {
    case "Grand": return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mini": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [stats, setStats] = useState<Stats>({
    totalBuses: 0,
    totalDrivers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    confirmedPlannings: 0,
    draftPlannings: 0,
    monthlyRevenue: 0,
    recentRequests: [],
    recentPlannings: [],
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenue, <span className="font-medium text-slate-700">{session?.user?.name}</span> — {currentMonth} {new Date().getFullYear()}
          </p>
        </div>

        {/* ───── Stat Cards ───── */}
        <div className={`grid gap-5 mb-8 ${role === "YAZAKI" ? "grid-cols-3" : "grid-cols-4"}`}>
          {role === "ADMIN" && (
            <>
              <StatCard icon={Bus} label="Bus actifs" value={stats.totalBuses} iconBg="bg-blue-100" iconColor="text-blue-600" />
              <StatCard icon={Users} label="Chauffeurs actifs" value={stats.totalDrivers} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
              <StatCard icon={FileText} label="Total demandes" value={stats.totalRequests} iconBg="bg-purple-100" iconColor="text-purple-600" />
              <StatCard icon={DollarSign} label={`Recette ${currentMonth}`} value={`${stats.monthlyRevenue.toFixed(2)} TND`} iconBg="bg-amber-100" iconColor="text-amber-600" />
            </>
          )}
          {role === "YAZAKI" && (
            <>
              <StatCard icon={FileText} label="Mes demandes" value={stats.totalRequests} iconBg="bg-blue-100" iconColor="text-blue-600" />
              <StatCard icon={Clock} label="En attente" value={stats.pendingRequests} iconBg="bg-amber-100" iconColor="text-amber-600" />
              <StatCard icon={CheckCircle} label="Approuvées" value={stats.approvedRequests} iconBg="bg-green-100" iconColor="text-green-600" />
            </>
          )}
          {role === "SRTG" && (
            <>
              <StatCard icon={FileText} label="Demandes reçues" value={stats.totalRequests} iconBg="bg-blue-100" iconColor="text-blue-600" />
              <StatCard icon={Clock} label="En attente" value={stats.pendingRequests} iconBg="bg-amber-100" iconColor="text-amber-600" />
              <StatCard icon={CalendarCheck} label="Plannings confirmés" value={stats.confirmedPlannings} iconBg="bg-green-100" iconColor="text-green-600" />
              <StatCard icon={TrendingUp} label={`Recette ${currentMonth}`} value={`${stats.monthlyRevenue.toFixed(2)} TND`} iconBg="bg-purple-100" iconColor="text-purple-600" />
            </>
          )}
        </div>

        {/* ───── Quick Stats Row (for ADMIN & SRTG) ───── */}
        {(role === "ADMIN" || role === "SRTG") && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <MiniStat label="En attente" value={stats.pendingRequests} color="text-amber-600" icon={Clock} />
            <MiniStat label="Approuvées" value={stats.approvedRequests} color="text-green-600" icon={CheckCircle} />
            <MiniStat label="Rejetées" value={stats.rejectedRequests} color="text-red-500" icon={XCircle} />
            <MiniStat label="Brouillons" value={stats.draftPlannings} color="text-blue-600" icon={CalendarCheck} />
          </div>
        )}

        {/* ───── Two Column Layout: Recent Requests + Recent Plannings ───── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Latest Requests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Dernières demandes
              </h2>
              <span className="text-xs text-slate-400">{stats.recentRequests.length} récentes</span>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.recentRequests.map((req) => {
                const badge = statusBadge(req.status);
                return (
                  <div key={req.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800 text-sm">#{req.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-sm text-slate-600">{req.user.fullName}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {new Date(req.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      <span className="text-slate-300 mx-1">·</span>
                      {req.lines.length} ligne(s)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {req.lines.slice(0, 3).map((line, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${busTypeColor(line.busType)}`}>
                            {line.busType}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                            {line.shuttleTime}
                          </span>
                        </div>
                      ))}
                      {req.lines.length > 3 && (
                        <span className="text-xs text-slate-400">+{req.lines.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {stats.recentRequests.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">
                  Aucune demande récente
                </div>
              )}
            </div>
          </div>

          {/* Latest Plannings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-green-600" />
                Derniers plannings
              </h2>
              <span className="text-xs text-slate-400">{stats.recentPlannings.length} récents</span>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.recentPlannings.map((pl) => {
                const badge = statusBadge(pl.status);
                const totalRequired = pl.request.lines.reduce((s, l) => s + l.numberOfBuses, 0);
                const totalAssigned = pl.assignments.length;
                return (
                  <div key={pl.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800 text-sm">Planning #{pl.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-sm text-slate-600">{pl.request.user.fullName}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {new Date(pl.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      <span className="text-slate-300 mx-1">·</span>
                      <span className={`font-medium ${totalAssigned >= totalRequired ? "text-green-600" : "text-amber-600"}`}>
                        {totalAssigned}/{totalRequired} affectation(s)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${totalAssigned >= totalRequired ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0)}%` }}
                      />
                    </div>
                    {/* Assigned buses preview */}
                    {pl.assignments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pl.assignments.slice(0, 3).map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            <BusIcon className="w-3 h-3 text-blue-500" />
                            {a.bus.busNumber}
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-500">{a.driver.fullName.split(" ")[0]}</span>
                          </span>
                        ))}
                        {pl.assignments.length > 3 && (
                          <span className="text-xs text-slate-400">+{pl.assignments.length - 3}</span>
                        )}
                      </div>
                    )}
                    {pl.assignments.length === 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Aucune affectation
                      </div>
                    )}
                  </div>
                );
              })}
              {stats.recentPlannings.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">
                  Aucun planning récent
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: any; label: string; value: string | number; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: any;
}) {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
