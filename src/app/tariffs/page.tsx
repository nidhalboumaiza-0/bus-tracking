"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DollarSign, Plus, Trash2, X, Pencil, MapPin, Bus as BusIcon } from "lucide-react";
import { DESTINATIONS } from "@/lib/stations";

interface Tariff {
  id: number;
  destination: string;
  busType: string;
  pricePerTrip: number;
  effectiveDate: string;
}

const busTypes = ["Standard", "Grand", "Mini"];

const busTypeColor = (type: string) => {
  switch (type) {
    case "Grand": return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mini": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

export default function TariffsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";

  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ destination: "", busType: "Standard", pricePerTrip: "" });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadTariffs = () => {
    fetch("/api/tariffs").then((r) => r.json()).then(setTariffs).catch(() => {});
  };

  useEffect(() => { loadTariffs(); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  // Group tariffs by destination
  const grouped = tariffs.reduce<Record<string, Tariff[]>>((acc, t) => {
    if (!acc[t.destination]) acc[t.destination] = [];
    acc[t.destination].push(t);
    return acc;
  }, {});

  const openAdd = () => {
    setEditingId(null);
    setForm({ destination: "", busType: "Standard", pricePerTrip: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (tariff: Tariff) => {
    setEditingId(tariff.id);
    setForm({ destination: tariff.destination, busType: tariff.busType, pricePerTrip: tariff.pricePerTrip.toString() });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (editingId) {
      const res = await fetch("/api/tariffs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, pricePerTrip: form.pricePerTrip }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }
      showFeedback("Tarif mis à jour");
    } else {
      const res = await fetch("/api/tariffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }
      showFeedback("Tarif ajouté");
    }

    setShowModal(false);
    loadTariffs();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce tarif ?")) return;
    await fetch(`/api/tariffs?id=${id}`, { method: "DELETE" });
    loadTariffs();
    showFeedback("Tarif supprimé");
  };

  // Destinations missing at least one bus type
  const missingDestinations = DESTINATIONS.filter((dest) => {
    const destTariffs = grouped[dest] || [];
    return destTariffs.length < busTypes.length;
  });

  return (
    <DashboardLayout>
      <div>
        {feedback && (
          <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-50 text-sm font-medium animate-pulse">
            {feedback}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <DollarSign className="w-7 h-7 text-blue-600" />
              Grille tarifaire
            </h1>
            <p className="text-slate-500 mt-1">
              Prix par trajet depuis <span className="font-semibold text-blue-700">Yazaki</span> vers chaque destination, selon le type de bus
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Ajouter un tarif
            </button>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Destinations configurées</p>
            <p className="text-2xl font-bold text-slate-800">{Object.keys(grouped).length} / {DESTINATIONS.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total tarifs</p>
            <p className="text-2xl font-bold text-slate-800">{tariffs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Prix moyen / trajet</p>
            <p className="text-2xl font-bold text-emerald-700">
              {tariffs.length > 0 ? (tariffs.reduce((s, t) => s + t.pricePerTrip, 0) / tariffs.length).toFixed(2) : "0.00"} TND
            </p>
          </div>
        </div>

        {/* Missing destinations warning (admin only) */}
        {isAdmin && missingDestinations.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
            <span className="font-semibold">Tarifs manquants</span> pour : {missingDestinations.join(", ")}
          </div>
        )}

        {/* Tariffs grouped by destination */}
        <div className="space-y-4">
          {DESTINATIONS.map((dest) => {
            const destTariffs = grouped[dest] || [];
            if (destTariffs.length === 0 && !isAdmin) return null;

            return (
              <div key={dest} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                destTariffs.length === 0 ? "border-dashed border-slate-300 opacity-60" : "border-slate-200"
              }`}>
                <div className="px-6 py-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Yazaki → {dest}</p>
                      <p className="text-xs text-slate-500">
                        {destTariffs.length === 0 ? "Aucun tarif" : `${destTariffs.length} type(s) configuré(s)`}
                      </p>
                    </div>
                  </div>
                </div>
                {destTariffs.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {destTariffs.map((t) => (
                      <div key={t.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${busTypeColor(t.busType)}`}>
                            <BusIcon className="w-3.5 h-3.5" />
                            {t.busType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-emerald-700">{t.pricePerTrip.toFixed(2)} TND</span>
                          <span className="text-xs text-slate-400">
                            Depuis {new Date(t.effectiveDate).toLocaleDateString("fr-FR")}
                          </span>
                          {isAdmin && (
                            <div className="flex items-center gap-1 ml-2">
                              <button onClick={() => openEdit(t)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                title="Modifier le prix">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(t.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-slate-400 text-center">
                    Aucun tarif configuré pour cette destination
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[520px] p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {editingId ? "Modifier le tarif" : "Ajouter un tarif"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm mt-1">Yazaki → Destination</p>
              </div>

              <div className="px-8 py-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
                    <select
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                      disabled={!!editingId}
                    >
                      <option value="">-- Sélectionner --</option>
                      {DESTINATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type de bus</label>
                    <select
                      value={form.busType}
                      onChange={(e) => setForm({ ...form, busType: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                      disabled={!!editingId}
                    >
                      {busTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prix par trajet (TND)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.pricePerTrip}
                      onChange={(e) => setForm({ ...form, pricePerTrip: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      required
                      min="0"
                      placeholder="Ex: 150.00"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm">
                      Annuler
                    </button>
                    <button type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm text-sm">
                      {editingId ? "Mettre à jour" : "Enregistrer"}
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
