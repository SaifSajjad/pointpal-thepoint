import { ChatPanel } from "@/components/ChatPanel";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="bg-[radial-gradient(circle_at_top_left,rgba(239,176,122,.22),transparent_34%),linear-gradient(180deg,#ece5db,#f7f2e9)] px-0 py-5 sm:py-7">
        <ChatPanel />
      </main>
      <Footer />
    </>
  );
}
