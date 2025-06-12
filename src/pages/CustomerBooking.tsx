import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Filter,
  Fuel,
  Heart,
  Loader,
  MapPin,
  Search,
  Settings,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Enhanced types for customer booking
interface BookingSearchFilters {
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  seats: number;
  transmission: string;
  fuelType: string;
}

interface VehicleWithAvailability {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  daily_rate: number;
  features: string[];
  specifications: any;
  pricing: any;
  image: string;
  rating: number;
  review_count: number;
  is_available: boolean;
  total_price: number;
  discounted_price: number;
  discount_percentage: number;
}

interface BookingDetails {
  vehicle_id: string;
  start_date: string;
  end_date: string;
  pickup_location: string;
  dropoff_location: string;
  customer_info: {
    full_name: string;
    email: string;
    phone: string;
    license_number: string;
  };
  special_requests: string;
  total_amount: number;
}

const categories = [
  { value: '', label: 'Toutes catégories' },
  { value: 'economic', label: 'Économique' },
  { value: 'luxury', label: 'Luxe' },
  { value: 'suv', label: 'SUV' },
  { value: 'utility', label: 'Utilitaire' },
];

const transmissionTypes = [
  { value: '', label: 'Toutes transmissions' },
  { value: 'Manuelle', label: 'Manuelle' },
  { value: 'Automatique', label: 'Automatique' },
];

