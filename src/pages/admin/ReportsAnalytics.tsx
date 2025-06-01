import {
  AlertCircle,
  BarChart3,
  Calendar,
  Car,
  DollarSign,
  Download,
  Loader,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import { supabase } from '../../lib/supabase';

// Types for analytics data
interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

interface CategoryStats {
  category: string;
  bookings: number;
  revenue: number;
  avgRate: number;
}

interface VehiclePerformance {
  id: string;
  name: string;
  make: string;
  model: string;
  bookings: number;
  revenue: number;
  utilization: number;
}

interface CustomerInsights {
  totalCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
  avgBookingsPerCustomer: number;
  customerRetentionRate: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  revenueGrowth: number;
  bookingGrowth: number;
  monthlyRevenue: RevenueData[];
  categoryStats: CategoryStats[];
  topVehicles: VehiclePerformance[];
  customerInsights: CustomerInsights;
  dailyBookings: { date: string; count: number }[];
}

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 90 days ago
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings'>(
    'revenue'
  );

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data
      const [bookingsResult, vehiclesResult, usersResult] = await Promise.all([
        supabase
          .from('bookings')
          .select(
            `
            *,
            user:profiles(id, full_name, email),
            vehicle:vehicles(id, name, make, model, category, daily_rate)
          `
          )
          .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
          .lte('created_at', `${dateRange.end}T23:59:59.999Z`),

        supabase.from('vehicles').select(`
            *,
            bookings(id, total_amount, booking_status, created_at)
          `),

        supabase.from('profiles').select('*'),
      ]);

      if (bookingsResult.error) throw bookingsResult.error;
      if (vehiclesResult.error) throw vehiclesResult.error;
      if (usersResult.error) throw usersResult.error;

      const bookings = bookingsResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const users = usersResult.data || [];

      // Filter completed bookings for revenue calculations
      const completedBookings = bookings.filter(
        (b) => b.booking_status !== 'cancelled'
      );

      // Calculate basic metrics
      const totalRevenue = completedBookings.reduce(
        (sum, b) => sum + b.total_amount,
        0
      );
      const totalBookings = bookings.length;
      const avgBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate growth (compare with previous period)
      const periodDays = Math.ceil(
        (new Date(dateRange.end).getTime() -
          new Date(dateRange.start).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const previousStart = new Date(
        new Date(dateRange.start).getTime() - periodDays * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      const previousEnd = dateRange.start;

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', `${previousStart}T00:00:00.000Z`)
        .lte('created_at', `${previousEnd}T23:59:59.999Z`);

      const previousCompletedBookings = (previousBookings || []).filter(
        (b) => b.booking_status !== 'cancelled'
      );
      const previousRevenue = previousCompletedBookings.reduce(
        (sum, b) => sum + b.total_amount,
        0
      );
      const previousBookingCount = previousBookings?.length || 0;

      const revenueGrowth =
        previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : 0;
      const bookingGrowth =
        previousBookingCount > 0
          ? ((totalBookings - previousBookingCount) / previousBookingCount) *
            100
          : 0;

      // Monthly revenue data
      const monthlyRevenue = calculateMonthlyRevenue(completedBookings);

      // Category statistics
      const categoryStats = calculateCategoryStats(completedBookings);

      // Top performing vehicles
      const topVehicles = calculateVehiclePerformance(vehicles);

      // Customer insights
      const customerInsights = calculateCustomerInsights(users, bookings);

      // Daily bookings for trend
      const dailyBookings = calculateDailyBookings(bookings);

      setData({
        totalRevenue,
        totalBookings,
        avgBookingValue,
        revenueGrowth,
        bookingGrowth,
        monthlyRevenue,
        categoryStats,
        topVehicles,
        customerInsights,
        dailyBookings,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Erreur lors du chargement des données analytiques');
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Helper functions for calculations
  const calculateMonthlyRevenue = (bookings: any[]): RevenueData[] => {
    const monthlyData: {
      [key: string]: { revenue: number; bookings: number };
    } = {};

    bookings.forEach((booking) => {
      const month = new Date(booking.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, bookings: 0 };
      }
      monthlyData[month].revenue += booking.total_amount;
      monthlyData[month].bookings += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: data.revenue,
        bookings: data.bookings,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateCategoryStats = (bookings: any[]): CategoryStats[] => {
    const categoryData: {
      [key: string]: { bookings: number; revenue: number; rates: number[] };
    } = {};

    bookings.forEach((booking) => {
      const category = booking.vehicle?.category || 'Unknown';
      if (!categoryData[category]) {
        categoryData[category] = { bookings: 0, revenue: 0, rates: [] };
      }
      categoryData[category].bookings += 1;
      categoryData[category].revenue += booking.total_amount;
      if (booking.vehicle?.daily_rate) {
        categoryData[category].rates.push(booking.vehicle.daily_rate);
      }
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category: getCategoryLabel(category),
      bookings: data.bookings,
      revenue: data.revenue,
      avgRate:
        data.rates.length > 0
          ? data.rates.reduce((sum, rate) => sum + rate, 0) / data.rates.length
          : 0,
    }));
  };

  const calculateVehiclePerformance = (
    vehicles: any[]
  ): VehiclePerformance[] => {
    return vehicles
      .map((vehicle) => {
        const vehicleBookings = vehicle.bookings || [];
        const completedBookings = vehicleBookings.filter(
          (b: any) => b.booking_status !== 'cancelled'
        );
        const revenue = completedBookings.reduce(
          (sum: any, b: any) => sum + b.total_amount,
          0
        );
        const bookingCount = vehicleBookings.length;

        // Calculate utilization (simplified as booking frequency)
        const daysSinceCreation = Math.ceil(
          (Date.now() - new Date(vehicle.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const utilization =
          daysSinceCreation > 0 ? (bookingCount / daysSinceCreation) * 100 : 0;

        return {
          id: vehicle.id,
          name: vehicle.name || 'Véhicule sans nom',
          make: vehicle.make || '',
          model: vehicle.model || '',
          bookings: bookingCount,
          revenue,
          utilization: Math.min(utilization, 100),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const calculateCustomerInsights = (
    users: any[],
    bookings: any[]
  ): CustomerInsights => {
    const totalCustomers = users.filter((u) => u.role === 'user').length;

    // Active customers (those who made a booking in the period)
    const customerBookings: { [key: string]: number } = {};
    bookings.forEach((booking) => {
      const userId = booking.user_id;
      customerBookings[userId] = (customerBookings[userId] || 0) + 1;
    });

    const activeCustomers = Object.keys(customerBookings).length;
    const repeatCustomers = Object.values(customerBookings).filter(
      (count) => count > 1
    ).length;
    const avgBookingsPerCustomer =
      activeCustomers > 0 ? bookings.length / activeCustomers : 0;
    const customerRetentionRate =
      totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      activeCustomers,
      repeatCustomers,
      avgBookingsPerCustomer,
      customerRetentionRate,
    };
  };

  const calculateDailyBookings = (bookings: any[]) => {
    const dailyData: { [key: string]: number } = {};

    bookings.forEach((booking) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      economic: 'Économique',
      luxury: 'Luxe',
      suv: 'SUV',
      utility: 'Utilitaire',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const exportReport = () => {
    if (!data) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `${dateRange.start} to ${dateRange.end}`,
      summary: {
        totalRevenue: data.totalRevenue,
        totalBookings: data.totalBookings,
        avgBookingValue: data.avgBookingValue,
        revenueGrowth: data.revenueGrowth,
        bookingGrowth: data.bookingGrowth,
      },
      monthlyRevenue: data.monthlyRevenue,
      categoryStats: data.categoryStats,
      topVehicles: data.topVehicles,
      customerInsights: data.customerInsights,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange.start}-${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 mx-auto mb-4 text-red-500' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Erreur de chargement
          </h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <Button variant='primary' onClick={fetchAnalytics}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Rapports & Analyses
        </h1>
        <div className='flex space-x-3'>
          <Button
            variant='secondary'
            icon={<RefreshCw className='h-4 w-4' />}
            onClick={fetchAnalytics}
          >
            Actualiser
          </Button>
          <Button
            variant='primary'
            icon={<Download className='h-4 w-4' />}
            onClick={exportReport}
          >
            Exporter
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4'>
          <div className='flex items-center space-x-2'>
            <Calendar className='h-4 w-4 text-gray-400' />
            <span className='text-sm font-medium text-gray-700'>
              Période d'analyse:
            </span>
          </div>
          <div className='flex space-x-2'>
            <input
              type='date'
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            />
            <span className='flex items-center text-gray-500'>à</span>
            <input
              type='date'
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Revenus totaux</h3>
            <DollarSign className='h-6 w-6 text-green-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {formatCurrency(data.totalRevenue)}
          </p>
          <div className='flex items-center mt-2'>
            {data.revenueGrowth >= 0 ? (
              <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
            ) : (
              <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
            )}
            <span
              className={`text-sm ${
                data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatPercentage(data.revenueGrowth)}
            </span>
            <span className='text-sm text-gray-500 ml-1'>
              vs période précédente
            </span>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Réservations</h3>
            <Calendar className='h-6 w-6 text-blue-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {data.totalBookings}
          </p>
          <div className='flex items-center mt-2'>
            {data.bookingGrowth >= 0 ? (
              <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
            ) : (
              <TrendingDown className='h-4 w-4 text-red-500 mr-1' />
            )}
            <span
              className={`text-sm ${
                data.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatPercentage(data.bookingGrowth)}
            </span>
            <span className='text-sm text-gray-500 ml-1'>
              vs période précédente
            </span>
          </div>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Panier moyen</h3>
            <BarChart3 className='h-6 w-6 text-purple-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {formatCurrency(data.avgBookingValue)}
          </p>
          <p className='text-sm text-gray-500 mt-2'>Par réservation</p>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-700'>Clients actifs</h3>
            <Users className='h-6 w-6 text-yellow-500' />
          </div>
          <p className='text-3xl font-bold text-gray-900'>
            {data.customerInsights.activeCustomers}
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            {data.customerInsights.customerRetentionRate.toFixed(1)}% taux de
            rétention
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Monthly Revenue Trend */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Évolution mensuelle
            </h3>
            <div className='flex space-x-2'>
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedMetric === 'revenue'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Revenus
              </button>
              <button
                onClick={() => setSelectedMetric('bookings')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedMetric === 'bookings'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Réservations
              </button>
            </div>
          </div>

          <div className='h-64 flex items-end space-x-2'>
            {data.monthlyRevenue.map((month, index) => {
              const maxValue = Math.max(
                ...data.monthlyRevenue.map((m) =>
                  selectedMetric === 'revenue' ? m.revenue : m.bookings
                )
              );
              const value =
                selectedMetric === 'revenue' ? month.revenue : month.bookings;
              const height = maxValue > 0 ? (value / maxValue) * 200 : 0;

              return (
                <div key={index} className='flex-1 flex flex-col items-center'>
                  <div
                    className='w-full bg-yellow-400 rounded-t-md'
                    style={{ height: `${height}px` }}
                  />
                  <div className='text-xs text-gray-600 mt-2 text-center'>
                    {month.month}
                  </div>
                  <div className='text-xs font-medium text-gray-900'>
                    {selectedMetric === 'revenue'
                      ? formatCurrency(month.revenue)
                      : month.bookings}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Performance */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>
            Performance par catégorie
          </h3>
          <div className='space-y-4'>
            {data.categoryStats.map((category, index) => {
              const maxRevenue = Math.max(
                ...data.categoryStats.map((c) => c.revenue)
              );
              const widthPercentage =
                maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index}>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-gray-900'>
                      {category.category}
                    </span>
                    <span className='text-sm text-gray-600'>
                      {formatCurrency(category.revenue)}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-yellow-400 h-2 rounded-full'
                      style={{ width: `${widthPercentage}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>{category.bookings} réservations</span>
                    <span>{formatCurrency(category.avgRate)}/jour moyen</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Vehicles & Customer Insights */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Top Performing Vehicles */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>
            Top véhicules
          </h3>
          <div className='space-y-4'>
            {data.topVehicles.slice(0, 5).map((vehicle, index) => (
              <div key={vehicle.id} className='flex items-center space-x-4'>
                <div className='flex-shrink-0 w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center'>
                  <Car className='h-4 w-4 text-gray-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {vehicle.name}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-gray-900'>
                    {formatCurrency(vehicle.revenue)}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {vehicle.bookings} réservations
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h3 className='text-lg font-semibold text-gray-900 mb-6'>
            Insights clients
          </h3>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-gray-900'>
                {data.customerInsights.totalCustomers}
              </div>
              <div className='text-sm text-gray-600'>Total clients</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {data.customerInsights.activeCustomers}
              </div>
              <div className='text-sm text-gray-600'>Clients actifs</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {data.customerInsights.repeatCustomers}
              </div>
              <div className='text-sm text-gray-600'>Clients fidèles</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600'>
                {data.customerInsights.avgBookingsPerCustomer.toFixed(1)}
              </div>
              <div className='text-sm text-gray-600'>Réservations/client</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
