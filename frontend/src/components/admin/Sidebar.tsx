"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`h-screen border-r bg-background transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      {/* Top */}
      <div className="flex items-center justify-between p-3 border-b">
        {open && <span className="font-semibold text-sm">Admin</span>}

        <button onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-2 p-2">
        <Link
          href="/admin"
          className="flex items-center gap-3 p-2 hover:bg-muted rounded"
        >
          <LayoutDashboard className="h-5 w-5" />
          {open && <span>Dashboard</span>}
        </Link>

        <Link
          href="/admin/games"
          className="flex items-center gap-3 p-2 hover:bg-muted rounded"
        >
          <Calendar className="h-5 w-5" />
          {open && <span>Parties</span>}
        </Link>

        <Link
          href="/admin/users"
          className="flex items-center gap-3 p-2 hover:bg-muted rounded"
        >
          <Users className="h-5 w-5" />
          {open && <span>Utilisateurs</span>}
        </Link>

        <Link
          href="/admin/settings"
          className="flex items-center gap-3 p-2 hover:bg-muted rounded"
        >
          <Settings className="h-5 w-5" />
          {open && <span>Paramètres</span>}
        </Link>

        {/* Logout */}
        <button className="flex items-center gap-3 p-2 hover:bg-muted rounded text-red-500 mt-auto">
          <LogOut className="h-5 w-5" />
          {open && <span>Déconnexion</span>}
        </button>
      </nav>
    </aside>
  );
}
