import React, { useState, useEffect, useCallback } from 'react';
import {
  Car,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  Settings,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  DollarSign,
  Calendar,
  Wrench,
  MapPin,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';
import type { Vehicle } from '../../lib/supabase';

// Extended vehicle type with booking stats
interface VehicleWithStats extends Vehicle {
  booking_count: number;
  total_revenue: number;
  last_booking: string | null;
  days_since_last_booking: number;
}

type VehicleFilter = 'all' | 'available' | 'rented' | 'maintenance' | 'retired';
type VehicleSort =
  | 'name'
  | 'category'
  | 'daily_rate'
  | 'booking_count'
  | 'created_at';

const categories = [
  { value: 'economic', label: 'Économique' },
  { value: 'luxury', label: 'Luxe' },
  { value: 'suv', label: 'SUV' },
  { value: 'utility', label: 'Utilitaire' },
];

const rentalStatuses = [
  {
    value: 'available',
    label: 'Disponible',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'rented', label: 'Loué', color: 'bg-blue-100 text-blue-800' },
  {
    value: 'maintenance',
    label: 'Maintenance',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'retired', label: 'Retiré', color: 'bg-red-100 text-red-800' },
];

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<VehicleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [sortBy, setSortBy] = useState<VehicleSort>('created_at');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithStats | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for vehicle creation/editing
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'economic',
    daily_rate: 0,
    rental_status: 'available' as Vehicle['rental_status'],
    color: '',
    license_plate: '',
    location: '',
    description: '',
    features: [] as string[],
    vin: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch vehicles with booking statistics
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vehicles with their bookings for statistics
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(
          `
          *,
          bookings!bookings_vehicle_id_fkey(
            id,
            total_amount,
            created_at,
            booking_status
          )
        `
        )
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // Calculate statistics for each vehicle
      const vehiclesWithStats: VehicleWithStats[] = (vehiclesData || []).map(
        (vehicle) => {
          const vehicleBookings = vehicle.bookings || [];
          const completedBookings = vehicleBookings.filter(
            (b: any) => b.booking_status !== 'cancelled'
          );

          const booking_count = vehicleBookings.length;
          const total_revenue = completedBookings.reduce(
            (sum: any, b: any) => sum + b.total_amount,
            0
          );

          // Find last booking
          const sortedBookings = vehicleBookings.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          const last_booking =
            sortedBookings.length > 0 ? sortedBookings[0].created_at : null;

          // Calculate days since last booking
          const days_since_last_booking = last_booking
            ? Math.floor(
                (Date.now() - new Date(last_booking).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

          // Remove bookings from the vehicle object to avoid circular references
          const { bookings, ...vehicleWithoutBookings } = vehicle;

          return {
            ...vehicleWithoutBookings,
            booking_count,
            total_revenue,
            last_booking,
            days_since_last_booking,
          };
        }
      );

      setVehicles(vehiclesWithStats);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Filter and sort vehicles
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      if (filter !== 'all' && vehicle.rental_status !== filter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          vehicle.name?.toLowerCase().includes(search) ||
          vehicle.make?.toLowerCase().includes(search) ||
          vehicle.model?.toLowerCase().includes(search) ||
          vehicle.license_plate?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'daily_rate':
          return (b.daily_rate || 0) - (a.daily_rate || 0);
        case 'booking_count':
          return b.booking_count - a.booking_count;
        case 'created_at':
        default:
          return (
            new Date(b.created_at || '').getTime() -
            new Date(a.created_at || '').getTime()
          );
      }
    });

  // Handle vehicle creation/update
  const handleSaveVehicle = async () => {
    if (
      !vehicleForm.name ||
      !vehicleForm.make ||
      !vehicleForm.model ||
      !vehicleForm.daily_rate
    ) {
      setError('Nom, marque, modèle et prix sont requis');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      const vehicleData = {
        name: vehicleForm.name,
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: vehicleForm.year,
        category: vehicleForm.category,
        daily_rate: vehicleForm.daily_rate,
        rental_status: vehicleForm.rental_status,
        color: vehicleForm.color || null,
        license_plate: vehicleForm.license_plate || null,
        location: vehicleForm.location || null,
        description: vehicleForm.description || null,
        vin: vehicleForm.vin || null,
        features: vehicleForm.features.length > 0 ? vehicleForm.features : null,
        updated_at: new Date().toISOString(),
      };

      if (editingVehicle) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (updateError) throw updateError;
      } else {
        // Create new vehicle
        const { error: insertError } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (insertError) throw insertError;
      }

      await fetchVehicles();
      setShowVehicleModal(false);
      setEditingVehicle(null);
      resetForm();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle vehicle deletion
  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      await fetchVehicles();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: Vehicle['rental_status']) => {
    if (selectedVehicles.length === 0) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('vehicles')
        .update({
          rental_status: status,
          updated_at: new Date().toISOString(),
        })
        .in('id', selectedVehicles);

      if (error) throw error;

      await fetchVehicles();
      setSelectedVehicles([]);
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const resetForm = () => {
    setVehicleForm({
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'economic',
      daily_rate: 0,
      rental_status: 'available',
      color: '',
      license_plate: '',
      location: '',
      description: '',
      features: [],
      vin: '',
    });
  };

  const openEditModal = (vehicle: VehicleWithStats) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      category: vehicle.category || 'economic',
      daily_rate: vehicle.daily_rate || 0,
      rental_status: vehicle.rental_status || 'available',
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      location: vehicle.location || '',
      description: vehicle.description || '',
      features: Array.isArray(vehicle.features) ? vehicle.features : [],
      vin: vehicle.vin || '',
    });
    setShowVehicleModal(true);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const statusConfig = rentalStatuses.find((s) => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className='h-4 w-4' />;
      case 'rented':
        return <Clock className='h-4 w-4' />;
      case 'maintenance':
        return <Wrench className='h-4 w-4' />;
      case 'retired':
        return <XCircle className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat?.label || category;
  };

  const addFeature = () => {
    setVehicleForm((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setVehicleForm((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const removeFeature = (index: number) => {
    setVehicleForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement des véhicules...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Gestion des véhicules
        </h1>
        <div className='flex space-x-3'>
          {selectedVehicles.length > 0 && (
            <div className='flex space-x-2'>
              <select
                onChange={(e) =>
                  handleBulkStatusUpdate(
                    e.target.value as Vehicle['rental_status']
                  )
                }
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
                defaultValue=''
              >
                <option value='' disabled>
                  Changer le statut
                </option>
                {rentalStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant='primary'
            icon={<Plus className='h-4 w-4' />}
            onClick={() => {
              setEditingVehicle(null);
              resetForm();
              setShowVehicleModal(true);
            }}
          >
            Ajouter un véhicule
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <AlertCircle className='h-5 w-5 text-red-400 mr-2' />
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher un véhicule...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>

            {/* Filter by status */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as VehicleFilter)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            >
              <option value='all'>Tous les statuts</option>
              {rentalStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as VehicleSort)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            >
              <option value='created_at'>Date d'ajout</option>
              <option value='name'>Nom</option>
              <option value='category'>Catégorie</option>
              <option value='daily_rate'>Prix/jour</option>
              <option value='booking_count'>Popularité</option>
            </select>
          </div>

          <div className='text-sm text-gray-500'>
            {filteredVehicles.length} véhicule(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left'>
                  <input
                    type='checkbox'
                    checked={
                      selectedVehicles.length === filteredVehicles.length &&
                      filteredVehicles.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVehicles(filteredVehicles.map((v) => v.id));
                      } else {
                        setSelectedVehicles([]);
                      }
                    }}
                    className='rounded border-gray-300 text-yellow-600 focus:ring-yellow-500'
                  />
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Véhicule
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Catégorie
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Prix/Jour
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Statut
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Réservations
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Revenus
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <input
                      type='checkbox'
                      checked={selectedVehicles.includes(vehicle.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVehicles([
                            ...selectedVehicles,
                            vehicle.id,
                          ]);
                        } else {
                          setSelectedVehicles(
                            selectedVehicles.filter((id) => id !== vehicle.id)
                          );
                        }
                      }}
                      className='rounded border-gray-300 text-yellow-600 focus:ring-yellow-500'
                    />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='h-10 w-10 rounded bg-gray-200 flex items-center justify-center'>
                        <Car className='h-5 w-5 text-gray-500' />
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {vehicle.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </div>
                        {vehicle.license_plate && (
                          <div className='text-xs text-gray-400'>
                            {vehicle.license_plate}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                      {getCategoryLabel(vehicle.category || '')}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {formatCurrency(vehicle.daily_rate || 0)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        vehicle.rental_status || ''
                      )}`}
                    >
                      {getStatusIcon(vehicle.rental_status || '')}
                      <span className='ml-1'>
                        {
                          rentalStatuses.find(
                            (s) => s.value === vehicle.rental_status
                          )?.label
                        }
                      </span>
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 mr-2 text-gray-400' />
                      {vehicle.booking_count}
                    </div>
                    {vehicle.last_booking && (
                      <div className='text-xs text-gray-500'>
                        Il y a {vehicle.days_since_last_booking} jour(s)
                      </div>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    <div className='flex items-center'>
                      <DollarSign className='h-4 w-4 mr-1 text-green-500' />
                      {formatCurrency(vehicle.total_revenue)}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end space-x-2'>
                      <button
                        onClick={() => openEditModal(vehicle)}
                        className='text-yellow-600 hover:text-yellow-900'
                        title='Modifier'
                      >
                        <Edit className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(vehicle.id)}
                        className='text-red-600 hover:text-red-900'
                        title='Supprimer'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVehicles.length === 0 && (
          <div className='text-center py-12'>
            <Car className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun véhicule trouvé
            </h3>
            <p className='text-gray-500'>
              {searchTerm
                ? 'Aucun véhicule ne correspond à votre recherche.'
                : 'Commencez par ajouter des véhicules à votre flotte.'}
            </p>
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg max-w-2xl w-full my-4'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-xl font-semibold'>
                {editingVehicle
                  ? 'Modifier le véhicule'
                  : 'Ajouter un véhicule'}
              </h2>
            </div>

            <div className='p-6 max-h-96 overflow-y-auto'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Basic Information */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Informations de base
                  </h3>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nom du véhicule *
                    </label>
                    <input
                      type='text'
                      value={vehicleForm.name}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      required
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Marque *
                      </label>
                      <input
                        type='text'
                        value={vehicleForm.make}
                        onChange={(e) =>
                          setVehicleForm((prev) => ({
                            ...prev,
                            make: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Modèle *
                      </label>
                      <input
                        type='text'
                        value={vehicleForm.model}
                        onChange={(e) =>
                          setVehicleForm((prev) => ({
                            ...prev,
                            model: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                        required
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Année
                      </label>
                      <input
                        type='number'
                        value={vehicleForm.year}
                        onChange={(e) =>
                          setVehicleForm((prev) => ({
                            ...prev,
                            year: parseInt(e.target.value),
                          }))
                        }
                        min='1990'
                        max={new Date().getFullYear() + 1}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Couleur
                      </label>
                      <input
                        type='text'
                        value={vehicleForm.color}
                        onChange={(e) =>
                          setVehicleForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Catégorie
                    </label>
                    <select
                      value={vehicleForm.category}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
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
                </div>

                {/* Operational Information */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Informations opérationnelles
                  </h3>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Prix par jour (€) *
                    </label>
                    <input
                      type='number'
                      value={vehicleForm.daily_rate}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          daily_rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      min='0'
                      step='0.01'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Statut
                    </label>
                    <select
                      value={vehicleForm.rental_status}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          rental_status: e.target
                            .value as Vehicle['rental_status'],
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    >
                      {rentalStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Plaque d'immatriculation
                    </label>
                    <input
                      type='text'
                      value={vehicleForm.license_plate}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          license_plate: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      placeholder='AB-123-CD'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Localisation
                    </label>
                    <input
                      type='text'
                      value={vehicleForm.location}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      placeholder='Garage A, Place 12'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      VIN
                    </label>
                    <input
                      type='text'
                      value={vehicleForm.vin}
                      onChange={(e) =>
                        setVehicleForm((prev) => ({
                          ...prev,
                          vin: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      placeholder="Numéro d'identification"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className='mt-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description
                </label>
                <textarea
                  value={vehicleForm.description}
                  onChange={(e) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  placeholder='Description du véhicule, équipements spéciaux...'
                />
              </div>

              {/* Features */}
              <div className='mt-6'>
                <div className='flex items-center justify-between mb-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Caractéristiques
                  </label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={addFeature}
                    icon={<Plus className='h-4 w-4' />}
                  >
                    Ajouter
                  </Button>
                </div>
                <div className='space-y-2'>
                  {vehicleForm.features.map((feature, index) => (
                    <div key={index} className='flex space-x-2'>
                      <input
                        type='text'
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                        placeholder='Ex: Climatisation, GPS, Bluetooth...'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeFeature(index)}
                        className='text-red-600'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  {vehicleForm.features.length === 0 && (
                    <p className='text-sm text-gray-500 italic'>
                      Aucune caractéristique ajoutée. Cliquez sur "Ajouter" pour
                      commencer.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex space-x-3'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowVehicleModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                disabled={formLoading}
                fullWidth
              >
                Annuler
              </Button>
              <Button
                variant='primary'
                onClick={handleSaveVehicle}
                loading={formLoading}
                disabled={formLoading}
                fullWidth
              >
                {editingVehicle ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-sm w-full p-6'>
            <div className='text-center'>
              <AlertCircle className='h-12 w-12 mx-auto mb-4 text-red-500' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Confirmer la suppression
              </h3>
              <p className='text-gray-600 mb-6'>
                Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action
                est irréversible.
              </p>
              <div className='flex space-x-3'>
                <Button
                  variant='secondary'
                  onClick={() => setDeleteConfirm(null)}
                  fullWidth
                >
                  Annuler
                </Button>
                <Button
                  variant='primary'
                  onClick={() => handleDeleteVehicle(deleteConfirm)}
                  className='bg-red-600 hover:bg-red-700'
                  fullWidth
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
