"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, X, Bus as BusIcon } from "lucide-react";

interface AssignedBus {
  id: number;
  busNumber: string;
  busType: string;
}

interface Driver {
  id: number;
  matricule: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  assignedBus: AssignedBus | null;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ matricule: "", fullName: "", phone: "" });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadDrivers = useCallback(() => {
    fetch("/api/drivers").then((r) => r.json()).then(setDrivers).catch(() => {});
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, matricule: form.matricule, fullName: form.fullName, phone: form.phone } : form;

    const res = await fetch("/api/drivers", {
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
    setForm({ matricule: "", fullName: "", phone: "" });
    loadDrivers();
    showFeedback(editing ? "Chauffeur modifié avec succès" : "Chauffeur créé avec succès");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce chauffeur ?")) return;
    const res = await fetch(`/api/drivers?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    loadDrivers();
    showFeedback("Chauffeur supprimé avec succès");
  };

  const toggleActive = async (driver: Driver) => {
    const res = await fetch("/api/drivers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: driver.id, isActive: !driver.isActive }),
    });
    if (res.ok) {
      loadDrivers();
      showFeedback(`Chauffeur ${!driver.isActive ? "activé" : "désactivé"}`);
    }
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({ matricule: driver.matricule, fullName: driver.fullName, phone: driver.phone });
    setError("");
    setShowModal(true);
  };

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
              <Users className="w-7 h-7 text-blue-600" />
              Gestion des chauffeurs
            </h1>
            <p className="text-slate-500 mt-1">{drivers.length} chauffeur(s) · {drivers.filter(d => d.isActive).length} actif(s)</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm({ matricule: "", fullName: "", phone: "" }); setError(""); setShowModal(true); }}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Matricule</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Nom complet</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Téléphone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Bus affecté</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Statut</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((driver) => (
                <tr key={driver.id} className={`hover:bg-slate-50 transition-colors ${!driver.isActive ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4 font-medium text-slate-800">{driver.matricule}</td>
                  <td className="px-6 py-4 text-slate-600">{driver.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{driver.phone}</td>
                  <td className="px-6 py-4">
                    {driver.assignedBus ? (
                      <span className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-sm w-fit">
                        <BusIcon className="w-4 h-4" />
                        {driver.assignedBus.busNumber} ({driver.assignedBus.busType})
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Non affecté</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(driver)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      driver.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}>
                      {driver.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(driver)} className="text-blue-600 hover:text-blue-800 mr-3" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(driver.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Aucun chauffeur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">{editing ? "Modifier le chauffeur" : "Nouveau chauffeur"}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Matricule</label>
                  <input type="text" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
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
      </div>
    </DashboardLayout>
  );
}
