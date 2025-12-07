import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedShows } from '@/components/FeaturedShows';
import { mockShows } from '@/data/mockShows';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 md:pt-20">
        <HeroSection />
        <FeaturedShows shows={mockShows} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
