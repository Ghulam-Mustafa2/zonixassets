import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountDashboard from "@/components/AccountDashboard";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <AccountDashboard />

      <Footer />
    </main>
  );
}