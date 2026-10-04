import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIRentalSetup from "@/components/AIRentalSetup";

type PageProps = {
  params: Promise<{
    orderItemId: string;
  }>;
};

export default async function AIRentalPage({
  params,
}: PageProps) {
  const { orderItemId } =
    await params;

  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
      <AIRentalSetup
        orderItemId={orderItemId}
      />
      <Footer />
    </main>
  );
}
