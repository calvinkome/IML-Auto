import React, { useState } from 'react';
import { Plane, Users, Briefcase, Shield, Calendar, Clock, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

interface FormData {
  serviceType: 'vip' | 'standard' | 'baggage';
  flightType: 'arrival' | 'departure';
  date: string;
  time: string;
  flightNumber: string;
  passengers: number;
  notes: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const services = [
  {
    id: 1,
    name: 'Service VIP',
    value: 'vip',
    description: 'Assistance personnalisée complète, accès salon VIP, fast-track',
    price: 150,
    icon: Shield
  },
  {
    id: 2,
    name: 'Service Standard',
    value: 'standard',
    price: 50,
    icon: Users,
    description: 'Accueil personnalisé et assistance aux formalités, vols en nationale salon VIP inclus. Idéal pour ceux qui ont leurs véhicule',
  },
  {
    id: 3,
    name: 'Navette aéroport',
    value: 'baggage',
    price: 65,
    icon: Briefcase,
    description: 'Prise en charge et transport de vos bagages'
  }
];

export default function AirportService() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    serviceType: 'vip',
    flightType: 'arrival',
    date: '',
    time: '',
    flightNumber: '',
    passengers: 1,
    notes: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else if (formData.date < today) {
      newErrors.date = 'La date ne peut pas être dans le passé';
    }

    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }

    if (!formData.flightNumber) {
      newErrors.flightNumber = 'Le numéro de vol est requis';
    } else if (!/^[A-Z0-9]{2,8}$/.test(formData.flightNumber.toUpperCase())) {
      newErrors.flightNumber = 'Format de numéro de vol invalide';
    }

    if (formData.passengers < 1) {
      newErrors.passengers = 'Au moins un passager est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle form submission
      console.log('Form submitted:', formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Service Protocolaire Aéroportuaire</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une assistance personnalisée pour vos arrivées et départs à l'aéroport de Kinshasa
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-6">
              <service.icon className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">${service.price}</span>
                <button
                  className="bg-yellow-400 text-black px-6 py-2 rounded-md font-semibold hover:bg-yellow-500"
                  onClick={() => {
                    setSelectedService(service.value);
                    setFormData(prev => ({
                      ...prev,
                      serviceType: service.value
                    }));
                  }}
                >
                  Réserver
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-semibold mb-6">Nos Services Incluent</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start space-x-3">
              <Plane className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Fast Track</h3>
                <p className="text-gray-600">Passage prioritaire aux contrôles</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Accueil Personnalisé</h3>
                <p className="text-gray-600">Assistant dédié</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Briefcase className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Service Bagages</h3>
                <p className="text-gray-600">Prise en charge complète</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Salon VIP</h3>
                <p className="text-gray-600">Accès aux espaces premium</p>
              </div>
            </div>
          </div>
        </div>

        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full relative">
              <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-2xl font-bold">Réservation Service Aéroportuaire</h2>
              </div>
              
              <div className="px-8 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <fieldset className="border rounded-md p-4">
                    <legend className="text-sm font-medium text-gray-700 px-2">Type de service</legend>
                    <div className="space-y-2">
                      {services.map(service => (
                        <label key={service.value} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="serviceType"
                            value={service.value}
                            checked={formData.serviceType === service.value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="text-gray-900">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de vol
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="flightType"
                        value="arrival"
                        checked={formData.flightType === 'arrival'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-gray-900">Arrivée</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="flightType"
                        value="departure"
                        checked={formData.flightType === 'departure'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="text-gray-900">Départ</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date du vol
                  </label>
                  <div className="flex items-center border rounded-md px-3 h-11">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full outline-none h-full"
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure du vol
                  </label>
                  <div className="flex items-center border rounded-md px-3 h-11">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full outline-none h-full"
                    />
                  </div>
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.time}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de vol
                  </label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    placeholder="Ex: AF123"
                    className="w-full h-11 border rounded-md px-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  {errors.flightNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.flightNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de passagers
                  </label>
                  <input
                    type="number"
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full h-11 border rounded-md px-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                  {errors.passengers && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.passengers}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes spéciales
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Besoins particuliers ou demandes spéciales"
                  ></textarea>
                </div>
              </form>
              </div>

              <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-gray-200 rounded-b-lg">
                <div className="flex space-x-4">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setSelectedService(null)}
                    fullWidth
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    fullWidth
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}