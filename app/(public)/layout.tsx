import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAdButton from '@/components/FloatingAdButton';
import TrustMarquee from '@/components/ui/TrustMarquee';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800 flex flex-col justify-between">
      {/* Unified Sticky Header: Trust Marquee & Navbar welded together */}
      <header className="sticky top-0 z-[100] w-full flex flex-col bg-[#0B1528] shadow-lg">
        <TrustMarquee />
        <Navbar />
      </header>

      <main className="flex-grow">{children}</main>

      <Footer />
      <FloatingAdButton />
      <PwaInstallPrompt />
    </div>
  );
}
