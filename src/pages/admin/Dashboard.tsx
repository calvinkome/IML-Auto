import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Loader,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import type { Booking, Profile, Vehicle } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

// Types for dashboard data
interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'user' | 'vehicle';
  action: string;
  details: string;
  timestamp: string;
  status?: string;
}

interface BookingWithDetails extends Booking {
  user: Profile;
  vehicle: Vehicle;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
  });
  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>(
    []
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [
        usersResponse,
        vehiclesResponse,
        bookingsResponse,
        recentBookingsResponse,
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, role'),
        supabase
          .from('vehicles')
          .select('id, rental_status, daily_rate, created_at'),
        supabase
          .from('bookings')
          .select('id, booking_status, total_amount, created_at, start_date'),
        supabase
          .from('bookings')
          .select(
            `
            *,
            user:profiles!fk_bookings_user_id(id, full_name, email),
            vehicle:vehicles!bookings_vehicle_id_fkey(id, name, make, model)
          `
          )
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (vehiclesResponse.error) throw vehiclesResponse.error;
      if (bookingsResponse.error) throw bookingsResponse.error;
      if (recentBookingsResponse.error) throw recentBookingsResponse.error;

      const users = usersResponse.data || [];
      const vehicles = vehiclesResponse.data || [];
      const bookings = bookingsResponse.data || [];
      const recentBookingsData =
        (recentBookingsResponse.data as BookingWithDetails[]) || [];

      // Calculate statistics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = new Date(currentYear, currentMonth - 1);

      // Current month data
      const currentMonthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.created_at);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        );
      });

      // Last month data for growth calculation
      const lastMonthBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.created_at);
        return (
          bookingDate.getMonth() === lastMonth.getMonth() &&
          bookingDate.getFullYear() === lastMonth.getFullYear()
        );
      });

      const activeBookings = bookings.filter((b) =>
        ['pending', 'confirmed', 'active'].includes(b.booking_status)
      ).length;

      const totalRevenue = bookings
        .filter((b) => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

      const monthlyRevenue = currentMonthBookings
        .filter((b) => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

      const lastMonthRevenue = lastMonthBookings
        .filter((b) => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

      const revenueGrowth =
        lastMonthRevenue > 0
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      const bookingGrowth =
        lastMonthBookings.length > 0
          ? ((currentMonthBookings.length - lastMonthBookings.length) /
              lastMonthBookings.length) *
            100
          : 0;

      setStats({
        totalUsers: users.length,
        totalVehicles: vehicles.length,
        totalBookings: bookings.length,
        activeBookings,
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        bookingGrowth,
      });

      setRecentBookings(recentBookingsData);

      // Generate recent activity from various sources
      const activities: RecentActivity[] = [
        ...recentBookingsData.slice(0, 3).map((booking) => ({
          id: booking.id,
          type: 'booking' as const,
          action: 'Nouvelle réservation',
          details: `${booking.user?.full_name || 'Utilisateur'} - ${
            booking.vehicle?.name || 'Véhicule'
          }`,
          timestamp: booking.created_at,
          status: booking.booking_status,
        })),
        ...users.slice(0, 2).map((user) => ({
          id: user.id,
          type: 'user' as const,
          action: 'Nouvel utilisateur',
          details: `Utilisateur ${user.role} créé`,
          timestamp: user.created_at,
        })),
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivity(activities);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <AlertCircle className='h-4 w-4' />;
      case 'cancelled':
        return <XCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className='h-5 w-5 text-blue-500' />;
      case 'user':
        return <Users className='h-5 w-5 text-green-500' />;
      case 'vehicle':
        return <Car className='h-5 w-5 text-yellow-500' />;
      default:
        return <Clock className='h-5 w-5 text-gray-500' />;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 mx-auto mb-4 text-red-500' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Erreur de chargement
          </h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <Button variant='primary' onClick={fetchDashboardData}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='m-12'>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Tableau de bord administrateur
        </h1>
        <Button
          variant='secondary'
          onClick={fetchDashboardData}
          icon={<Clock className='h-4 w-4' />}
        >
          Actualiser
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total Users */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Utilisateurs</h3>
            <Users className='h-6 w-6 text-blue-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>{stats.totalUsers}</p>
          <p className='text-sm text-gray-500'>Total des utilisateurs</p>
        </div>

        {/* Total Vehicles */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Véhicules</h3>
            <Car className='h-6 w-6 text-yellow-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {stats.totalVehicles}
          </p>
          <p className='text-sm text-gray-500'>Flotte totale</p>
        </div>

        {/* Active Bookings */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Réservations</h3>
            <Calendar className='h-6 w-6 text-green-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {stats.activeBookings}
          </p>
          <p className='text-sm text-gray-500'>
            {stats.totalBookings} total
            {stats.bookingGrowth !== 0 && (
              <span
                className={`ml-2 inline-flex items-center text-xs ${
                  stats.bookingGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stats.bookingGrowth > 0 ? (
                  <TrendingUp className='h-3 w-3 mr-1' />
                ) : (
                  <TrendingDown className='h-3 w-3 mr-1' />
                )}
                {Math.abs(stats.bookingGrowth).toFixed(1)}%
              </span>
            )}
          </p>
        </div>

        {/* Revenue */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Revenus</h3>
            <DollarSign className='h-6 w-6 text-purple-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {formatCurrency(stats.monthlyRevenue)}
          </p>
          <p className='text-sm text-gray-500'>
            Ce mois
            {stats.revenueGrowth !== 0 && (
              <span
                className={`ml-2 inline-flex items-center text-xs ${
                  stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stats.revenueGrowth > 0 ? (
                  <TrendingUp className='h-3 w-3 mr-1' />
                ) : (
                  <TrendingDown className='h-3 w-3 mr-1' />
                )}
                {Math.abs(stats.revenueGrowth).toFixed(1)}%
              </span>
            )}
          </p>
        </div>
      </div>

      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Recent Bookings */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Réservations récentes
            </h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/admin/bookings')}
            >
              Voir tout
            </Button>
          </div>

          {recentBookings.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Calendar className='h-12 w-12 mx-auto mb-4 text-gray-300' />
              <p>Aucune réservation récente</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className='flex items-center space-x-4 p-4 border border-gray-200 rounded-lg'
                >
                  <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                    <Car className='h-5 w-5 text-gray-500' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {booking.vehicle?.name || 'Véhicule'}
                    </p>
                    <p className='text-sm text-gray-500 truncate'>
                      {booking.user?.full_name ||
                        booking.user?.email ||
                        'Utilisateur'}
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        booking.booking_status
                      )}`}
                    >
                      {getStatusIcon(booking.booking_status)}
                      <span className='ml-1 capitalize'>
                        {booking.booking_status}
                      </span>
                    </span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>
            Activité récente
          </h2>

          {recentActivity.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Clock className='h-12 w-12 mx-auto mb-4 text-gray-300' />
              <p>Aucune activité récente</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {recentActivity.map((activity) => (
                <div key={activity.id} className='flex items-start space-x-3'>
                  <div className='flex-shrink-0'>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900'>
                      {activity.action}
                    </p>
                    <p className='text-sm text-gray-500 truncate'>
                      {activity.details}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                  {activity.status && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        activity.status
                      )}`}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mt-8 bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-xl font-semibold text-gray-900 mb-6'>
          Actions rapides
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Button
            variant='primary'
            onClick={() => navigate('/admin/vehicles')}
            icon={<Car className='h-4 w-4' />}
          >
            Gérer les véhicules
          </Button>
          <Button
            variant='secondary'
            onClick={() => navigate('/admin/users')}
            icon={<Users className='h-4 w-4' />}
          >
            Gérer les utilisateurs
          </Button>
          <Button
            variant='ghost'
            onClick={() => navigate('/admin/bookings')}
            icon={<Calendar className='h-4 w-4' />}
          >
            Voir toutes les réservations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
