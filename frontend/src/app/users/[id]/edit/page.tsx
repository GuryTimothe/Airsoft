import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyEditUserRedirectPage({
  params,
}: PageProps) {
  const { id } = await params;
  redirect(`/admin/users/${id}/edit`);
}
