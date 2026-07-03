import { UserForm } from "@/components/admin/user-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  return <UserForm userId={Number(id)} />;
}
