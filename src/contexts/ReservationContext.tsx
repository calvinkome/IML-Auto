import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Vehicle } from '../data/vehicles';
import type { ReservationDetails } from '../components/ReservationForm';
import ReservationForm from '../components/ReservationForm';
import SuccessConfirmation from '../components/SuccessConfirmation';
import { useToast } from './ToastContext';

interface ReservationContextType {
  isReserving: boolean;
  selectedVehicle: Vehicle | null;
  startReservation: (vehicle: Vehicle) => void;
  cancelReservation: () => void;
  completeReservation: (details: ReservationDetails) => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [isReserving, setIsReserving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { showToast } = useToast();

  const startReservation = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsReserving(true);
  }, []);

  const cancelReservation = useCallback(() => {
    setSelectedVehicle(null);
    setIsReserving(false);
  }, []);

  const completeReservation = useCallback(async (details: ReservationDetails) => {
    try {
      setIsReserving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Send confirmation email (simulated)
      const emailSent = await sendConfirmationEmail(details.personal.email, {
        ...details,
        vehicle: selectedVehicle
      });

      if (!emailSent) {
        console.warn('Failed to send confirmation email');
      }
      
      setIsReserving(false);
      setSelectedVehicle(null);
      setShowSuccess(true);
    } catch (error) {
      showToast('Erreur lors de la réservation. Veuillez réessayer.', 'error');
      throw error;
    }
  }, [selectedVehicle, showToast]);

  // Simulate sending confirmation email
  const sendConfirmationEmail = async (email: string, details: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  return (
    <ReservationContext.Provider
      value={{
        isReserving,
        selectedVehicle,
        startReservation,
        cancelReservation,
        completeReservation
      }}
    >
      {children}
      {showSuccess && (
        <SuccessConfirmation onClose={() => setShowSuccess(false)} />
      )}
      {isReserving && selectedVehicle && (
        <ReservationForm
          vehicle={selectedVehicle}
          onClose={cancelReservation}
          onConfirm={completeReservation}
        />
      )}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}