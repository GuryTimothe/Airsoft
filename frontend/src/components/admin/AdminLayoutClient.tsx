"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Footer } from "@/components/admin/Footer";

type AdminLayoutClientProps = {
  children: React.ReactNode;
  initialIsAllowed: boolean;
};

export function AdminLayoutClient({
  children,
  initialIsAllowed,
}: AdminLayoutClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!initialIsAllowed) {
      router.replace("/auth/login");
    }
  }, [initialIsAllowed, router]);

  if (!initialIsAllowed) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-auto p-4">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
