"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";

interface DailyRevenue {
  date: string;
  total: number;
  details: {
    bus: string;
    busType: string;
    driver: string;
    driverMatricule: string;
    station: string;
    amount: number;
  }[];
}

interface RevenueData {
  month: number;
  year: number;
  totalRevenue: number;
  dailyRevenues: DailyRevenue[];
  count: number;
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/revenue?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [month, year]);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-8">
          <DollarSign className="w-7 h-7 text-blue-600" />
          Suivi des recettes
        </h1>

        <div className="flex items-center gap-4 mb-8">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Summary card */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Recette totale du mois</p>
            <p className="text-3xl font-bold text-slate-800">{data?.totalRevenue.toFixed(2) || "0.00"} TND</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Nombre de trajets</p>
            <p className="text-3xl font-bold text-slate-800">{data?.count || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Jours actifs</p>
            <p className="text-3xl font-bold text-slate-800">{data?.dailyRevenues.length || 0}</p>
          </div>
        </div>

        {/* Daily breakdown */}
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Détail par jour</h2>
        <div className="space-y-3">
          {data?.dailyRevenues.map((day) => {
            const isExpanded = expanded === day.date;
            return (
              <div key={day.date} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpanded(isExpanded ? null : day.date)}
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {new Date(day.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-sm text-slate-500">{day.details.length} trajet(s)</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-green-700">{day.total.toFixed(2)} TND</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-5 bg-slate-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="pb-2">Bus</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Chauffeur</th>
                          <th className="pb-2">Station</th>
                          <th className="pb-2 text-right">Recette</th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.details.map((d, i) => (
                          <tr key={i} className="border-t border-slate-200">
                            <td className="py-2">{d.bus}</td>
                            <td className="py-2">{d.busType}</td>
                            <td className="py-2">{d.driver}</td>
                            <td className="py-2">{d.station}</td>
                            <td className="py-2 text-right font-medium">{d.amount.toFixed(2)} TND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {(!data || data.dailyRevenues.length === 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Aucune recette pour cette période
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
