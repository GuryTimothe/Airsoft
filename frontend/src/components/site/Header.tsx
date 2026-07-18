"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUTH_STATE_CHANGE_EVENT, logout } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-api";

type HeaderProps = {
  initialIsAuthenticated: boolean;
  initialHasAdminAccess: boolean;
};

export function Header({
  initialIsAuthenticated,
  initialHasAdminAccess,
}: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialIsAuthenticated,
  );
  const [hasAdminAccess, setHasAdminAccess] = useState(initialHasAdminAccess);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);

    try {
      await logout();
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Impossible de vous deconnecter pour le moment.",
      );
    }
  }

  useEffect(() => {
    const syncAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        const canAccessAdmin =
          currentUser.role === "ROLE_ADMIN" ||
          currentUser.role === "ROLE_SUPER_ADMIN" ||
          currentUser.role === "ROLE_ORGANIZER";

        setIsAuthenticated(true);
        setHasAdminAccess(canAccessAdmin);
      } catch {
        setIsAuthenticated(false);
        setHasAdminAccess(false);
      }
    };

    void syncAuthState();
    const syncOnEvent = () => {
      void syncAuthState();
    };

    window.addEventListener("focus", syncOnEvent);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncOnEvent);

    return () => {
      window.removeEventListener("focus", syncOnEvent);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncOnEvent);
    };
  }, []);

  const authHref = !isAuthenticated
    ? "/auth/login"
    : hasAdminAccess
      ? "/admin"
      : "/profil";
  const authLabel = !isAuthenticated
    ? "Connexion"
    : hasAdminAccess
      ? "Panel admin"
      : "Profil";

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="Logo"
            className="ml-4 h-20 w-15"
            width={60}
            height={80}
            sizes="60px"
          />
          <Link href="/" className="text-2xl font-black">
            Muret Airsoft
          </Link>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link href={authHref}>
            <Button variant="ghost" className="text-lg font-medium">
              {authLabel}
            </Button>
          </Link>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="text-lg font-medium"
              onClick={handleLogout}
            >
              Se deconnecter
            </Button>
          ) : null}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {logoutError ? (
        <div className="mx-auto max-w-7xl px-6 pb-3 text-sm text-red-200">
          {logoutError}
        </div>
      ) : null}

      {mobileMenuOpen ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-4 px-6 py-4">
            <Link
              href="#"
              className="block text-md font-medium transition-colors hover:text-primary"
            >
              Parties
            </Link>

            <Link
              href="#"
              className="block text-md font-medium transition-colors hover:text-primary"
            >
              À propos
            </Link>

            <Link
              href="#"
              className="block text-md font-medium transition-colors hover:text-primary"
            >
              Contact
            </Link>

            <div className="flex gap-2 pt-2">
              <Link href={authHref} className="flex-1">
                <Button variant="default" className="w-full text-sm">
                  {authLabel}
                </Button>
              </Link>
              {isAuthenticated ? (
                <Button
                  variant="default"
                  className="flex-1 text-sm"
                  onClick={handleLogout}
                >
                  Se deconnecter
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
