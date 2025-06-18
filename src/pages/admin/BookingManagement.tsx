import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Loader,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import type { Booking, Profile, Vehicle } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

// Extended booking type with user and vehicle details
interface BookingWithDetails extends Booking {
  user: Profile;
  vehicle: Vehicle;
}

type BookingFilter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';
type BookingSort = 'created_at' | 'start_date' | 'total_amount' | 'user_name';

const bookingStatuses = [
  {
    value: 'pending',
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
  },
  {
    value: 'confirmed',
    label: 'Confirmée',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  {
    value: 'active',
    label: 'En cours',
    color: 'bg-green-100 text-green-800',
    icon: Clock,
  },
  {
    value: 'completed',
    label: 'Terminée',
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle,
  },
  {
    value: 'cancelled',
    label: 'Annulée',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
];

const BookingManagement = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [sortBy, setSortBy] = useState<BookingSort>('created_at');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    pickup_location: '',
    dropoff_location: '',
    total_amount: 0,
    booking_status: 'pending' as Booking['booking_status'],
    special_requests: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgBookingValue: 0,
  });

  // Fetch bookings with user and vehicle details
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          user:profiles!fk_bookings_user_id(
            id,
            full_name,
            email,
            phone,
            role
          ),
          vehicle:vehicles!bookings_vehicle_id_fkey(
            id,
            name,
            make,
            model,
            year,
            license_plate,
            category,
            daily_rate
          )
        `
        )
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const bookingsWithDetails = (bookingsData || []) as BookingWithDetails[];
      setBookings(bookingsWithDetails);

      // Calculate statistics
      const total = bookingsWithDetails.length;
      const pending = bookingsWithDetails.filter(
        (b) => b.booking_status === 'pending'
      ).length;
      const confirmed = bookingsWithDetails.filter(
        (b) => b.booking_status === 'confirmed'
      ).length;
      const active = bookingsWithDetails.filter(
        (b) => b.booking_status === 'active'
      ).length;
      const completed = bookingsWithDetails.filter(
        (b) => b.booking_status === 'completed'
      ).length;
      const cancelled = bookingsWithDetails.filter(
        (b) => b.booking_status === 'cancelled'
      ).length;

      const totalRevenue = bookingsWithDetails
        .filter((b) => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

      const avgBookingValue =
        total > 0 ? totalRevenue / (total - cancelled) : 0;

      setStats({
        total,
        pending,
        confirmed,
        active,
        completed,
        cancelled,
        totalRevenue,
        avgBookingValue,
      });
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Status filter
      if (filter !== 'all' && booking.booking_status !== filter) return false;

      // Date range filter
      if (
        dateRange.start &&
        new Date(booking.start_date) < new Date(dateRange.start)
      )
        return false;
      if (dateRange.end && new Date(booking.end_date) > new Date(dateRange.end))
        return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          booking.user?.full_name?.toLowerCase().includes(search) ||
          booking.user?.email?.toLowerCase().includes(search) ||
          booking.vehicle?.name?.toLowerCase().includes(search) ||
          booking.vehicle?.make?.toLowerCase().includes(search) ||
          booking.vehicle?.license_plate?.toLowerCase().includes(search) ||
          booking.id.toLowerCase().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'start_date':
          return (
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
        case 'total_amount':
          return b.total_amount - a.total_amount;
        case 'user_name':
          return (a.user?.full_name || '').localeCompare(
            b.user?.full_name || ''
          );
        case 'created_at':
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  // Handle booking status update
  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: Booking['booking_status']
  ) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('bookings')
        .update({
          booking_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle booking edit
  const handleEditBooking = async () => {
    if (!selectedBooking) return;

    try {
      setFormLoading(true);
      setError(null);

      const { error } = await supabase
        .from('bookings')
        .update({
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          pickup_location: editForm.pickup_location,
          dropoff_location: editForm.dropoff_location,
          total_amount: editForm.total_amount,
          booking_status: editForm.booking_status,
          special_requests: editForm.special_requests,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      await fetchBookings();
      setShowEditModal(false);
      setSelectedBooking(null);
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Erreur lors de la modification');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setEditForm({
      start_date: booking.start_date,
      end_date: booking.end_date,
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      total_amount: booking.total_amount,
      booking_status: booking.booking_status,
      special_requests: booking.special_requests || '',
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    return (
      bookingStatuses.find((s) => s.value === status) || bookingStatuses[0]
    );
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Gestion des réservations
        </h1>
        <div className='flex space-x-3'>
          <Button
            variant='secondary'
            icon={<RefreshCw className='h-4 w-4' />}
            onClick={fetchBookings}
          >
            Actualiser
          </Button>
          <Button variant='ghost' icon={<Download className='h-4 w-4' />}>
            Exporter
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

      {/* Statistics Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8'>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-gray-900'>{stats.total}</div>
          <div className='text-sm text-gray-600'>Total</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-yellow-600'>
            {stats.pending}
          </div>
          <div className='text-sm text-gray-600'>En attente</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-blue-600'>
            {stats.confirmed}
          </div>
          <div className='text-sm text-gray-600'>Confirmées</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-green-600'>
            {stats.active}
          </div>
          <div className='text-sm text-gray-600'>En cours</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-purple-600'>
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className='text-sm text-gray-600'>Revenus</div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-md'>
          <div className='text-2xl font-bold text-indigo-600'>
            {formatCurrency(stats.avgBookingValue)}
          </div>
          <div className='text-sm text-gray-600'>Panier moyen</div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher une réservation...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BookingFilter)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
          >
            <option value='all'>Tous les statuts</option>
            {bookingStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as BookingSort)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
          >
            <option value='created_at'>Date de création</option>
            <option value='start_date'>Date de début</option>
            <option value='total_amount'>Montant</option>
            <option value='user_name'>Client</option>
          </select>

          {/* Date Range */}
          <div className='flex space-x-2'>
            <input
              type='date'
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              placeholder='Du'
            />
            <input
              type='date'
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              placeholder='Au'
            />
          </div>
        </div>

        <div className='mt-4 text-sm text-gray-500'>
          {filteredBookings.length} réservation(s) trouvée(s)
        </div>
      </div>

      {/* Bookings Table */}
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Réservation
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Client
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Véhicule
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Période
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Statut
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Montant
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredBookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.booking_status);
                const StatusIcon = statusConfig.icon;
                const duration = calculateDuration(
                  booking.start_date,
                  booking.end_date
                );

                return (
                  <tr key={booking.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        #{booking.id.slice(0, 8)}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {formatDateTime(booking.created_at)}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center'>
                          <User className='h-4 w-4 text-gray-500' />
                        </div>
                        <div className='ml-3'>
                          <div className='text-sm font-medium text-gray-900'>
                            {booking.user?.full_name || 'Nom non renseigné'}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {booking.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='h-8 w-8 rounded bg-gray-200 flex items-center justify-center'>
                          <Car className='h-4 w-4 text-gray-500' />
                        </div>
                        <div className='ml-3'>
                          <div className='text-sm font-medium text-gray-900'>
                            {booking.vehicle?.name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {booking.vehicle?.make} {booking.vehicle?.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {formatDate(booking.start_date)}
                      </div>
                      <div className='text-sm text-gray-500'>
                        au {formatDate(booking.end_date)}
                      </div>
                      <div className='text-xs text-gray-400'>
                        {duration} jour{duration > 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='relative'>
                        <select
                          value={booking.booking_status}
                          onChange={(e) =>
                            handleStatusUpdate(
                              booking.id,
                              e.target.value as Booking['booking_status']
                            )
                          }
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border-0 ${statusConfig.color} focus:ring-2 focus:ring-yellow-500`}
                        >
                          {bookingStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>
                        {formatCurrency(booking.total_amount)}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {formatCurrency(booking.total_amount / duration)}/jour
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex items-center justify-end space-x-2'>
                        <button
                          onClick={() => openDetailsModal(booking)}
                          className='text-blue-600 hover:text-blue-900'
                          title='Voir les détails'
                        >
                          <Eye className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => openEditModal(booking)}
                          className='text-yellow-600 hover:text-yellow-900'
                          title='Modifier'
                        >
                          <Edit className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className='text-center py-12'>
            <Calendar className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucune réservation trouvée
            </h3>
            <p className='text-gray-500'>
              {searchTerm || filter !== 'all'
                ? 'Aucune réservation ne correspond à vos critères.'
                : 'Les réservations apparaîtront ici.'}
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg max-w-2xl w-full my-4'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-xl font-semibold'>
                Détails de la réservation #{selectedBooking.id.slice(0, 8)}
              </h2>
            </div>

            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Customer Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Informations client
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <User className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        {selectedBooking.user?.full_name || 'Nom non renseigné'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Mail className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        {selectedBooking.user?.email}
                      </span>
                    </div>
                    {selectedBooking.user?.phone && (
                      <div className='flex items-center space-x-2'>
                        <Phone className='h-4 w-4 text-gray-400' />
                        <span className='text-sm text-gray-900'>
                          {selectedBooking.user.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Véhicule
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Car className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        {selectedBooking.vehicle?.name}
                      </span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      {selectedBooking.vehicle?.make}{' '}
                      {selectedBooking.vehicle?.model}{' '}
                      {selectedBooking.vehicle?.year}
                    </div>
                    {selectedBooking.vehicle?.license_plate && (
                      <div className='text-sm text-gray-600'>
                        Plaque: {selectedBooking.vehicle.license_plate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Détails de la réservation
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        Du {formatDate(selectedBooking.start_date)} au{' '}
                        {formatDate(selectedBooking.end_date)}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Clock className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        {calculateDuration(
                          selectedBooking.start_date,
                          selectedBooking.end_date
                        )}{' '}
                        jour(s)
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <DollarSign className='h-4 w-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>
                        {formatCurrency(selectedBooking.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Lieux
                  </h3>
                  <div className='space-y-3'>
                    {selectedBooking.pickup_location && (
                      <div className='flex items-center space-x-2'>
                        <MapPin className='h-4 w-4 text-green-400' />
                        <div>
                          <div className='text-xs text-gray-500'>Retrait</div>
                          <div className='text-sm text-gray-900'>
                            {selectedBooking.pickup_location}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedBooking.dropoff_location && (
                      <div className='flex items-center space-x-2'>
                        <MapPin className='h-4 w-4 text-red-400' />
                        <div>
                          <div className='text-xs text-gray-500'>Retour</div>
                          <div className='text-sm text-gray-900'>
                            {selectedBooking.dropoff_location}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className='mt-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Demandes spéciales
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-700'>
                      {selectedBooking.special_requests}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex justify-end space-x-3'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
              >
                Fermer
              </Button>
              <Button
                variant='primary'
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedBooking);
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg max-w-2xl w-full my-4'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-xl font-semibold'>
                Modifier la réservation #{selectedBooking.id.slice(0, 8)}
              </h2>
            </div>

            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Dates */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date de début
                  </label>
                  <input
                    type='date'
                    value={editForm.start_date}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date de fin
                  </label>
                  <input
                    type='date'
                    value={editForm.end_date}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>

                {/* Locations */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Lieu de retrait
                  </label>
                  <input
                    type='text'
                    value={editForm.pickup_location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pickup_location: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    placeholder='Adresse de retrait'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Lieu de retour
                  </label>
                  <input
                    type='text'
                    value={editForm.dropoff_location}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        dropoff_location: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    placeholder='Adresse de retour'
                  />
                </div>

                {/* Amount and Status */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Montant total ($)
                  </label>
                  <input
                    type='number'
                    value={editForm.total_amount}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        total_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    min='0'
                    step='0.01'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Statut
                  </label>
                  <select
                    value={editForm.booking_status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        booking_status: e.target
                          .value as Booking['booking_status'],
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  >
                    {bookingStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div className='mt-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Demandes spéciales
                </label>
                <textarea
                  value={editForm.special_requests}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      special_requests: e.target.value,
                    }))
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  placeholder='Instructions particulières ou besoins spécifiques'
                />
              </div>

              {/* Customer and Vehicle Info (Read-only) */}
              <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='font-medium text-gray-900 mb-2'>Client</h4>
                  <div className='text-sm text-gray-600'>
                    <div>{selectedBooking.user?.full_name}</div>
                    <div>{selectedBooking.user?.email}</div>
                    {selectedBooking.user?.phone && (
                      <div>{selectedBooking.user.phone}</div>
                    )}
                  </div>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='font-medium text-gray-900 mb-2'>Véhicule</h4>
                  <div className='text-sm text-gray-600'>
                    <div>{selectedBooking.vehicle?.name}</div>
                    <div>
                      {selectedBooking.vehicle?.make}{' '}
                      {selectedBooking.vehicle?.model}
                    </div>
                    {selectedBooking.vehicle?.license_plate && (
                      <div>Plaque: {selectedBooking.vehicle.license_plate}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='px-6 py-4 border-t border-gray-200 flex space-x-3'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBooking(null);
                }}
                disabled={formLoading}
                fullWidth
              >
                Annuler
              </Button>
              <Button
                variant='primary'
                onClick={handleEditBooking}
                loading={formLoading}
                disabled={formLoading}
                fullWidth
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
