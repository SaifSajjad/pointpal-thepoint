import { About } from "@/components/About";
import { ChatPanel } from "@/components/ChatPanel";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { MenuDiscovery } from "@/components/MenuDiscovery";
import { Navigation } from "@/components/Navigation";
import { RecommendationFlow } from "@/components/RecommendationFlow";
import { Visit } from "@/components/Visit";

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <ChatPanel />
        <MenuDiscovery />
        <RecommendationFlow />
        <About />
        <Visit />
      </main>
      <Footer />
    </>
  );
}
