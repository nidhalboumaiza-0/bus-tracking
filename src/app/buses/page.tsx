"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, useCallback } from "react";
import { Bus as BusIcon, Plus, Pencil, Trash2, X, UserCheck, UserX } from "lucide-react";

interface DriverRef {
  id: number;
  fullName: string;
  matricule: string;
}

interface BusItem {
  id: number;
  busNumber: string;
  busType: string;
  capacity: number;
  isActive: boolean;
  assignedDriverId: number | null;
  assignedDriver: DriverRef | null;
}

interface DriverOption {
  id: number;
  fullName: string;
  matricule: string;
  isActive: boolean;
  assignedBus: { id: number; busNumber: string } | null;
}

export default function BusesPage() {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editing, setEditing] = useState<BusItem | null>(null);
  const [assigningBus, setAssigningBus] = useState<BusItem | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [form, setForm] = useState({ busNumber: "", busType: "Standard", capacity: "" });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadData = useCallback(() => {
    fetch("/api/buses").then((r) => r.json()).then(setBuses).catch(() => {});
    fetch("/api/drivers").then((r) => r.json()).then(setDrivers).catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { id: editing.id, busNumber: form.busNumber, busType: form.busType, capacity: form.capacity, isActive: editing.isActive }
      : form;

    const res = await fetch("/api/buses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur");
      return;
    }

    setShowModal(false);
    setEditing(null);
    setForm({ busNumber: "", busType: "Standard", capacity: "" });
    loadData();
    showFeedback(editing ? "Bus modifié avec succès" : "Bus créé avec succès");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bus ?")) return;
    const res = await fetch(`/api/buses?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    loadData();
    showFeedback("Bus supprimé avec succès");
  };

  const toggleActive = async (bus: BusItem) => {
    const res = await fetch("/api/buses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bus.id, isActive: !bus.isActive }),
    });
    if (res.ok) {
      loadData();
      showFeedback(`Bus ${!bus.isActive ? "activé" : "désactivé"}`);
    }
  };

  const openEdit = (bus: BusItem) => {
    setEditing(bus);
    setForm({ busNumber: bus.busNumber, busType: bus.busType, capacity: String(bus.capacity) });
    setError("");
    setShowModal(true);
  };

  const openAssign = (bus: BusItem) => {
    setAssigningBus(bus);
    setSelectedDriverId(bus.assignedDriverId);
    setShowAssignModal(true);
  };

  const submitAssign = async () => {
    if (!assigningBus) return;
    const res = await fetch("/api/buses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: assigningBus.id, assignedDriverId: selectedDriverId }),
    });
    if (res.ok) {
      setShowAssignModal(false);
      setAssigningBus(null);
      loadData();
      showFeedback(selectedDriverId ? "Chauffeur affecté au bus" : "Chauffeur retiré du bus");
    }
  };

  const availableDrivers = drivers.filter(
    (d) => d.isActive && (!d.assignedBus || d.assignedBus.id === assigningBus?.id)
  );

  return (
    <DashboardLayout>
      <div>
        {feedback && (
          <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-50 text-sm font-medium">
            {feedback}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <BusIcon className="w-7 h-7 text-blue-600" />
              Gestion des bus
            </h1>
            <p className="text-slate-500 mt-1">{buses.length} bus · {buses.filter(b => b.isActive).length} actif(s)</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm({ busNumber: "", busType: "Standard", capacity: "" }); setError(""); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">N° Bus</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Capacité</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Chauffeur affecté</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {buses.map((bus) => (
                <tr key={bus.id} className={`hover:bg-slate-50 transition-colors ${!bus.isActive ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4 font-medium text-slate-800">{bus.busNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{bus.busType}</td>
                  <td className="px-6 py-4 text-slate-600">{bus.capacity} places</td>
                  <td className="px-6 py-4">
                    {bus.assignedDriver ? (
                      <button
                        onClick={() => openAssign(bus)}
                        className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors text-sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        {bus.assignedDriver.fullName}
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssign(bus)}
                        className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                      >
                        <UserX className="w-4 h-4" />
                        Non affecté
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(bus)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      bus.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}>
                      {bus.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(bus)} className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(bus.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {buses.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Aucun bus trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">{editing ? "Modifier le bus" : "Nouveau bus"}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de bus</label>
                  <input type="text" value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type de bus</label>
                  <select value={form.busType} onChange={(e) => setForm({ ...form, busType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Standard">Standard</option>
                    <option value="Grand">Grand</option>
                    <option value="Mini">Mini</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacité (places)</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required min="1" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Annuler</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{editing ? "Modifier" : "Créer"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Driver Modal */}
        {showAssignModal && assigningBus && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Affecter un chauffeur</h2>
                  <p className="text-sm text-slate-500 mt-1">Bus : {assigningBus.busNumber} ({assigningBus.busType})</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur</label>
                  <select
                    value={selectedDriverId || ""}
                    onChange={(e) => setSelectedDriverId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Aucun chauffeur --</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.fullName} ({d.matricule})</option>
                    ))}
                  </select>
                </div>
                {availableDrivers.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg">
                    Aucun chauffeur actif disponible. Tous les chauffeurs sont déjà affectés à un bus.
                  </p>
                )}
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Annuler</button>
                  <button onClick={submitAssign}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    {selectedDriverId ? "Affecter" : "Retirer l'affectation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
