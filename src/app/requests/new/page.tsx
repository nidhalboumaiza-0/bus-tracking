"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2, MapPin, Bus as BusIcon, Clock, DollarSign } from "lucide-react";
import { DESTINATIONS, DEPARTURE_POINT } from "@/lib/stations";

interface Line {
  destination: string;
  numberOfBuses: string;
  busType: string;
  shuttleTime: string;
}

interface TariffMap {
  [key: string]: number; // "destination|busType" -> price
}

export default function NewRequestPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { destination: "", numberOfBuses: "1", busType: "Standard", shuttleTime: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tariffs, setTariffs] = useState<TariffMap>({});

  useEffect(() => {
    fetch("/api/tariffs")
      .then((r) => r.json())
      .then((data: any[]) => {
        const map: TariffMap = {};
        data.forEach((t) => {
          map[`${t.destination}|${t.busType}`] = t.pricePerTrip;
        });
        setTariffs(map);
      })
      .catch(() => {});
  }, []);

  const getPrice = (destination: string, busType: string) => {
    return tariffs[`${destination}|${busType}`];
  };

  const addLine = () => {
    setLines([...lines, { destination: "", numberOfBuses: "1", busType: "Standard", shuttleTime: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof Line, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalEstimate = lines.reduce((sum, line) => {
    const price = getPrice(line.destination, line.busType);
    if (price && line.numberOfBuses) {
      return sum + price * parseInt(line.numberOfBuses || "0");
    }
    return sum;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const apiLines = lines.map((line) => ({
      station: `${DEPARTURE_POINT} → ${line.destination}`,
      numberOfBuses: line.numberOfBuses,
      busType: line.busType,
      shuttleTime: line.shuttleTime,
    }));

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, lines: apiLines }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
      return;
    }

    router.push("/requests");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-8">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          Nouvelle demande de navettes
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Information générale</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date de la navette</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-64 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-blue-500" />
              Point de départ fixe : <span className="font-semibold text-blue-700">{DEPARTURE_POINT}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Lignes de la demande</h2>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => {
                const price = getPrice(line.destination, line.busType);
                const lineTotal = price ? price * parseInt(line.numberOfBuses || "0") : null;
                return (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold text-xs">Ligne {index + 1}</span>
                      <span className="text-slate-400">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {DEPARTURE_POINT}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium text-slate-700">{line.destination || "..."}</span>
                    </div>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                        <select
                          value={line.destination}
                          onChange={(e) => updateLine(index, "destination", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          required
                        >
                          <option value="">-- Choisir la destination --</option>
                          {DESTINATIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nb. bus</label>
                        <input
                          type="number"
                          value={line.numberOfBuses}
                          onChange={(e) => updateLine(index, "numberOfBuses", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Type de bus</label>
                        <select
                          value={line.busType}
                          onChange={(e) => updateLine(index, "busType", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="Standard">Standard</option>
                          <option value="Grand">Grand</option>
                          <option value="Mini">Mini</option>
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Heure</label>
                        <input
                          type="time"
                          value={line.shuttleTime}
                          onChange={(e) => updateLine(index, "shuttleTime", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-400 hover:text-red-600 pb-1"
                        disabled={lines.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Price preview */}
                    {line.destination && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        {price ? (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {price.toFixed(2)} TND / trajet
                            {lineTotal ? ` · Total: ${lineTotal.toFixed(2)} TND` : ""}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-lg">
                            Tarif non configuré pour {line.destination} — {line.busType}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total estimate */}
          {totalEstimate > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <span className="text-emerald-700 font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estimation totale
              </span>
              <span className="text-xl font-bold text-emerald-700">{totalEstimate.toFixed(2)} TND</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/requests")}
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm"
            >
              {loading ? "Envoi en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
