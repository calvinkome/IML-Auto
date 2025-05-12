import React from 'react';
import Button from './Button';
import { useReservation } from '../contexts/ReservationContext';
import type { Vehicle } from '../data/vehicles';
import { useToast } from '../contexts/ToastContext';

interface ReserveButtonProps {
  vehicle: Vehicle;
  className?: string;
}

export default function ReserveButton({ vehicle, className = '' }: ReserveButtonProps) {
  const { isReserving, startReservation } = useReservation();
  const { showToast } = useToast();

  const handleClick = () => {
    try {
      if (!vehicle.available) {
        showToast('Ce véhicule n\'est pas disponible actuellement', 'error');
        return;
      }
      startReservation(vehicle);
    } catch (error) {
      console.error('Reservation error:', error);
      showToast('Une erreur est survenue lors de la réservation', 'error');
    }
  };

  return (
    <Button
      variant="primary"
      size="sm"
      loading={isReserving}
      disabled={!vehicle.available || isReserving}
      onClick={handleClick}
      className={`min-w-[120px] ${className}`}
      aria-label={vehicle.available ? `Réserver ${vehicle.name}` : `${vehicle.name} non disponible`}
    >
      {vehicle.available ? 'Réserver' : 'Non disponible'}
    </Button>
  );
}