import React, { useState, useEffect } from 'react';
import {
  Car,
  Star,
  Users,
  Fuel,
  Settings,
  ArrowRight,
  Heart,
  MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  daily_rate: number;
  features: string[];
  specifications: any;
  rental_status: string;
  image: string;
  primary_image: string;
}

interface EnhancedCarListProps {
  showAll?: boolean;
  category?: string;
  limit?: number;
}

const EnhancedCarList: React.FC<EnhancedCarListProps> = ({
  showAll = false,
  category = '',
  limit = 6,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  console.log("🚀 ~ vehicles:", vehicles)
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, [category, limit]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('rental_status', 'available');

      if (category) {
        query = query.eq('category', category);
      }

      if (!showAll) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add mock data for missing fields
      const enhancedVehicles = (data || []).map((vehicle) => ({
        ...vehicle,
        image: '/api/placeholder/400/250',
        rating: 4.5,
        review_count: Math.floor(Math.random() * 100) + 10,
      }));

      setVehicles(enhancedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (vehicle: Vehicle) => {
    // Navigate to booking page with pre-selected vehicle
    navigate('/booking', {
      state: {
        preselectedVehicle: vehicle,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      },
    });
  };

  const handleFavorite = (vehicleId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(vehicleId)) {
        newFavorites.delete(vehicleId);
      } else {
        newFavorites.add(vehicleId);
      }
      return newFavorites;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryLabel = (cat: string) => {
    const labels: { [key: string]: string } = {
      economic: 'Économique',
      luxury: 'Luxe',
      suv: 'SUV',
      utility: 'Utilitaire',
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: { [key: string]: string } = {
      economic: 'bg-green-100 text-green-800',
      luxury: 'bg-purple-100 text-purple-800',
      suv: 'bg-blue-100 text-blue-800',
      utility: 'bg-orange-100 text-orange-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className='bg-white rounded-lg shadow-md overflow-hidden animate-pulse'
          >
            <div className='h-48 bg-gray-300'></div>
            <div className='p-4'>
              <div className='h-4 bg-gray-300 rounded mb-2'></div>
              <div className='h-3 bg-gray-300 rounded mb-4'></div>
              <div className='h-10 bg-gray-300 rounded'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className='text-center py-12'>
        <Car className='h-12 w-12 mx-auto mb-4 text-gray-400' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          Aucun véhicule disponible
        </h3>
        <p className='text-gray-600'>
          {category
            ? `Aucun véhicule ${getCategoryLabel(
                category
              ).toLowerCase()} disponible pour le moment.`
            : 'Aucun véhicule disponible pour le moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {vehicles.map((vehicle: any) => (
        <div
          key={vehicle.id}
          className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group'
        >
          <div className='relative'>
            <img
              src={vehicle.primary_image}
              alt={vehicle.name}
              className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
            />

            {/* Category Badge */}
            <div
              className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                vehicle.category
              )}`}
            >
              {getCategoryLabel(vehicle.category)}
            </div>

            {/* Favorite Button */}
            <button
              onClick={() => handleFavorite(vehicle.id)}
              className='absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors'
            >
              <Heart
                className={`h-4 w-4 ${
                  favorites.has(vehicle.id)
                    ? 'text-red-500 fill-current'
                    : 'text-gray-400'
                }`}
              />
            </button>

            {/* Quick Book Overlay */}
            <div className='absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
              <Button
                variant='primary'
                onClick={() => handleBookNow(vehicle)}
                icon={<ArrowRight className='h-4 w-4' />}
              >
                Réserver maintenant
              </Button>
            </div>
          </div>

          <div className='p-4'>
            {/* Header */}
            <div className='flex items-start justify-between mb-2'>
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 text-lg leading-tight'>
                  {vehicle.name}
                </h3>
                <p className='text-sm text-gray-600'>
                  {vehicle.make} {vehicle.model} {vehicle.year}
                </p>
              </div>
              <div className='flex items-center space-x-1 ml-2'>
                <Star className='h-4 w-4 text-yellow-400 fill-current' />
                <span className='text-sm text-gray-600'>4.5</span>
              </div>
            </div>

            {/* Vehicle Specs */}
            <div className='flex items-center space-x-4 mb-4 text-sm text-gray-600'>
              <div className='flex items-center space-x-1'>
                <Users className='h-4 w-4' />
                <span>{vehicle.specifications?.seats || 5} places</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Settings className='h-4 w-4' />
                <span>{vehicle.specifications?.transmission || 'Manuel'}</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Fuel className='h-4 w-4' />
                <span>{vehicle.specifications?.fuel_type || 'Essence'}</span>
              </div>
            </div>

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className='mb-4'>
                <div className='flex flex-wrap gap-1'>
                  {vehicle.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'
                    >
                      {feature}
                    </span>
                  ))}
                  {vehicle.features.length > 3 && (
                    <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                      +{vehicle.features.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Pricing and Action */}
            <div className='flex items-center justify-between'>
              <div>
                <div className='flex items-baseline space-x-1'>
                  <span className='text-xl font-bold text-gray-900'>
                    {formatCurrency(vehicle.daily_rate)}
                  </span>
                  <span className='text-sm text-gray-500'>/jour</span>
                </div>
                <p className='text-xs text-gray-500'>À partir de</p>
              </div>

              <Button
                variant='primary'
                size='sm'
                onClick={() => handleBookNow(vehicle)}
                className='min-w-[100px]'
              >
                Réserver
              </Button>
            </div>

            {/* Location Info */}
            {vehicle.location && (
              <div className='mt-3 pt-3 border-t border-gray-100'>
                <div className='flex items-center space-x-1 text-xs text-gray-500'>
                  <MapPin className='h-3 w-3' />
                  <span>Disponible à {vehicle.location}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedCarList;
