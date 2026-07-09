import type { UserRole } from "@/lib/user-api";

type FooterProps = {
  userRole: UserRole | null;
};

export function Footer({ userRole }: FooterProps) {
  const isOrganizer = userRole === "ROLE_ORGANIZER";

  return (
    <footer className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
      <span suppressHydrationWarning>
        © {new Date().getFullYear()} Airsoft Event Manager
      </span>

      <div className="flex items-center gap-4">
        {!isOrganizer ? (
          <a href="/admin/settings" className="hover:underline">
            Paramètres
          </a>
        ) : null}
      </div>
    </footer>
  );
}