const fuelTypes = [
  { value: '', label: 'Tous carburants' },
  { value: 'Essence', label: 'Essence' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Hybride', label: 'Hybride' },
  { value: 'Électrique', label: 'Électrique' },
];

const CustomerBookingSystem: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<
    'search' | 'select' | 'details' | 'confirmation'
  >('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [filters, setFilters] = useState<BookingSearchFilters>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    pickupLocation: '',
    dropoffLocation: '',
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    seats: 0,
    transmission: '',
    fuelType: '',
  });

  const [vehicles, setVehicles] = useState<VehicleWithAvailability[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleWithAvailability | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Booking state
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    vehicle_id: '',
    start_date: '',
    end_date: '',
    pickup_location: '',
    dropoff_location: '',
    customer_info: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      license_number: '',
    },
    special_requests: '',
    total_amount: 0,
  });

  // Calculate rental duration
  const calculateDuration = useCallback(
    (start: string, end: string): number => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    []
  );

  // Search vehicles
  const searchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('rental_status', 'available');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.minPrice > 0) {
        query = query.gte('daily_rate', filters.minPrice);
      }

      if (filters.maxPrice < 1000) {
        query = query.lte('daily_rate', filters.maxPrice);
      }

      const { data: vehiclesData, error: vehiclesError } = await query;
      console.log('vehiclesData:', vehiclesData);
      if (vehiclesError) throw vehiclesError;

      // Check availability for date range
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('vehicle_id, start_date, end_date')
        .in('booking_status', ['confirmed', 'active'])
        .or(
          `start_date.lte.${filters.endDate},end_date.gte.${filters.startDate}`
        );

      const bookedVehicleIds = new Set(
        bookingsData?.map((b) => b.vehicle_id) || []
      );

      // Calculate pricing and availability
      const duration = calculateDuration(filters.startDate, filters.endDate);
      const availableVehicles: VehicleWithAvailability[] = (vehiclesData || [])
        .filter((vehicle) => !bookedVehicleIds.has(vehicle.id))
        .filter((vehicle) => {
          // Additional filters
          if (
            filters.seats > 0 &&
            vehicle.specifications?.seats < filters.seats
          )
            return false;
          if (
            filters.transmission &&
            vehicle.specifications?.transmission !== filters.transmission
          )
            return false;
          if (
            filters.fuelType &&
            vehicle.specifications?.fuel_type !== filters.fuelType
          )
            return false;
          return true;
        })
        .map((vehicle) => {
          const basePrice = vehicle.daily_rate * duration;
          let discountedPrice = basePrice;
          let discountPercentage = 0;

          // Apply discounts
          if (duration >= 30 && vehicle.pricing?.monthly_discount) {
            discountPercentage = vehicle.pricing.monthly_discount;
          } else if (duration >= 7 && vehicle.pricing?.weekly_discount) {
            discountPercentage = vehicle.pricing.weekly_discount;
          }

          if (discountPercentage > 0) {
            discountedPrice = basePrice * (1 - discountPercentage / 100);
          }

          return {
            ...vehicle,
            is_available: true,
            total_price: basePrice,
            discounted_price: discountedPrice,
            discount_percentage: discountPercentage,
            rating: 4.5, // Mock rating
            review_count: Math.floor(Math.random() * 100) + 10,
            image: '/api/placeholder/300/200', // Placeholder image
          };
        });

      setVehicles(availableVehicles);
    } catch (err) {
      console.error('Search error:', err);
      setError('Erreur lors de la recherche de véhicules');
    } finally {
      setLoading(false);
    }
  }, [filters, calculateDuration]);

  // Initialize search on component mount
  useEffect(() => {
    searchVehicles();
  }, []);

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: VehicleWithAvailability) => {
    setSelectedVehicle(vehicle);
    setBookingDetails((prev) => ({
      ...prev,
      vehicle_id: vehicle.id,
      start_date: filters.startDate,
      end_date: filters.endDate,
      pickup_location: filters.pickupLocation,
      dropoff_location: filters.dropoffLocation,
      total_amount: vehicle.discounted_price,
    }));
    setCurrentStep('details');
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (
        !bookingDetails.customer_info.full_name ||
        !bookingDetails.customer_info.email ||
        !bookingDetails.customer_info.phone
      ) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user?.user_id,
            vehicle_id: bookingDetails.vehicle_id,
            start_date: bookingDetails.start_date,
            end_date: bookingDetails.end_date,
            pickup_location: bookingDetails.pickup_location,
            dropoff_location: bookingDetails.dropoff_location,
            total_amount: bookingDetails.total_amount,
            booking_status: 'pending',
            special_requests: bookingDetails.special_requests,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentStep('confirmation');
    } catch (err) {
      console.error('Booking error:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la réservation'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Render search form
  const renderSearchForm = () => (
    <div className='space-y-6'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          Réservez votre véhicule
        </h1>
        <p className='text-xl text-gray-600'>
          Trouvez le véhicule parfait pour votre voyage
        </p>
      </div>

      {/* Main Search Form */}
      <div className='bg-white rounded-lg shadow-lg p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date de début
            </label>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='date'
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                min={new Date().toISOString().split('T')[0]}
                className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Date de fin
            </label>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='date'
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                min={filters.startDate}
                className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Lieu de retrait
            </label>
            <div className='relative'>
              <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                value={filters.pickupLocation}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    pickupLocation: e.target.value,
                  }))
                }
                placeholder='Aéroport, hôtel...'
                className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Lieu de retour
            </label>
            <div className='relative'>
              <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                value={filters.dropoffLocation}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dropoffLocation: e.target.value,
                  }))
                }
                placeholder='Même lieu ou différent'
                className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between mt-6'>
          <Button
            variant='ghost'
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className='h-4 w-4' />}
          >
            Filtres avancés
          </Button>

          <Button
            variant='primary'
            onClick={searchVehicles}
            loading={loading}
            icon={<Search className='h-4 w-4' />}
          >
            Rechercher
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Catégorie
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Prix max/jour
                </label>
                <input
                  type='number'
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxPrice: parseInt(e.target.value),
                    }))
                  }
                  min='0'
                  max='1000'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Places min
                </label>
                <select
                  value={filters.seats}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      seats: parseInt(e.target.value),
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                >
                  <option value='0'>Toutes</option>
                  <option value='2'>2+</option>
                  <option value='4'>4+</option>
                  <option value='5'>5+</option>
                  <option value='7'>7+</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Transmission
                </label>
                <select
                  value={filters.transmission}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      transmission: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                >
                  {transmissionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Carburant
                </label>
                <select
                  value={filters.fuelType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      fuelType: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                >
                  {fuelTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-semibold text-gray-900'>
            Véhicules disponibles ({vehicles.length})
          </h2>
        </div>

        {loading ? (
          <div className='text-center py-12'>
            <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
            <p className='text-gray-600'>Recherche en cours...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className='text-center py-12'>
            <Car className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun véhicule disponible
            </h3>
            <p className='text-gray-600'>
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'
              >
                <div className='relative'>
                  <img
                    src={vehicle.primary_image}
                    alt={vehicle.name}
                    className='w-full h-48 object-cover'
                  />
                  {vehicle.discount_percentage > 0 && (
                    <div className='absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
                      -{vehicle.discount_percentage}%
                    </div>
                  )}
                  <button className='absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50'>
                    <Heart className='h-4 w-4 text-gray-400' />
                  </button>
                </div>

                <div className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-semibold text-gray-900'>
                      {vehicle.name}
                    </h3>
                    <div className='flex items-center space-x-1'>
                      <Star className='h-4 w-4 text-yellow-400 fill-current' />
                      <span className='text-sm text-gray-600'>
                        {vehicle.rating}
                      </span>
                      <span className='text-sm text-gray-400'>
                        ({vehicle.review_count})
                      </span>
                    </div>
                  </div>

                  <p className='text-sm text-gray-600 mb-3'>
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </p>

                  {/* Vehicle Features */}
                  <div className='flex items-center space-x-4 mb-4 text-sm text-gray-600'>
                    <div className='flex items-center space-x-1'>
                      <Users className='h-4 w-4' />
                      <span>{vehicle.specifications?.seats || 5}</span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Settings className='h-4 w-4' />
                      <span>
                        {vehicle.specifications?.transmission || 'Manuel'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Fuel className='h-4 w-4' />
                      <span>
                        {vehicle.specifications?.fuel_type || 'Essence'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      {vehicle.discount_percentage > 0 ? (
                        <div>
                          <span className='text-lg font-bold text-gray-900'>
                            {formatCurrency(vehicle.discounted_price)}
                          </span>
                          <span className='text-sm text-gray-500 line-through ml-2'>
                            {formatCurrency(vehicle.total_price)}
                          </span>
                        </div>
                      ) : (
                        <span className='text-lg font-bold text-gray-900'>
                          {formatCurrency(vehicle.total_price)}
                        </span>
                      )}
                      <p className='text-sm text-gray-500'>
                        Pour{' '}
                        {calculateDuration(filters.startDate, filters.endDate)}{' '}
                        jour(s)
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant='primary'
                    fullWidth
                    onClick={() => handleVehicleSelect(vehicle)}
                    icon={<ArrowRight className='h-4 w-4' />}
                  >
                    Sélectionner
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render booking details form
  const renderBookingDetails = () => (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-8'>
        <Button
          variant='ghost'
          onClick={() => setCurrentStep('search')}
          className='mb-4'
        >
          ← Retour à la recherche
        </Button>
        <h1 className='text-3xl font-bold text-gray-900 mb-4'>
          Finaliser votre réservation
        </h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Booking Form */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>
              Vos informations
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom complet *
                </label>
                <input
                  type='text'
                  value={bookingDetails.customer_info.full_name}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      customer_info: {
                        ...prev.customer_info,
                        full_name: e.target.value,
                      },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email *
                </label>
                <input
                  type='email'
                  value={bookingDetails.customer_info.email}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      customer_info: {
                        ...prev.customer_info,
                        email: e.target.value,
                      },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Téléphone *
                </label>
                <input
                  type='tel'
                  value={bookingDetails.customer_info.phone}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      customer_info: {
                        ...prev.customer_info,
                        phone: e.target.value,
                      },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Numéro de permis *
                </label>
                <input
                  type='text'
                  value={bookingDetails.customer_info.license_number}
                  onChange={(e) =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      customer_info: {
                        ...prev.customer_info,
                        license_number: e.target.value,
                      },
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  required
                />
              </div>
            </div>

            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Demandes spéciales
              </label>
              <textarea
                value={bookingDetails.special_requests}
                onChange={(e) =>
                  setBookingDetails((prev) => ({
                    ...prev,
                    special_requests: e.target.value,
                  }))
                }
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                placeholder='Siège bébé, GPS supplémentaire, etc.'
              />
            </div>

            {error && (
              <div className='mt-4 bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-center'>
                  <AlertCircle className='h-5 w-5 text-red-400 mr-2' />
                  <span className='text-red-700'>{error}</span>
                </div>
              </div>
            )}

            <div className='mt-6'>
              <Button
                variant='primary'
                onClick={handleBookingSubmit}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Confirmer la réservation
              </Button>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow-md p-6 sticky top-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Résumé de la réservation
            </h3>

            {selectedVehicle && (
              <div>
                <div className='flex items-center space-x-3 mb-4'>
                  <img
                    src={selectedVehicle.image}
                    alt={selectedVehicle.name}
                    className='w-16 h-12 object-cover rounded'
                  />
                  <div>
                    <h4 className='font-medium text-gray-900'>
                      {selectedVehicle.name}
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {selectedVehicle.make} {selectedVehicle.model}{' '}
                      {selectedVehicle.year}
                    </p>
                  </div>
                </div>

                <div className='border-t border-gray-200 pt-4 space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Du:</span>
                    <span className='font-medium'>
                      {formatDate(filters.startDate)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Au:</span>
                    <span className='font-medium'>
                      {formatDate(filters.endDate)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Durée:</span>
                    <span className='font-medium'>
                      {calculateDuration(filters.startDate, filters.endDate)}{' '}
                      jour(s)
                    </span>
                  </div>
                  {filters.pickupLocation && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Retrait:</span>
                      <span className='font-medium'>
                        {filters.pickupLocation}
                      </span>
                    </div>
                  )}
                  {filters.dropoffLocation && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Retour:</span>
                      <span className='font-medium'>
                        {filters.dropoffLocation}
                      </span>
                    </div>
                  )}
                </div>

                <div className='border-t border-gray-200 pt-4 mt-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tarif de base:</span>
                      <span>{formatCurrency(selectedVehicle.total_price)}</span>
                    </div>
                    {selectedVehicle.discount_percentage > 0 && (
                      <div className='flex justify-between text-sm text-green-600'>
                        <span>
                          Remise ({selectedVehicle.discount_percentage}%):
                        </span>
                        <span>
                          -
                          {formatCurrency(
                            selectedVehicle.total_price -
                              selectedVehicle.discounted_price
                          )}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between text-lg font-semibold border-t border-gray-200 pt-2'>
                      <span>Total:</span>
                      <span>
                        {formatCurrency(selectedVehicle.discounted_price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='mt-4 p-3 bg-yellow-50 rounded-lg'>
                  <div className='flex items-start space-x-2'>
                    <Shield className='h-4 w-4 text-yellow-600 mt-0.5' />
                    <div className='text-sm text-yellow-800'>
                      <p className='font-medium'>Protection incluse</p>
                      <p>Assurance tous risques et assistance 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render confirmation page
  const renderConfirmation = () => (
    <div className='max-w-2xl mx-auto text-center'>
      <div className='bg-white rounded-lg shadow-md p-8'>
        <div className='mb-6'>
          <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Réservation confirmée !
          </h1>
          <p className='text-gray-600'>
            Votre demande de réservation a été soumise avec succès
          </p>
        </div>

        {selectedVehicle && (
          <div className='bg-gray-50 rounded-lg p-6 mb-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Détails de votre réservation
            </h2>

            <div className='space-y-3 text-left'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Véhicule:</span>
                <span className='font-medium'>{selectedVehicle.name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Période:</span>
                <span className='font-medium'>
                  {formatDate(bookingDetails.start_date)} -{' '}
                  {formatDate(bookingDetails.end_date)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Durée:</span>
                <span className='font-medium'>
                  {calculateDuration(
                    bookingDetails.start_date,
                    bookingDetails.end_date
                  )}{' '}
                  jour(s)
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Total:</span>
                <span className='font-semibold text-lg'>
                  {formatCurrency(bookingDetails.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-4'>
          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex items-start space-x-2'>
              <Clock className='h-5 w-5 text-blue-500 mt-0.5' />
              <div className='text-left'>
                <h3 className='font-medium text-blue-900'>Prochaines étapes</h3>
                <p className='text-sm text-blue-800 mt-1'>
                  Vous recevrez un email de confirmation dans les 15 minutes.
                  Notre équipe vous contactera dans les 24h pour finaliser les
                  détails.
                </p>
              </div>
            </div>
          </div>

          <div className='flex space-x-4'>
            <Button
              variant='secondary'
              onClick={() => {
                setCurrentStep('search');
                setSelectedVehicle(null);
              }}
              fullWidth
            >
              Nouvelle recherche
            </Button>
            <Button
              variant='primary'
              onClick={() => (window.location.href = '/profile')}
              fullWidth
            >
              Voir mes réservations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {currentStep === 'search' && renderSearchForm()}
        {currentStep === 'details' && renderBookingDetails()}
        {currentStep === 'confirmation' && renderConfirmation()}
      </div>
    </div>
  );
};

export default CustomerBookingSystem;
