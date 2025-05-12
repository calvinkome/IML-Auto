import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Shield, Clock, Users, Star, PenTool as Tool } from 'lucide-react';

const services = [
  {
    icon: Plane,
    title: 'Service Aéroportuaire',
    description: "Assistance VIP et service protocolaire à l'aéroport de Kinshasa",
    link: '/airport-service',
  },
  {
    icon: Shield,
    title: 'Service Premium',
    description: 'Service de conciergerie personnalisé et chauffeur privé',
    link: '/premium-service',
  },
  {
    icon: Tool,
    title: 'Diagnostic Automobile',
    description: 'Inspection complète et maintenance préventive de votre véhicule',
    link: '/diagnostics',
  },
  {
    icon: Users,
    title: 'Service Protocolaire',
    description: 'Accompagnement personnalisé pour vos événements importants',
    link: '/premium-service',
  },
  {
    icon: Star,
    title: 'Service Longue Durée',
    description: 'Solutions personnalisées pour les entreprises et particuliers',
    link: '/premium-service',
  },
];

export default function Services() {
  const navigate = useNavigate();

  const handleServiceClick = useCallback(
    (link: string) => {
      try {
        navigate(link);
      } catch (error) {
        console.error('Navigation error:', error);
        const toast = document.createElement('div');
        toast.className =
          'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = 'Une erreur est survenue lors de la redirection';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    },
    [navigate]
  );

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4">Nos Services</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Une gamme complète de services premium pour répondre à tous vos besoins
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleServiceClick(service.link)}
            >
              <service.icon className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
              <div className="mt-4 flex justify-end">
                <span className="text-yellow-400 font-medium">En savoir plus →</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-black text-white rounded-lg p-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Support Client 24/7</h3>
            <p className="text-gray-300">
              Notre équipe est disponible à tout moment pour vous assister
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-yellow-400" />
            <span className="font-semibold">+243 819 623 320</span>
          </div>
        </div>
      </div>
    </section>
  );
}