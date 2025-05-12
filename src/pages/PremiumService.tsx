import React, { useState } from 'react';
import { Shield, Star, Clock, Users } from 'lucide-react';

const premiumServices = [
  {
    id: 1,
    name: 'Service Chauffeur Privé',
    description: 'Chauffeur personnel expérimenté pour tous vos déplacements',
    price: '200/jour',
    features: [
      'Chauffeur professionnel',
      'Véhicule haut de gamme',
      'Service 24/7',
      'Flexibilité totale'
    ]
  },
  {
    id: 2,
    name: 'Conciergerie VIP',
    description: 'Service de conciergerie personnalisé pour répondre à tous vos besoins',
    price: '150/jour',
    features: [
      'Assistant personnel',
      'Réservations prioritaires',
      'Services sur mesure',
      'Support multilingue'
    ]
  },
  {
    id: 3,
    name: 'Pack Business',
    description: 'Solution complète pour vos déplacements professionnels',
    price: '300/jour',
    features: [
      'Transport premium',
      'Service protocolaire',
      'Assistance administrative',
      'Support logistique'
    ]
  }
];

export default function PremiumService() {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Services Premium</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Des services haut de gamme personnalisés pour une expérience exceptionnelle
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {premiumServices.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-6">
              <Shield className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="mb-6">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 mr-2" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">${service.price}</span>
                <button
                  className="bg-yellow-400 text-black px-6 py-2 rounded-md font-semibold hover:bg-yellow-500"
                  onClick={() => setSelectedService(service.id)}
                >
                  Réserver
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Pourquoi Choisir Nos Services Premium ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <Users className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Personnel Qualifié</h3>
                <p className="text-gray-600">Équipe expérimentée et professionnelle</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Clock className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Disponibilité 24/7</h3>
                <p className="text-gray-600">Service continu et support permanent</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Star className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Service Sur Mesure</h3>
                <p className="text-gray-600">Solutions adaptées à vos besoins</p>
              </div>
            </div>
          </div>
        </div>

        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Demande de Service Premium</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Nom complet</label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-md p-2"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full border rounded-md p-2"
                    placeholder="+243..."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Date de début</label>
                  <input
                    type="date"
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Durée du service</label>
                  <select className="w-full border rounded-md p-2">
                    <option>1 jour</option>
                    <option>2 jours</option>
                    <option>3 jours</option>
                    <option>1 semaine</option>
                    <option>2 semaines</option>
                    <option>1 mois</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Besoins spécifiques</label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder="Décrivez vos besoins particuliers"
                  ></textarea>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-semibold hover:bg-gray-300"
                    onClick={() => setSelectedService(null)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-400 text-black py-2 rounded-md font-semibold hover:bg-yellow-500"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}