import { UserDetail } from "@/components/admin/user-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <UserDetail userId={Number(id)} />;
}
