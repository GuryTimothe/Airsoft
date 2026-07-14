"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  User,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth";
import type { UserRole } from "@/lib/user-api";

type SidebarProps = {
  open: boolean;
  userRole: UserRole | null;
  onToggle: () => void;
};

export function Sidebar({ open, userRole, onToggle }: SidebarProps) {
  const router = useRouter();
  const isOrganizer = userRole === "ROLE_ORGANIZER";
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function onLogout() {
    setLogoutError(null);

    try {
      await logout();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Impossible de vous deconnecter pour le moment.",
      );
    }
  }

  return (
    <aside
      className={`h-screen border-r bg-primary text-primary-foreground transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      {/* Top */}
      <div className="flex items-center justify-between p-3 border-b">
        {open && <span className="font-semibold text-sm">Admin</span>}

        <button onClick={onToggle}>
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

        {!isOrganizer ? (
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-2 hover:bg-muted rounded"
          >
            <Users className="h-5 w-5" />
            {open && <span>Utilisateurs</span>}
          </Link>
        ) : null}

        <Link
          href="/admin/profil"
          className="flex items-center gap-3 p-2 hover:bg-muted rounded"
        >
          <User className="h-5 w-5" />
          {open && <span>Profil</span>}
        </Link>

        {!isOrganizer ? (
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-2 hover:bg-muted rounded"
          >
            <Settings className="h-5 w-5" />
            {open && <span>Paramètres</span>}
          </Link>
        ) : null}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 p-2 hover:bg-muted rounded text-red-500 mt-auto"
        >
          <LogOut className="h-5 w-5" />
          {open && <span>Déconnexion</span>}
        </button>

        {logoutError ? (
          <p className="px-2 text-xs text-red-400">{logoutError}</p>
        ) : null}
      </nav>
    </aside>
  );
}
