import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit,
  Loader,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import type { Profile } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

// Extended user type with booking stats
interface UserWithStats extends Profile {
  booking_count: number;
  total_spent: number;
  last_booking: string | null;
  is_active: boolean;
}

type UserFilter = 'all' | 'admin' | 'user';
type UserSort = 'name' | 'email' | 'created_at' | 'booking_count';

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [sortBy, setSortBy] = useState<UserSort>('created_at');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for user creation/editing
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users with booking statistics
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users with booking counts and spending
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(
          `
          *,
          bookings!fk_bookings_user_id(
            id,
            total_amount,
            created_at,
            booking_status
          )
        `
        )
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Also fetch users without bookings
      const { data: allUsersData, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allUsersError) throw allUsersError;

      // Combine and calculate stats for each user
      const usersWithStats: UserWithStats[] = (allUsersData || []).map(
        (user) => {
          const userBookings = (usersData || [])
            .filter((u) => u.id === user.id)
            .flatMap((u) => u.bookings || []);

          const completedBookings = userBookings.filter(
            (b) => b.booking_status !== 'cancelled'
          );

          const booking_count = userBookings.length;
          const total_spent = completedBookings.reduce(
            (sum, b) => sum + b.total_amount,
            0
          );
          const last_booking =
            userBookings.length > 0
              ? userBookings.sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0].created_at
              : null;

          // Consider user active if they have bookings in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const is_active = userBookings.some(
            (b) => new Date(b.created_at) > thirtyDaysAgo
          );

          return {
            ...user,
            booking_count,
            total_spent,
            last_booking,
            is_active,
          };
        }
      );

      setUsers(usersWithStats);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      if (filter !== 'all' && user.role !== filter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          user.full_name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.phone?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'booking_count':
          return b.booking_count - a.booking_count;
        case 'created_at':
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  // Handle user creation/update
  const handleSaveUser = async () => {
    if (!userForm.full_name || !userForm.email) {
      setError('Nom et email sont requis');
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            phone: userForm.phone,
            role: userForm.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
      } else {
        // Note: Creating new users requires auth signup
        // This would typically be done through a separate admin API
        setError(
          "La création d'utilisateurs nécessite une implémentation d'authentification avancée"
        );
        return;
      }

      await fetchUsers();
      setShowUserModal(false);
      setEditingUser(null);
      resetForm();
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      setError(null);

      // Note: In production, you might want to soft delete or restrict deletion
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'deactivate') => {
    if (selectedUsers.length === 0) return;

    try {
      setError(null);

      if (action === 'delete') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .in('id', selectedUsers);

        if (error) throw error;
      }

      await fetchUsers();
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error in bulk action:', err);
      setError("Erreur lors de l'action groupée");
    }
  };

  const resetForm = () => {
    setUserForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'user',
    });
  };

  const openEditModal = (user: UserWithStats) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
    });
    setShowUserModal(true);
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

  const getRoleColor = (role: string) => {
    return role === 'admin'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Gestion des utilisateurs
        </h1>
        <div className='flex space-x-3'>
          {selectedUsers.length > 0 && (
            <div className='flex space-x-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleBulkAction('delete')}
                className='text-red-600'
              >
                Supprimer ({selectedUsers.length})
              </Button>
            </div>
          )}
          <Button
            variant='primary'
            icon={<Plus className='h-4 w-4' />}
            onClick={() => {
              setEditingUser(null);
              resetForm();
              setShowUserModal(true);
            }}
          >
            Ajouter un utilisateur
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
                placeholder='Rechercher un utilisateur...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
              />
            </div>

            {/* Filter by role */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as UserFilter)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            >
              <option value='all'>Tous les rôles</option>
              <option value='user'>Utilisateurs</option>
              <option value='admin'>Administrateurs</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as UserSort)}
              className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
            >
              <option value='created_at'>Date d'inscription</option>
              <option value='name'>Nom</option>
              <option value='email'>Email</option>
              <option value='booking_count'>Nombre de réservations</option>
            </select>
          </div>

          <div className='text-sm text-gray-500'>
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left'>
                  <input
                    type='checkbox'
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map((u) => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className='rounded border-gray-300 text-yellow-600 focus:ring-yellow-500'
                  />
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Utilisateur
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Rôle
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Statut
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Réservations
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Total dépensé
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Inscription
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredUsers.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <input
                      type='checkbox'
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className='rounded border-gray-300 text-yellow-600 focus:ring-yellow-500'
                    />
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center'>
                        <User className='h-5 w-5 text-gray-500' />
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.full_name || 'Nom non renseigné'}
                        </div>
                        <div className='text-sm text-gray-500 flex items-center'>
                          <Mail className='h-3 w-3 mr-1' />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className='text-sm text-gray-500 flex items-center'>
                            <Phone className='h-3 w-3 mr-1' />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role === 'admin' ? (
                        <>
                          <Shield className='h-3 w-3 mr-1' />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className='h-3 w-3 mr-1' />
                          Utilisateur
                        </>
                      )}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        user.is_active
                      )}`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircle className='h-3 w-3 mr-1' />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className='h-3 w-3 mr-1' />
                          Inactif
                        </>
                      )}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 mr-2 text-gray-400' />
                      {user.booking_count}
                    </div>
                    {user.last_booking && (
                      <div className='text-xs text-gray-500'>
                        Dernière: {formatDate(user.last_booking)}
                      </div>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    {formatCurrency(user.total_spent)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {formatDate(user.created_at)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex items-center justify-end space-x-2'>
                      <button
                        onClick={() => openEditModal(user)}
                        className='text-yellow-600 hover:text-yellow-900'
                        title='Modifier'
                      >
                        <Edit className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
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

        {filteredUsers.length === 0 && (
          <div className='text-center py-12'>
            <User className='h-12 w-12 mx-auto mb-4 text-gray-400' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun utilisateur trouvé
            </h3>
            <p className='text-gray-500'>
              {searchTerm
                ? 'Aucun utilisateur ne correspond à votre recherche.'
                : 'Commencez par ajouter des utilisateurs.'}
            </p>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg max-w-md w-full p-6'>
            <h2 className='text-xl font-semibold mb-6'>
              {editingUser
                ? "Modifier l'utilisateur"
                : 'Ajouter un utilisateur'}
            </h2>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Nom complet *
                </label>
                <input
                  type='text'
                  value={userForm.full_name}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      full_name: e.target.value,
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
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  disabled={!!editingUser} // Can't change email when editing
                  required
                />
                {editingUser && (
                  <p className='text-xs text-gray-500 mt-1'>
                    L'email ne peut pas être modifié
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Téléphone
                </label>
                <input
                  type='tel'
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Rôle
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      role: e.target.value as 'user' | 'admin',
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                >
                  <option value='user'>Utilisateur</option>
                  <option value='admin'>Administrateur</option>
                </select>
              </div>
            </div>

            <div className='flex space-x-3 mt-6'>
              <Button
                variant='secondary'
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                disabled={formLoading}
                fullWidth
              >
                Annuler
              </Button>
              <Button
                variant='primary'
                onClick={handleSaveUser}
                loading={formLoading}
                disabled={formLoading}
                fullWidth
              >
                {editingUser ? 'Mettre à jour' : 'Créer'}
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
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette
                action est irréversible.
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
                  onClick={() => handleDeleteUser(deleteConfirm)}
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

export default UserManagement;
