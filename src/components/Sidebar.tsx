"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  CalendarCheck,
  Bus,
  Users,
  UserCog,
  DollarSign,
  BarChart3,
  LogOut,
  ClipboardList,
} from "lucide-react";

const menuItems = {
  ADMIN: [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/users", label: "Utilisateurs", icon: UserCog },
    { href: "/buses", label: "Bus", icon: Bus },
    { href: "/drivers", label: "Chauffeurs", icon: Users },
    { href: "/tariffs", label: "Tarifs", icon: DollarSign },
    { href: "/reports", label: "Rapports", icon: BarChart3 },
  ],
  YAZAKI: [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/requests", label: "Mes demandes", icon: FileText },
    { href: "/requests/new", label: "Nouvelle demande", icon: ClipboardList },
    { href: "/tariffs", label: "Tarifs", icon: DollarSign },
  ],
  SRTG: [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/planning", label: "Planning", icon: CalendarCheck },
    { href: "/revenue", label: "Recettes", icon: DollarSign },
    { href: "/reports", label: "Rapports", icon: BarChart3 },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as keyof typeof menuItems;
  const items = menuItems[role] || [];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">Pointage Bus</h1>
            <p className="text-xs text-slate-500">Yazaki - SRTG</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="px-4 py-2 mb-3">
          <p className="text-sm font-medium text-slate-800">
            {session?.user?.name}
          </p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
