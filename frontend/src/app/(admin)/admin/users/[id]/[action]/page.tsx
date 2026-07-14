import { UserForm } from "@/components/admin/user-form";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getUser } from "@/lib/user-api";

interface PageProps {
  params: Promise<{ id: string; action: string }>;
}

export default async function UserActionPage({ params }: PageProps) {
  const { id, action } = await params;

  if (action !== "edit") {
    notFound();
  }

  const userId = Number(id);

  if (!Number.isFinite(userId) || userId <= 0) {
    redirect("/admin/users");
  }

  try {
    const [actor, target] = await Promise.all([
      getCurrentUser(),
      getUser(userId),
    ]);

    const canEditTarget =
      actor.role === "ROLE_SUPER_ADMIN" ||
      (actor.role === "ROLE_ADMIN" &&
        (target.role === "ROLE_USER" || target.role === "ROLE_ORGANIZER"));

    if (!canEditTarget) {
      redirect(`/admin/users/${userId}`);
    }
  } catch {
    redirect(`/admin/users/${userId}`);
  }

  return <UserForm userId={userId} />;
}
