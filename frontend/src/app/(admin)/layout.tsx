"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Footer } from "@/components/admin/Footer";
import { getCurrentUser, type UserRole } from "@/lib/user-api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isDisposed = false;

    async function verifyAccess() {
      try {
        const currentUser = await getCurrentUser();
        const canAccessAdminDashboard =
          currentUser.role === "ROLE_ADMIN" ||
          currentUser.role === "ROLE_SUPER_ADMIN" ||
          currentUser.role === "ROLE_ORGANIZER";

        if (!isDisposed) {
          setUserRole(currentUser.role);
          setIsAllowed(canAccessAdminDashboard);
          setIsCheckingAccess(false);
        }

        if (!canAccessAdminDashboard) {
          router.replace("/");
        }
      } catch {
        if (!isDisposed) {
          setIsAllowed(false);
          setIsCheckingAccess(false);
        }
        router.replace("/auth/login");
      }
    }

    void verifyAccess();

    return () => {
      isDisposed = true;
    };
  }, [router]);

  useEffect(() => {
    if (!userRole) {
      return;
    }

    const isOrganizer = userRole === "ROLE_ORGANIZER";
    const isRestrictedRoute =
      pathname.startsWith("/admin/users") ||
      pathname.startsWith("/admin/settings");

    if (isOrganizer && isRestrictedRoute) {
      router.replace("/admin");
    }
  }, [pathname, router, userRole]);

  if (isCheckingAccess || !isAllowed) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        open={sidebarOpen}
        userRole={userRole}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
        <Footer userRole={userRole} />
      </div>
    </div>
  );
}
