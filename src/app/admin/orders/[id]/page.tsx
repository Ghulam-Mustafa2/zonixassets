import AdminOrderDetails from "@/components/AdminOrderDetails";

type AdminOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderPage({
  params,
}: AdminOrderPageProps) {
  const { id } = await params;

  return <AdminOrderDetails orderId={id} />;
}