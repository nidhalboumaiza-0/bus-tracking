"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, X } from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "YAZAKI" });
  const [error, setError] = useState("");

  const loadUsers = () => {
    fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;

    const res = await fetch("/api/users", {
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
    setForm({ username: "", password: "", fullName: "", role: "YAZAKI" });
    loadUsers();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    loadUsers();
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ username: user.username, password: "", fullName: user.fullName, role: user.role });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ username: "", password: "", fullName: "", role: "YAZAKI" });
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <UserCog className="w-7 h-7 text-blue-600" />
              Gestion des utilisateurs
            </h1>
            <p className="text-slate-500 mt-1">{users.length} utilisateur(s)</p>
          </div>
          <button
            onClick={openCreate}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Nom complet</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Nom d&apos;utilisateur</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Rôle</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date création</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{user.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-red-100 text-red-700" :
                      user.role === "YAZAKI" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(user)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom d&apos;utilisateur</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mot de passe {editing && "(laisser vide pour ne pas changer)"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required={!editing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="YAZAKI">Yazaki</option>
                    <option value="SRTG">SRTG</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {editing ? "Modifier" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
