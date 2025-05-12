import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import PaymentForm from './PaymentForm';
import type { Vehicle } from '../data/vehicles';

interface ReservationModalProps {
  amount: number;
  onClose: () => void;
  onConfirm: (details: any) => void;
  vehicle?: Vehicle;
}

export default function ReservationModal({ amount, onClose, onConfirm, vehicle }: ReservationModalProps) {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [reservationDetails, setReservationDetails] = useState({
    startDate: '',
    duration: '1',
    specialRequests: '',
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationDetails.startDate) {
      return;
    }
    setStep('payment');
  };

  const handlePaymentConfirm = (paymentDetails: any) => {
    onConfirm({
      ...reservationDetails,
      ...paymentDetails,
    });
  };

  if (step === 'payment') {
    return (
      <PaymentForm
        amount={amount * parseInt(reservationDetails.duration)}
        onClose={onClose}
        onConfirm={handlePaymentConfirm}
        title="Réservation"
      >
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Détails de la réservation</h3>
          <p className="text-sm text-gray-600">Véhicule: {vehicle?.name}</p>
          <p className="text-sm text-gray-600">Durée: {reservationDetails.duration} jour(s)</p>
        </div>
      </PaymentForm>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Réserver {vehicle?.name}</h2>
        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <div className="flex items-center border rounded-md p-2">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="date"
                value={reservationDetails.startDate}
                onChange={(e) => {
                  const today = new Date().toISOString().split('T')[0];
                  if (e.target.value < today) {
                    return;
                  }
                  setReservationDetails((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }));
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée
            </label>
            <div className="flex items-center border rounded-md p-2">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={reservationDetails.duration}
                onChange={(e) =>
                  setReservationDetails((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                className="w-full outline-none"
                required
              >
                <option value="1">1 jour</option>
                <option value="2">2 jours</option>
                <option value="3">3 jours</option>
                <option value="7">1 semaine</option>
                <option value="14">2 semaines</option>
                <option value="30">1 mois</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandes spéciales
            </label>
            <textarea
              value={reservationDetails.specialRequests}
              onChange={(e) =>
                setReservationDetails((prev) => ({
                  ...prev,
                  specialRequests: e.target.value,
                }))
              }
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Instructions particulières ou besoins spécifiques"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-semibold hover:bg-gray-300"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-400 text-black py-2 rounded-md font-semibold hover:bg-yellow-500"
            >
              Continuer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}