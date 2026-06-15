import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TopStrip } from "@/components/layout/TopStrip";
import { ChatWidget } from "@/components/ai/ChatWidget";

interface ShopShellProps {
  children: React.ReactNode;
}

// ✅ Default export
export default async function ShopShell({ children }: ShopShellProps) {
  return (
    <>
      <TopStrip />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
