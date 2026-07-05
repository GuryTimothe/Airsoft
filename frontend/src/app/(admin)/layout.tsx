"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Footer } from "@/components/admin/Footer";
import { getAuthToken } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAllowed = Boolean(getAuthToken());

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/auth/login");
    }
  }, [isAllowed, router]);

  if (!isAllowed) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
