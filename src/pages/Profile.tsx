import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Settings,
  Clock,
  FileText,
  Bell,
  CreditCard,
  LogOut,
  Car,
  Calendar,
  MapPin,
  Eye,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import type { Booking, Vehicle } from '../lib/supabase';

// Extended types for dashboard
interface BookingWithVehicle extends Booking {
  vehicle: Vehicle;
}

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalSpent: number;
}

const tabs = [
  { id: 'dashboard', label: 'Tableau de bord', icon: User },
  { id: 'reservations', label: 'Mes Réservations', icon: Clock },
  { id: 'profile', label: 'Mon Profil', icon: Settings },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  active: 'text-green-600 bg-green-50',
  completed: 'text-gray-600 bg-gray-50',
  cancelled: 'text-red-600 bg-red-50',
};

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export default function Profile() {
  const { user, signOut, updateProfile, profileLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });

  // Dashboard data
  const [bookings, setBookings] = useState<BookingWithVehicle[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
  });

  // Fetch user bookings and stats
  const fetchUserData = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setDataLoading(true);

      // Fetch bookings with vehicle information
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          vehicle:vehicles(*)
        `
        )
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      const bookingsWithVehicles = (bookingsData || []) as BookingWithVehicle[];
      setBookings(bookingsWithVehicles);

      // Calculate stats
      const totalBookings = bookingsWithVehicles.length;
      const activeBookings = bookingsWithVehicles.filter((b) =>
        ['pending', 'confirmed', 'active'].includes(b.booking_status)
      ).length;
      const completedBookings = bookingsWithVehicles.filter(
        (b) => b.booking_status === 'completed'
      ).length;
      const totalSpent = bookingsWithVehicles
        .filter((b) => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_amount, 0);

      setStats({
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpent,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await updateProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      case 'cancelled':
        return <XCircle className='h-4 w-4' />;
      case 'pending':
        return <AlertCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const getUserInitial = () => {
    const name = user?.full_name || user?.username || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    return (
      user?.full_name ||
      user?.username ||
      user?.email?.split('@')[0] ||
      'Utilisateur'
    );
  };

  if (dataLoading) {
    return (
      <div className='pt-20 min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>
            Chargement de votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='pt-20 min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='w-full lg:w-64 space-y-6'>
            {/* User Profile Card */}
            <div className='bg-white rounded-lg shadow p-6 text-center'>
              <div className='w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-black text-3xl font-bold mx-auto mb-4'>
                {getUserInitial()}
              </div>
              <h2 className='text-xl font-semibold text-gray-900'>
                {getUserDisplayName()}
              </h2>
              <p className='text-gray-500 text-sm'>{user?.email}</p>
              <div className='mt-4 grid grid-cols-2 gap-4 text-center'>
                <div className='bg-gray-50 rounded-lg p-3'>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {stats.totalBookings}
                  </p>
                  <p className='text-xs text-gray-600'>Réservations</p>
                </div>
                <div className='bg-gray-50 rounded-lg p-3'>
                  <p className='text-2xl font-bold text-green-600'>
                    {formatCurrency(stats.totalSpent)}
                  </p>
                  <p className='text-xs text-gray-600'>Total dépensé</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className='bg-white rounded-lg shadow'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                    activeTab === tab.id
                      ? 'text-yellow-600 bg-yellow-50 border-r-2 border-yellow-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className='h-5 w-5' />
                  <span className='font-medium'>{tab.label}</span>
                </button>
              ))}

              <div className='border-t border-gray-200'>
                <Button
                  variant='ghost'
                  className='w-full justify-start px-4 py-3 text-red-600 hover:bg-red-50'
                  icon={<LogOut className='h-5 w-5' />}
                  onClick={handleSignOut}
                  loading={loading}
                >
                  Déconnexion
                </Button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className='flex-1'>
            <div className='bg-white rounded-lg shadow'>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-2xl font-semibold text-gray-900'>
                      Bienvenue, {getUserDisplayName()}!
                    </h2>
                    <div className='flex space-x-3'>
                      <Button
                        variant='primary'
                        icon={<Plus className='h-4 w-4' />}
                        onClick={() => (window.location.href = '/car-rental')}
                      >
                        Nouvelle Réservation
                      </Button>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
                    <div className='bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-blue-600 text-sm font-medium'>
                            Réservations Actives
                          </p>
                          <p className='text-3xl font-bold text-blue-700'>
                            {stats.activeBookings}
                          </p>
                        </div>
                        <Clock className='h-8 w-8 text-blue-500' />
                      </div>
                    </div>

                    <div className='bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-green-600 text-sm font-medium'>
                            Terminées
                          </p>
                          <p className='text-3xl font-bold text-green-700'>
                            {stats.completedBookings}
                          </p>
                        </div>
                        <CheckCircle className='h-8 w-8 text-green-500' />
                      </div>
                    </div>

                    <div className='bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-yellow-600 text-sm font-medium'>
                            Total Réservations
                          </p>
                          <p className='text-3xl font-bold text-yellow-700'>
                            {stats.totalBookings}
                          </p>
                        </div>
                        <FileText className='h-8 w-8 text-yellow-500' />
                      </div>
                    </div>

                    <div className='bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-purple-600 text-sm font-medium'>
                            Total Dépensé
                          </p>
                          <p className='text-3xl font-bold text-purple-700'>
                            {formatCurrency(stats.totalSpent)}
                          </p>
                        </div>
                        <CreditCard className='h-8 w-8 text-purple-500' />
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                      Réservations Récentes
                    </h3>
                    {bookings.length === 0 ? (
                      <div className='text-center py-8 text-gray-500'>
                        <Car className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                        <p className='text-lg font-medium'>
                          Aucune réservation pour le moment
                        </p>
                        <p className='text-sm'>
                          Commencez par réserver votre premier véhicule
                        </p>
                        <Button
                          variant='primary'
                          className='mt-4'
                          onClick={() => (window.location.href = '/car-rental')}
                        >
                          Explorer nos véhicules
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {bookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            className='flex items-center space-x-4 p-4 border border-gray-200 rounded-lg'
                          >
                            <div className='w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                              <Car className='h-8 w-8 text-gray-400' />
                            </div>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-gray-900'>
                                {booking.vehicle?.name || 'Véhicule'}
                              </h4>
                              <p className='text-sm text-gray-600'>
                                Du {formatDate(booking.start_date)} au{' '}
                                {formatDate(booking.end_date)}
                              </p>
                              <div className='flex items-center space-x-4 mt-2'>
                                <span
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    statusColors[booking.booking_status]
                                  }`}
                                >
                                  {getStatusIcon(booking.booking_status)}
                                  <span>
                                    {statusLabels[booking.booking_status]}
                                  </span>
                                </span>
                                <span className='text-sm font-medium text-gray-900'>
                                  {formatCurrency(booking.total_amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {bookings.length > 3 && (
                          <Button
                            variant='secondary'
                            onClick={() => setActiveTab('reservations')}
                            className='w-full'
                          >
                            Voir toutes les réservations
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reservations Tab */}
              {activeTab === 'reservations' && (
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-2xl font-semibold text-gray-900'>
                      Mes Réservations
                    </h2>
                    <Button
                      variant='primary'
                      icon={<Plus className='h-4 w-4' />}
                      onClick={() => (window.location.href = '/car-rental')}
                    >
                      Nouvelle Réservation
                    </Button>
                  </div>

                  {bookings.length === 0 ? (
                    <div className='text-center py-12 text-gray-500'>
                      <FileText className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                      <h3 className='text-lg font-medium mb-2'>
                        Aucune réservation
                      </h3>
                      <p className='text-sm mb-6'>
                        Vous n'avez pas encore effectué de réservation
                      </p>
                      <Button
                        variant='primary'
                        onClick={() => (window.location.href = '/car-rental')}
                      >
                        Réserver un véhicule
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-6'>
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className='border border-gray-200 rounded-lg p-6'
                        >
                          <div className='flex flex-col lg:flex-row lg:items-center justify-between mb-4'>
                            <div className='flex items-center space-x-4'>
                              <div className='w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center'>
                                <Car className='h-10 w-10 text-gray-400' />
                              </div>
                              <div>
                                <h3 className='text-lg font-semibold text-gray-900'>
                                  {booking.vehicle?.name || 'Véhicule'}
                                </h3>
                                <p className='text-sm text-gray-600'>
                                  {booking.vehicle?.make}{' '}
                                  {booking.vehicle?.model}{' '}
                                  {booking.vehicle?.year}
                                </p>
                                <span
                                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                    statusColors[booking.booking_status]
                                  }`}
                                >
                                  {getStatusIcon(booking.booking_status)}
                                  <span>
                                    {statusLabels[booking.booking_status]}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className='text-right mt-4 lg:mt-0'>
                              <p className='text-2xl font-bold text-gray-900'>
                                {formatCurrency(booking.total_amount)}
                              </p>
                              <p className='text-sm text-gray-600'>
                                Réservation #{booking.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-gray-200'>
                            <div className='flex items-center space-x-2 text-sm text-gray-600'>
                              <Calendar className='h-4 w-4' />
                              <span>Du {formatDate(booking.start_date)}</span>
                            </div>
                            <div className='flex items-center space-x-2 text-sm text-gray-600'>
                              <Calendar className='h-4 w-4' />
                              <span>Au {formatDate(booking.end_date)}</span>
                            </div>
                            <div className='flex items-center space-x-2 text-sm text-gray-600'>
                              <MapPin className='h-4 w-4' />
                              <span>
                                {booking.pickup_location || 'Lieu de retrait'}
                              </span>
                            </div>
                          </div>

                          {booking.special_requests && (
                            <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                              <p className='text-sm font-medium text-gray-700 mb-1'>
                                Demandes spéciales:
                              </p>
                              <p className='text-sm text-gray-600'>
                                {booking.special_requests}
                              </p>
                            </div>
                          )}

                          <div className='flex justify-end space-x-3 mt-4'>
                            <Button
                              variant='secondary'
                              size='sm'
                              icon={<Eye className='h-4 w-4' />}
                            >
                              Détails
                            </Button>
                            {booking.booking_status === 'pending' && (
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-600'
                              >
                                Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className='p-6'>
                  <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                    Mon Profil
                  </h2>

                  <div className='max-w-2xl'>
                    <div className='space-y-6'>
                      <div className='grid md:grid-cols-2 gap-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Nom complet
                          </label>
                          <input
                            type='text'
                            value={
                              isEditing
                                ? editedProfile.full_name
                                : user?.full_name || ''
                            }
                            onChange={(e) =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                full_name: e.target.value,
                              }))
                            }
                            readOnly={!isEditing}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 ${
                              isEditing ? 'bg-white' : 'bg-gray-50'
                            }`}
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Email
                          </label>
                          <input
                            type='email'
                            value={user?.email || ''}
                            readOnly
                            className='w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50'
                          />
                          <p className='text-xs text-gray-500 mt-1'>
                            L'email ne peut pas être modifié
                          </p>
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Téléphone
                          </label>
                          <input
                            type='tel'
                            value={
                              isEditing
                                ? editedProfile.phone
                                : user?.phone || ''
                            }
                            onChange={(e) =>
                              setEditedProfile((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            readOnly={!isEditing}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 ${
                              isEditing ? 'bg-white' : 'bg-gray-50'
                            }`}
                            placeholder='Votre numéro de téléphone'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Rôle
                          </label>
                          <input
                            type='text'
                            value={
                              user?.role === 'admin'
                                ? 'Administrateur'
                                : 'Utilisateur'
                            }
                            readOnly
                            className='w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50'
                          />
                        </div>
                      </div>

                      <div className='flex space-x-4'>
                        {isEditing ? (
                          <>
                            <Button
                              variant='primary'
                              onClick={handleProfileSave}
                              loading={loading || profileLoading}
                              disabled={loading || profileLoading}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              variant='secondary'
                              onClick={() => {
                                setIsEditing(false);
                                setEditedProfile({
                                  full_name: user?.full_name || '',
                                  phone: user?.phone || '',
                                });
                              }}
                              disabled={loading || profileLoading}
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant='primary'
                            icon={<Edit className='h-4 w-4' />}
                            onClick={() => setIsEditing(true)}
                          >
                            Modifier le profil
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className='p-6'>
                  <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                    Historique des Paiements
                  </h2>

                  {bookings.filter((b) => b.booking_status !== 'cancelled')
                    .length === 0 ? (
                    <div className='text-center py-12 text-gray-500'>
                      <CreditCard className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                      <h3 className='text-lg font-medium mb-2'>
                        Aucun paiement
                      </h3>
                      <p className='text-sm'>Vos paiements apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {bookings
                        .filter((b) => b.booking_status !== 'cancelled')
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                          >
                            <div className='flex items-center space-x-4'>
                              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                                <CreditCard className='h-6 w-6 text-green-600' />
                              </div>
                              <div>
                                <h4 className='font-medium text-gray-900'>
                                  Paiement - {booking.vehicle?.name}
                                </h4>
                                <p className='text-sm text-gray-600'>
                                  {formatDate(booking.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='font-semibold text-gray-900'>
                                {formatCurrency(booking.total_amount)}
                              </p>
                              <p className='text-xs text-green-600'>Payé</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className='p-6'>
                  <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
                    Préférences de Notification
                  </h2>

                  <div className='max-w-2xl space-y-6'>
                    <div className='space-y-4'>
                      <h3 className='text-lg font-medium text-gray-900'>
                        Méthodes de notification
                      </h3>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notifications.email}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              email: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Notifications par email
                          </span>
                          <p className='text-sm text-gray-600'>
                            Recevez des mises à jour sur vos réservations par
                            email
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notifications.sms}
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              sms: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Notifications SMS
                          </span>
                          <p className='text-sm text-gray-600'>
                            Recevez des alertes importantes par SMS
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className='border-t border-gray-200 pt-6'>
                      <h3 className='text-lg font-medium text-gray-900 mb-4'>
                        Types de notifications
                      </h3>
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-900'>
                            Confirmations de réservation
                          </span>
                          <input
                            type='checkbox'
                            className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                            defaultChecked
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-900'>
                            Rappels de rendez-vous
                          </span>
                          <input
                            type='checkbox'
                            className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                            defaultChecked
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-900'>
                            Offres promotionnelles
                          </span>
                          <input
                            type='checkbox'
                            className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                          />
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-900'>
                            Nouvelles fonctionnalités
                          </span>
                          <input
                            type='checkbox'
                            className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                          />
                        </div>
                      </div>
                    </div>

                    <Button variant='primary'>
                      Sauvegarder les préférences
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
