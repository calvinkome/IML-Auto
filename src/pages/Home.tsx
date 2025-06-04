import EnhancedCarList from '../components/EnhancedCarList';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Testimonials from '../components/Testimonials';

export default function Home() {
  return (
    <div>
      <Hero />
      <Services />
      <EnhancedCarList showAll={true} />
      <Testimonials />
    </div>
  );
}
