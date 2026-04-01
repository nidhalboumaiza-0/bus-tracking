"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle, ChevronDown, ChevronUp, Plus, Trash2, Bus as BusIcon, Clock, MapPin, AlertTriangle, Check, X } from "lucide-react";

interface Assignment {
  id: number;
  bus: { id: number; busNumber: string; busType: string };
  driver: { id: number; fullName: string; matricule: string };
  requestLine: { station: string; shuttleTime: string };
  revenue: { amount: number } | null;
}

interface Planning {
  id: number;
  date: string;
  status: string;
  request: {
    id: number;
    date: string;
    status: string;
    user: { fullName: string };
    lines: { id: number; station: string; numberOfBuses: number; busType: string; shuttleTime: string }[];
  };
  assignments: Assignment[];
}

interface RequestItem {
  id: number;
  date: string;
  status: string;
  user: { fullName: string };
  lines: { id: number; station: string; numberOfBuses: number; busType: string; shuttleTime: string }[];
  planning: any;
}

interface Bus { id: number; busNumber: string; busType: string; isActive: boolean }
interface Driver { id: number; matricule: string; fullName: string; isActive: boolean }

const busTypeColor = (type: string) => {
  switch (type) {
    case "Grand": return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mini": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

export default function PlanningPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assignForm, setAssignForm] = useState({ planningId: 0, requestLineId: 0, busId: 0, driverId: 0 });
  const [assignShuttleTime, setAssignShuttleTime] = useState("");
  const [assignLineName, setAssignLineName] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [assignError, setAssignError] = useState("");

  const loadData = () => {
    fetch("/api/requests").then((r) => r.json()).then(setRequests).catch(() => {});
    fetch("/api/planning").then((r) => r.json()).then(setPlannings).catch(() => {});
    fetch("/api/buses").then((r) => r.json()).then(setBuses).catch(() => {});
    fetch("/api/drivers").then((r) => r.json()).then(setDrivers).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  // Cross-planning conflict detection for same date + shuttle time
  const currentPlanning = plannings.find((p) => p.id === assignForm.planningId);
  const currentDate = currentPlanning?.date;
  const sameDatePlannings = currentDate
    ? plannings.filter((p) => new Date(p.date).toDateString() === new Date(currentDate).toDateString())
    : [];
  const conflictingAssignments = sameDatePlannings
    .flatMap((p) => p.assignments)
    .filter((a) => a.requestLine.shuttleTime === assignShuttleTime);
  const usedBusIds = new Set(conflictingAssignments.map((a) => a.bus.id));
  const usedDriverIds = new Set(conflictingAssignments.map((a) => a.driver.id));
  const activeBuses = buses.filter((b) => b.isActive && !usedBusIds.has(b.id));
  const activeDrivers = drivers.filter((d) => d.isActive && !usedDriverIds.has(d.id));

  // Check if a planning is fully assigned (every line has enough assignments)
  const isPlanningComplete = (planning: Planning) => {
    return planning.request.lines.every((line) => {
      const count = planning.assignments.filter((a) => a.requestLine.station === line.station).length;
      return count >= line.numberOfBuses;
    });
  };

  const createPlanning = async (requestId: number) => {
    const res = await fetch("/api/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (res.ok) {
      loadData();
      showFeedback("Planning créé avec succès");
    }
  };

  const confirmPlanning = async (planning: Planning) => {
    if (!isPlanningComplete(planning)) {
      return; // button is disabled anyway
    }
    const res = await fetch("/api/planning", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planningId: planning.id, status: "CONFIRMED" }),
    });
    if (res.ok) {
      loadData();
      showFeedback("Planning confirmé avec succès");
    }
  };

  const openAssign = (planningId: number, requestLineId: number, shuttleTime: string, lineName: string) => {
    setAssignForm({ planningId, requestLineId, busId: 0, driverId: 0 });
    setAssignShuttleTime(shuttleTime);
    setAssignLineName(lineName);
    setAssignError("");
    setShowAssignModal(true);
  };

  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cette affectation ?")) return;
    const res = await fetch(`/api/assignments?id=${assignmentId}`, { method: "DELETE" });
    if (res.ok) {
      loadData();
      showFeedback("Affectation retirée");
    }
  };

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    if (!assignForm.busId || !assignForm.driverId) {
      setAssignError("Veuillez sélectionner un bus et un chauffeur");
      return;
    }
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setAssignError(data.error || "Erreur lors de l'affectation");
      return;
    }
    setShowAssignModal(false);
    loadData();
    showFeedback("Affectation créée avec succès");
  };

  return (
    <DashboardLayout>
      <div>
        {feedback && (
          <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-50 text-sm font-medium animate-pulse">
            {feedback}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-blue-600" />
            Gestion du planning
          </h1>
          <p className="text-slate-500 mt-1">
            {plannings.length} planning(s) · {pendingRequests.length} demande(s) en attente
          </p>
        </div>

        {/* ───── Pending requests ───── */}
        {pendingRequests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Demandes en attente
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-gradient-to-r from-amber-50 to-white rounded-xl border border-amber-200 shadow-sm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-slate-800">Demande #{req.id}</p>
                        <span className="text-slate-400">—</span>
                        <p className="text-slate-600">{req.user.fullName}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-4 h-4" />
                          {new Date(req.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span>{req.lines.length} ligne(s)</span>
                      </div>
                      {/* Preview of lines */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {req.lines.map((line, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{line.station}</span>
                            <span className={`px-2 py-1 rounded border font-medium ${busTypeColor(line.busType)}`}>{line.busType}</span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-mono font-semibold">{line.shuttleTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => createPlanning(req.id)}
                      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm ml-4 shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Créer un planning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───── Plannings ───── */}
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Plannings</h2>
        <div className="space-y-5">
          {plannings.map((planning) => {
            const isExpanded = expanded === planning.id;
            const isComplete = isPlanningComplete(planning);
            const totalRequired = planning.request.lines.reduce((s, l) => s + l.numberOfBuses, 0);
            const totalAssigned = planning.assignments.length;

            return (
              <div key={planning.id} className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
                planning.status === "CONFIRMED"
                  ? "bg-white border-green-200"
                  : "bg-white border-blue-200"
              }`}>
                {/* Header */}
                <div
                  className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
                    planning.status === "CONFIRMED" ? "hover:bg-green-50/50" : "hover:bg-blue-50/50"
                  }`}
                  onClick={() => setExpanded(isExpanded ? null : planning.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      planning.status === "CONFIRMED" ? "bg-green-100" : "bg-blue-100"
                    }`}>
                      <CalendarCheck className={`w-6 h-6 ${
                        planning.status === "CONFIRMED" ? "text-green-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-800">
                          Planning #{planning.id}
                        </p>
                        <span className="text-slate-300">|</span>
                        <p className="text-sm text-slate-500">Demande #{planning.request.id} — {planning.request.user.fullName}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">
                          {new Date(planning.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-sm text-slate-500">{planning.request.lines.length} ligne(s)</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className={`text-sm font-medium ${totalAssigned >= totalRequired ? "text-green-600" : "text-amber-600"}`}>
                          {totalAssigned}/{totalRequired} affectation(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      planning.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                      {planning.status === "CONFIRMED" ? "Confirmé" : "Brouillon"}
                    </span>
                    {planning.status === "DRAFT" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmPlanning(planning); }}
                        disabled={!isComplete}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          isComplete
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                        title={!isComplete ? "Veuillez compléter toutes les affectations avant de confirmer" : "Confirmer le planning"}
                      >
                        <Check className="w-4 h-4" />
                        Confirmer
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Progress bar for DRAFT */}
                {planning.status === "DRAFT" && (
                  <div className="px-5 pb-2">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                    <div className="space-y-4">
                      {planning.request.lines.map((line) => {
                        const lineAssignments = planning.assignments.filter((a) => a.requestLine.station === line.station);
                        const isLineFull = lineAssignments.length >= line.numberOfBuses;

                        return (
                          <div key={line.id} className={`rounded-xl border-2 overflow-hidden transition-all ${
                            isLineFull
                              ? "border-green-200 bg-green-50/30"
                              : "border-amber-200 bg-white"
                          }`}>
                            {/* Line header */}
                            <div className="px-5 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  isLineFull ? "bg-green-100" : "bg-amber-100"
                                }`}>
                                  <MapPin className={`w-5 h-5 ${isLineFull ? "text-green-600" : "text-amber-600"}`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-base">{line.station}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${busTypeColor(line.busType)}`}>
                                      <BusIcon className="w-3.5 h-3.5" />
                                      {line.busType}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                                      <Clock className="w-3.5 h-3.5" />
                                      {line.shuttleTime}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      isLineFull
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-amber-100 text-amber-700 border border-amber-200"
                                    }`}>
                                      {isLineFull ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                      {lineAssignments.length}/{line.numberOfBuses} bus
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {planning.status === "DRAFT" && !isLineFull && (
                                <button
                                  onClick={() => openAssign(planning.id, line.id, line.shuttleTime, line.station)}
                                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Affecter
                                </button>
                              )}
                              {planning.status === "DRAFT" && isLineFull && (
                                <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                  <CheckCircle className="w-4 h-4" />
                                  Complet
                                </span>
                              )}
                            </div>

                            {/* Assignments table */}
                            {lineAssignments.length > 0 && (
                              <div className="border-t border-slate-200/60 mx-5 mb-4">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                      <th className="text-left py-3 font-semibold">Bus</th>
                                      <th className="text-left py-3 font-semibold">Chauffeur</th>
                                      <th className="text-left py-3 font-semibold">Matricule</th>
                                      <th className="text-left py-3 font-semibold">Recette</th>
                                      {planning.status === "DRAFT" && <th className="text-right py-3 font-semibold">Actions</th>}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lineAssignments.map((a) => (
                                      <tr key={a.id} className="border-t border-slate-100 hover:bg-white/50 transition-colors">
                                        <td className="py-2.5">
                                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                                            <BusIcon className="w-4 h-4 text-blue-500" />
                                            {a.bus.busNumber}
                                          </span>
                                        </td>
                                        <td className="py-2.5 text-slate-700">{a.driver.fullName}</td>
                                        <td className="py-2.5">
                                          <span className="font-mono text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded">{a.driver.matricule}</span>
                                        </td>
                                        <td className="py-2.5">
                                          <span className="font-semibold text-emerald-600">{a.revenue ? `${a.revenue.amount.toFixed(2)} TND` : "—"}</span>
                                        </td>
                                        {planning.status === "DRAFT" && (
                                          <td className="py-2.5 text-right">
                                            <button
                                              onClick={() => deleteAssignment(a.id)}
                                              className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-xs font-medium"
                                              title="Retirer cette affectation"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                              Retirer
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {lineAssignments.length === 0 && planning.status === "DRAFT" && (
                              <div className="border-t border-dashed border-amber-200 mx-5 mb-4 py-4 text-center text-sm text-amber-500">
                                Aucune affectation — cliquez sur « Affecter » pour ajouter un bus et un chauffeur
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary footer for DRAFT */}
                    {planning.status === "DRAFT" && !isComplete && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-700">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>
                          Vous devez affecter un bus et un chauffeur à <strong>chaque ligne</strong> avant de pouvoir confirmer ce planning.
                          Il reste <strong>{totalRequired - totalAssigned}</strong> affectation(s) à compléter.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {plannings.length === 0 && pendingRequests.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Aucun planning pour le moment</p>
              <p className="text-slate-300 text-sm mt-1">Les plannings apparaîtront ici quand les demandes seront traitées</p>
            </div>
          )}
        </div>

        {/* ───── Assign Modal ───── */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-0 overflow-hidden">
              {/* Modal header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Affecter bus & chauffeur</h2>
                    <p className="text-blue-100 text-sm mt-1">{assignLineName}</p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {assignShuttleTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-bold">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {currentPlanning ? new Date(currentPlanning.date).toLocaleDateString("fr-FR") : ""}
                  </span>
                </div>
              </div>

              {/* Modal body */}
              <div className="px-8 py-6">
                {assignError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {assignError}
                  </div>
                )}

                <form onSubmit={submitAssignment} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Bus disponible</label>
                    <select
                      value={assignForm.busId}
                      onChange={(e) => setAssignForm({ ...assignForm, busId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value={0}>-- Sélectionner un bus --</option>
                      {activeBuses.map((b) => (
                        <option key={b.id} value={b.id}>{b.busNumber} — {b.busType}</option>
                      ))}
                    </select>
                    {activeBuses.length === 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Tous les bus actifs sont déjà affectés pour cet horaire
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Chauffeur disponible</label>
                    <select
                      value={assignForm.driverId}
                      onChange={(e) => setAssignForm({ ...assignForm, driverId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      <option value={0}>-- Sélectionner un chauffeur --</option>
                      {activeDrivers.map((d) => (
                        <option key={d.id} value={d.id}>{d.fullName} — {d.matricule}</option>
                      ))}
                    </select>
                    {activeDrivers.length === 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Tous les chauffeurs actifs sont déjà affectés pour cet horaire
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowAssignModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm">
                      Annuler
                    </button>
                    <button type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm text-sm">
                      Affecter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
