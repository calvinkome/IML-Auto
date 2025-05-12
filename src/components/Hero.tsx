import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    try {
      if (path.startsWith('#')) {
        const element = document.querySelector(path);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          throw new Error('Section not found');
        }
      } else {
        navigate(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Une erreur est survenue lors de la redirection';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  return (
    <div id="accueil" className="pt-20 relative h-screen">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=2000")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Votre partenaire de confiance pour la
            <span className="text-yellow-400"> location</span> et le
            <span className="text-yellow-400"> service protocolaire</span>
          </h1>
          <p className="text-xl mb-8 max-w-2xl">
            Location de véhicules haut de gamme et service protocolaire aéroportuaire à Kinshasa
          </p>
          <div className="flex space-x-4">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => handleNavigation('/fleet')}
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Réserver maintenant
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleNavigation('#services')}
              icon={<ChevronDown className="h-5 w-5" />}
            >
              Nos services
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}