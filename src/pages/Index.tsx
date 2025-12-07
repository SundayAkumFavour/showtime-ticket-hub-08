import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedShows } from '@/components/FeaturedShows';
import { useShows } from '@/hooks/useShows';

const Index = () => {
  const { data: shows = [] } = useShows();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <FeaturedShows shows={shows} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
