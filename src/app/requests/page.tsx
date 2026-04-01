"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { FileText, Plus, Eye, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface RequestLine {
  id: number;
  station: string;
  numberOfBuses: number;
  busType: string;
  shuttleTime: string;
}

interface RequestItem {
  id: number;
  date: string;
  status: string;
  createdAt: string;
  user: { fullName: string };
  lines: RequestLine[];
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/requests").then((r) => r.json()).then(setRequests).catch(() => {});
  }, []);

  const statusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return { text: "En attente", style: "bg-amber-100 text-amber-700" };
      case "APPROVED": return { text: "Approuvée", style: "bg-green-100 text-green-700" };
      case "REJECTED": return { text: "Rejetée", style: "bg-red-100 text-red-700" };
      default: return { text: status, style: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FileText className="w-7 h-7 text-blue-600" />
              Mes demandes
            </h1>
            <p className="text-slate-500 mt-1">{requests.length} demande(s)</p>
          </div>
          <Link
            href="/requests/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nouvelle demande
          </Link>
        </div>

        <div className="space-y-4">
          {requests.map((req) => {
            const status = statusLabel(req.status);
            const isExpanded = expanded === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : req.id)}
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-medium text-slate-800">Demande #{req.id}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(req.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.style}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {req.lines.length} ligne(s)
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-3 text-sm font-semibold text-slate-600">Station / Ligne</th>
                          <th className="pb-3 text-sm font-semibold text-slate-600">Type de bus</th>
                          <th className="pb-3 text-sm font-semibold text-slate-600">Nombre de bus</th>
                          <th className="pb-3 text-sm font-semibold text-slate-600">Temps navette</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {req.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-3 text-slate-800">{line.station}</td>
                            <td className="py-3 text-slate-600">{line.busType}</td>
                            <td className="py-3 text-slate-600">{line.numberOfBuses}</td>
                            <td className="py-3 text-slate-600">{line.shuttleTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {requests.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Aucune demande. Créez votre première demande.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
