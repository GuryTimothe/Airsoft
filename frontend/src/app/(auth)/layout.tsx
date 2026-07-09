import { cookies } from "next/headers";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { AUTH_TOKEN_KEY, getRolesFromToken } from "@/lib/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_KEY)?.value ?? null;
  const roles = getRolesFromToken(token);

  return (
    <>
      <Header
        initialIsAuthenticated={Boolean(token)}
        initialHasAdminAccess={roles.some((role) =>
          ["ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ORGANIZER"].includes(role),
        )}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
