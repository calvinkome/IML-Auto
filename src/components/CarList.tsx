import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Button from './Button';
import { useToast } from '../contexts/ToastContext';
import ReserveButton from './ReserveButton';
import { vehicles, categories, type Vehicle, type VehicleCategory } from '../data/vehicles';
import { useReservation } from '../contexts/ReservationContext';
import { Star, ImageOff } from 'lucide-react';

// Définition des types pour l'état de chargement des images
interface ImageLoadingState {
  loaded: boolean;
  error: boolean;
}

// Définition des types pour les filtres
interface FilterState {
  price: number;
  category: string;
  availability: string;
  date: string;
}

// Liste de toutes les catégories, y compris "Toutes les catégories"
const allCategories: VehicleCategory[] = ['Toutes les catégories', ...categories];

export default function CarList() {
  // États pour les filtres et le chargement des images
  const [filters, setFilters] = useState<FilterState>({
    price: 500,
    category: 'Toutes les catégories',
    availability: 'Tous les véhicules',
    date: new Date().toISOString().split('T')[0],
  });

  const [imageStates, setImageStates] = useState<Record<number, ImageLoadingState>>({});
  const { selectedVehicle, isReserving } = useReservation();
  const { showToast } = useToast();
  const imageObserver = useRef<IntersectionObserver | null>(null);
  const imageRetryCount = useRef<Record<number, number>>({});
  const MAX_RETRIES = 3;

  // Filtrage des véhicules en fonction des critères sélectionnés
  const filteredCars = useMemo(() => {
    return vehicles.filter((car) => {
      const matchesCategory = filters.category === 'Toutes les catégories' || car.category === filters.category;
      const matchesPrice = car.price <= filters.price;
      const matchesAvailability =
        filters.availability === 'Tous les véhicules' ||
        (filters.availability === 'Disponible' && car.status?.state === 'in_service') ||
        (filters.availability === 'Non disponible' && (!car.status?.state || car.status.state !== 'in_service'));
      return matchesCategory && matchesPrice && matchesAvailability;
    });
  }, [filters]);

  // Configuration de l'IntersectionObserver pour le chargement différé des images
  useEffect(() => {
    imageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.getAttribute('src')?.includes('data:image') && imageRetryCount.current[parseInt(entry.target.dataset.carid || '0')] < MAX_RETRIES) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              const tempImg = new Image();
              tempImg.onload = () => {
                img.src = src;
                requestAnimationFrame(() => {
                  img.classList.remove('opacity-0');
                });
                const carId = parseInt(img.dataset.carid || '0');
                setImageStates((prev) => ({
                  ...prev,
                  [carId]: { loaded: true, error: false },
                }));
              };
              tempImg.onerror = () => {
                const carId = parseInt(img.dataset.carid || '0');
                imageRetryCount.current[carId] = (imageRetryCount.current[carId] || 0) + 1;
                
                // Try loading a smaller version if available
                if (imageRetryCount.current[carId] <= MAX_RETRIES) {
                  const smallerSrc = src.replace('w=2000', 'w=800');
                  tempImg.src = smallerSrc;
                  return;
                }
                
                setImageStates((prev) => ({
                  ...prev,
                  [carId]: { loaded: false, error: true },
                }));
                console.error(`Failed to load image for car ${carId} after ${MAX_RETRIES} retries`);
              };
              tempImg.src = src;
              imageObserver.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    return () => {
      imageObserver.current?.disconnect();
    };
  }, []);

  // Fonction pour associer une référence d'image à l'IntersectionObserver
  const handleImageRef = (node: HTMLImageElement | null) => {
    if (node && imageObserver.current) {
      imageObserver.current.observe(node);
    }
  };

  return (
    <section id="vehicules" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section des filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <div className="grid md:grid-cols-4 gap-6">
            {/* Filtre par prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix par jour</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={filters.price}
                  onChange={(e) => setFilters((prev) => ({ ...prev, price: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <span className="text-yellow-400 font-semibold">{filters.price}$</span>
              </div>
            </div>

            {/* Filtre par catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                {allCategories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filtre par disponibilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilité</label>
              <select
                value={filters.availability}
                onChange={(e) => setFilters((prev) => ({ ...prev, availability: e.target.value }))}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                <option>Tous les véhicules</option>
                <option>Disponible</option>
                <option>Non disponible</option>
              </select>
            </div>

            {/* Filtre par date de location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de location</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Grille des véhicules */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:translate-y-[-4px]"
            >
              {/* Section de l'image */}
              <div className="relative bg-gray-100 h-56">
                {imageStates[car.id]?.error ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-400" role="alert" aria-live="polite">
                      <ImageOff className="h-12 w-12 mx-auto mb-2" />
                      <span className="text-sm">Image non disponible</span>
                      <button
                        onClick={() => {
                          imageRetryCount.current[car.id] = 0;
                          setImageStates(prev => ({
                            ...prev,
                            [car.id]: { loaded: false, error: false }
                          }));
                        }}
                        className="mt-2 text-yellow-400 hover:text-yellow-500 text-sm underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    ref={handleImageRef}
                    data-src={car.image}
                    data-carid={car.id}
                    data-testid={`car-image-${car.id}`}
                    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    alt={car.name}
                    className={`w-full h-56 object-cover transition-opacity duration-300 ${
                      imageStates[car.id]?.loaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src !== img.dataset.src) {
                        img.src = img.dataset.src || '';
                      }
                    }}
                  />
                )}
                {/* Badge de disponibilité */}
                {(!car.status?.state || car.status.state !== 'in_service') && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {!car.status?.state
                      ? 'Non disponible'
                      : car.status.state === 'maintenance'
                      ? 'En maintenance'
                      : car.status.state === 'rented'
                      ? 'En location'
                      : car.status.state === 'out_of_service'
                      ? 'Hors service'
                      : 'Non disponible'}
                  </div>
                )}
                {/* Date de retour prévue */}
                {car.status?.expectedReturnDate && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                    Retour prévu: {new Date(car.status.expectedReturnDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Détails du véhicule */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{car.name}</h3>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-yellow-400">{car.price}$</span>
                    <span className="text-sm text-gray-500 block">/jour</span>
                  </div>
                </div>
                <p className="text-gray-600 inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">{car.category}</p>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(car.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({car.reviews} avis)</span>
                </div>
                <ReserveButton vehicle={car} className="w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}