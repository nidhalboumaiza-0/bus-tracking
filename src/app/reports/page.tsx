"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { BarChart3, Printer } from "lucide-react";

interface ReportRow {
  date: string;
  bus: string;
  busType: string;
  driver: string;
  driverMatricule: string;
  station: string;
  shuttleTime: string;
  revenue: number;
  demandeur: string;
}

interface ReportData {
  month: number;
  year: number;
  data: ReportRow[];
  totalRevenue: number;
  totalTrips: number;
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch(`/api/reports?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(() => {});
  }, [month, year]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rows = report?.data.map((r) => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px">${new Date(r.date).toLocaleDateString("fr-FR")}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.bus}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.busType}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.driver}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.driverMatricule}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.station}</td>
        <td style="border:1px solid #ddd;padding:8px">${r.shuttleTime}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">${r.revenue.toFixed(2)} TND</td>
      </tr>
    `).join("") || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport Mensuel - ${monthNames[month - 1]} ${year}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 22px; margin-bottom: 5px; }
          h2 { font-size: 16px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #f1f5f9; border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-weight: 600; }
          .summary { margin-top: 24px; display: flex; gap: 40px; }
          .summary-item { }
          .summary-item .label { font-size: 13px; color: #666; }
          .summary-item .value { font-size: 20px; font-weight: bold; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Rapport de Pointage Mensuel</h1>
        <h2>${monthNames[month - 1]} ${year} — Yazaki / SRTG</h2>
        
        <div class="summary">
          <div class="summary-item">
            <div class="label">Total trajets</div>
            <div class="value">${report?.totalTrips || 0}</div>
          </div>
          <div class="summary-item">
            <div class="label">Recette totale</div>
            <div class="value">${report?.totalRevenue.toFixed(2) || "0.00"} TND</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bus</th>
              <th>Type</th>
              <th>Chauffeur</th>
              <th>Matricule</th>
              <th>Station</th>
              <th>Horaire</th>
              <th style="text-align:right">Recette</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7" style="border:1px solid #ddd;padding:10px;font-weight:bold;text-align:right">Total</td>
              <td style="border:1px solid #ddd;padding:10px;font-weight:bold;text-align:right">${report?.totalRevenue.toFixed(2) || "0.00"} TND</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:40px;font-size:12px;color:#999;text-align:center">
          Généré le ${new Date().toLocaleDateString("fr-FR")} — Gestion Pointage Bus
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Rapport mensuel
          </h1>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Printer className="w-5 h-5" />
            Imprimer / PDF
          </button>
        </div>

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

        {/* Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Période</p>
            <p className="text-xl font-bold text-slate-800">{monthNames[month - 1]} {year}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Total trajets</p>
            <p className="text-xl font-bold text-slate-800">{report?.totalTrips || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Recette totale</p>
            <p className="text-xl font-bold text-green-700">{report?.totalRevenue.toFixed(2) || "0.00"} TND</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Bus</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Chauffeur</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Matricule</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Station</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Horaire</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Recette</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-sm">{new Date(row.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-6 py-3 text-sm font-medium">{row.bus}</td>
                  <td className="px-6 py-3 text-sm">{row.busType}</td>
                  <td className="px-6 py-3 text-sm">{row.driver}</td>
                  <td className="px-6 py-3 text-sm">{row.driverMatricule}</td>
                  <td className="px-6 py-3 text-sm">{row.station}</td>
                  <td className="px-6 py-3 text-sm">{row.shuttleTime}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium">{row.revenue.toFixed(2)} TND</td>
                </tr>
              ))}
              {(!report || report.data.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Aucune donnée pour cette période
                  </td>
                </tr>
              )}
            </tbody>
            {report && report.data.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-right font-bold text-slate-700">Total</td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">{report.totalRevenue.toFixed(2)} TND</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
