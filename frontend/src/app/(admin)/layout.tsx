import { cookies } from "next/headers";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AUTH_TOKEN_KEY } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialIsAllowed = Boolean(cookieStore.get(AUTH_TOKEN_KEY)?.value);

  return (
    <AdminLayoutClient initialIsAllowed={initialIsAllowed}>
      {children}
    </AdminLayoutClient>
  );
}
