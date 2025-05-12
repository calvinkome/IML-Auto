import React, { useState } from 'react';
import { 
  WrenchIcon, 
  CircuitBoard, 
  Thermometer,
  RefreshCcw,
  Cpu,
  Key,
  Car,
  Calendar,
  Clock
} from 'lucide-react';
import FormInput from '../components/FormInput';

interface FormData {
  vehicleType: string;
  date: string;
  time: string;
  email: string;
  phone: string;
  notes: string;
}

interface FormErrors {
  email?: string;
  phone?: string;
}

const diagnosticServices = [
  {
    id: 1,
    icon: WrenchIcon,
    name: 'Diagnostic Mécanique',
    description: 'Inspection complète du moteur et des composants mécaniques',
    price: 50,
  },
  {
    id: 2,
    icon: CircuitBoard,
    name: 'Diagnostic Électronique',
    description: 'Analyse des systèmes électroniques et de la batterie',
    price: 50,
  },
  {
    id: 3,
    icon: Thermometer,
    name: 'Diagnostic Climatisation',
    description: 'Vérification du système de climatisation et de chauffage',
    price: 35,
  },
  {
    id: 4,
    icon: RefreshCcw,
    name: 'Service de réinitialisation',
    description: 'Service de réinitialisation des données de mémoire soft (toutes marques de véhicules)',
    price: 40,
  },
  {
    id: 5,
    icon: Cpu,
    name: 'Programmation Mémoire',
    description: 'Mémoire automobile toutes marque des voiture Electronique',
    price: 60,
  },
  {
    id: 6,
    icon: Key,
    name: 'Programmation des clés de luxe',
    description: 'En fonction de marques des véhicules ou années de fabrication.',
    price: 45,
  },
];

export default function Diagnostics() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    vehicleType: '',
    date: '',
    time: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmailValid && isPhoneValid) {
      console.log('Form submitted:', formData);
      setSelectedService(null);
    }
  };

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Diagnostics Automobiles</h1>
        <p className="text-gray-600 mb-12">
          Service de diagnostic professionnel pour assurer la performance et la sécurité de votre véhicule
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {diagnosticServices.map(service => (
            <div key={service.id} className="bg-white p-6 rounded-lg shadow-lg">
              <service.icon className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
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
          <h2 className="text-2xl font-semibold mb-6">Pourquoi choisir notre service de diagnostic ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <Car className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Expertise Technique</h3>
                <p className="text-gray-600">Techniciens qualifiés et équipements de pointe</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Clock className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Service Rapide</h3>
                <p className="text-gray-600">Diagnostic complet en moins d'une heure</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <WrenchIcon className="h-8 w-8 text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Solutions Complètes</h3>
                <p className="text-gray-600">Recommandations détaillées et devis transparent</p>
              </div>
            </div>
          </div>
        </div>

        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Prendre Rendez-vous</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-700 mb-2">Type de véhicule</label>
                  <input
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    placeholder="Marque et modèle"
                    required
                  />
                </div>

                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={formErrors.email}
                  placeholder="exemple@email.com"
                  required
                  onValidation={setIsEmailValid}
                />

                <FormInput
                  label="Téléphone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={formErrors.phone}
                  placeholder="0X XX XX XX XX"
                  required
                  onValidation={setIsPhoneValid}
                />

                <div>
                  <label className="block text-gray-700 mb-2">Date souhaitée</label>
                  <div className="flex items-center border rounded-md p-2">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full outline-none"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Heure préférée</label>
                  <div className="flex items-center border rounded-md p-2">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full outline-none"
                      required
                    >
                      <option value="">Sélectionnez une heure</option>
                      <option>09:00</option>
                      <option>10:00</option>
                      <option>11:00</option>
                      <option>14:00</option>
                      <option>15:00</option>
                      <option>16:00</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Notes supplémentaires</label>
                  <textarea
                    className="w-full border rounded-md p-2"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Décrivez les problèmes ou symptômes observés"
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
                    className={`flex-1 py-2 rounded-md font-semibold transition-colors ${
                      isEmailValid && isPhoneValid
                        ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isEmailValid || !isPhoneValid}
                  >
                    Confirmer
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