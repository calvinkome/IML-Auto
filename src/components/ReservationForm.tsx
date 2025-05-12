import React, { useState } from 'react';
import { Calendar, Clock, Users, FileText, AlertCircle } from 'lucide-react';
import FormInput from './FormInput';
import Button from './Button';
import PaymentForm from './PaymentForm';
import type { Vehicle } from '../data/vehicles';

interface ReservationFormProps {
  vehicle: Vehicle;
  onClose: () => void;
  onConfirm: (details: ReservationDetails) => void;
}

export interface ReservationDetails {
  personal: {
    name: string;
    email: string;
    phone: string;
  };
  booking: {
    date: string;
    time: string;
    duration: number;
    guests: number;
    specialRequests: string;
  };
  payment: {
    method: string;
    details: any;
  };
}

type Step = 'personal' | 'booking' | 'payment' | 'summary';

export default function ReservationForm({ vehicle, onClose, onConfirm }: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [formData, setFormData] = useState<ReservationDetails>({
    personal: {
      name: '',
      email: '',
      phone: ''
    },
    booking: {
      date: '',
      time: '',
      duration: 1,
      guests: 1,
      specialRequests: ''
    },
    payment: {
      method: '',
      details: null
    }
  });
  const [validations, setValidations] = useState({
    email: false,
    phone: false
  });

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validations.email && validations.phone) {
      setCurrentStep('booking');
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.booking.date && formData.booking.time) {
      setCurrentStep('payment');
    }
  };

  const handlePaymentSubmit = (paymentDetails: any) => {
    setFormData(prev => ({
      ...prev,
      payment: {
        method: paymentDetails.method,
        details: paymentDetails
      }
    }));
    setCurrentStep('summary');
  };

  const handleConfirm = () => {
    onConfirm(formData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <form onSubmit={handlePersonalInfoSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.personal.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, name: e.target.value }
                }))}
                className="w-full border rounded-md p-2"
                required
              />
            </div>

            <FormInput
              label="Email"
              type="email"
              value={formData.personal.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personal: { ...prev.personal, email: e.target.value }
              }))}
              onValidation={(isValid) => setValidations(prev => ({ ...prev, email: isValid }))}
              error={validations.email ? '' : 'Email invalide'}
            />

            <FormInput
              label="Téléphone"
              type="tel"
              value={formData.personal.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personal: { ...prev.personal, phone: e.target.value }
              }))}
              onValidation={(isValid) => setValidations(prev => ({ ...prev, phone: isValid }))}
              error={validations.phone ? '' : 'Numéro de téléphone invalide'}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Button variant="secondary" onClick={onClose} fullWidth>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!validations.email || !validations.phone}
              >
                Suivant
              </Button>
            </div>
          </form>
        );

      case 'booking':
        return (
          <form onSubmit={handleBookingSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="flex items-center border rounded-md p-2">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="date"
                  value={formData.booking.date}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    booking: { ...prev.booking, date: e.target.value }
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure
              </label>
              <div className="flex items-center border rounded-md p-2">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="time"
                  value={formData.booking.time}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    booking: { ...prev.booking, time: e.target.value }
                  }))}
                  className="w-full outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de location (jours)
              </label>
              <div className="flex items-center border rounded-md p-2">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="number"
                  value={formData.booking.duration}
                  onChange={(e) => {
                    const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 30);
                    setFormData(prev => ({
                      ...prev,
                      booking: { ...prev.booking, duration: value }
                    }));
                  }}
                  min="1"
                  max="30"
                  className="w-full outline-none"
                  required
                />
              </div>
              {formData.booking.duration > 30 && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  La durée maximale est de 30 jours
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de personnes
              </label>
              <div className="flex items-center border rounded-md p-2">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="number"
                  value={formData.booking.guests}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    booking: { ...prev.booking, guests: parseInt(e.target.value) }
                  }))}
                  min="1"
                  className="w-full outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demandes spéciales
              </label>
              <div className="flex items-start border rounded-md p-2">
                <FileText className="h-5 w-5 text-gray-400 mr-2 mt-1" />
                <textarea
                  value={formData.booking.specialRequests}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    booking: { ...prev.booking, specialRequests: e.target.value }
                  }))}
                  rows={3}
                  className="w-full outline-none resize-none"
                  placeholder="Instructions particulières ou besoins spécifiques"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('personal')}
                fullWidth
              >
                Retour
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Suivant
              </Button>
            </div>
          </form>
        );

      case 'payment':
        return (
          <PaymentForm
            amount={vehicle.price}
            duration={formData.booking.duration}
            onCancel={() => setCurrentStep('booking')}
            onSubmit={handlePaymentSubmit}
          />
        );

      case 'summary':
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Résumé de la réservation</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Véhicule:</span> {vehicle.name}</p>
                <p><span className="font-medium">Date:</span> {formData.booking.date}</p>
                <p><span className="font-medium">Heure:</span> {formData.booking.time}</p>
                <p><span className="font-medium">Durée:</span> {formData.booking.duration} jour{formData.booking.duration > 1 ? 's' : ''}</p>
                <p><span className="font-medium">Personnes:</span> {formData.booking.guests}</p>
                <p><span className="font-medium">Montant:</span> {vehicle.price * formData.booking.duration}€</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep('payment')}
                fullWidth
              >
                Retour
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                fullWidth
              >
                Confirmer la réservation
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-lg my-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Réservation - {vehicle.name}</h2>
        </div>
        
        <div className="p-4 md:p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}