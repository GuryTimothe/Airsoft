import { UserDetail } from "@/components/admin/user-detail";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ emailChangeRequested?: string }>;
}

export default async function UserDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { emailChangeRequested } = await searchParams;

  return (
    <UserDetail
      userId={Number(id)}
      emailChangeRequested={emailChangeRequested === "1"}
    />
  );
}
