import { UserForm } from "@/components/admin/user-form";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params;

  const userId = Number(id);

  if (!Number.isFinite(userId) || userId <= 0) {
    redirect("/admin/users");
  }

  return <UserForm userId={userId} />;
}
