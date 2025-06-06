import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  ChevronDown,
  ShoppingCart,
  LogIn,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

const mainMenuItems = [
  {
    title: 'Notre Flotte',
    path: '/fleet',
    submenu: [
      { name: 'Économique', path: '/fleet?category=economic' },
      { name: 'Luxe', path: '/fleet?category=luxury' },
      { name: 'SUV', path: '/fleet?category=suv' },
      { name: 'Utilitaire', path: '/fleet?category=utility' },
    ],
  },
  {
    title: 'Services',
    path: '/services',
    submenu: [
      { name: 'Location Standard', path: '/car-rental' },
      { name: 'Service Premium', path: '/premium-service' },
      { name: 'Diagnostics', path: '/diagnostics' },
      { name: 'Service Aéroportuaire', path: '/airport-service' },
      { name: 'Assistance 24/7', path: '/support' },
    ],
  },
  {
    title: 'Réservation',
    path: '/booking',
    submenu: [
      { name: 'Réserver un véhicule', path: '/car-rental' },
      { name: 'Service aéroportuaire', path: '/airport-service' },
      { name: 'Service premium', path: '/premium-service' },
    ],
  },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const toggleSubmenu = useCallback(
    (title: string) => {
      setActiveSubmenu(activeSubmenu === title ? null : title);
    },
    [activeSubmenu]
  );

  const handleNavigation = useCallback(
    (path: string) => {
      try {
        navigate(path);
        setMobileMenuOpen(false);
        setActiveSubmenu(null);
        setUserDropdownOpen(false);
      } catch (error) {
        console.error('Navigation error:', error);
        const toast = document.createElement('div');
        toast.className =
          'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = 'Une erreur est survenue lors de la redirection';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    },
    [navigate]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      const toast = document.createElement('div');
      toast.className =
        'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Erreur lors de la déconnexion';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }, [signOut, navigate]);

  // Get user display name safely
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';

    // Try username first, then email, then fallback
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  }, [user]);

  const getUserInitial = useCallback(() => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  }, [getUserDisplayName]);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest('.user-dropdown') &&
        !target.closest('.user-avatar')
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
    setActiveSubmenu(null);
    setUserDropdownOpen(false);
  }, [window.location.pathname]);

  return (
    <nav className='bg-black text-white py-4 px-6 w-full z-50 shadow-lg'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <Link to='/' className='flex items-center space-x-2'>
          <Car className='h-8 w-8 text-yellow-400' />
          <span className='text-xl font-bold'>IML Auto</span>
        </Link>

        {/* Desktop Menu */}
        <div className='hidden lg:flex items-center space-x-8'>
          <Link to='/' className='hover:text-yellow-400 font-medium'>
            Accueil
          </Link>

          {mainMenuItems.map((item) => (
            <div key={item.title} className='relative group'>
              <button
                className='flex items-center space-x-1 hover:text-yellow-400 font-medium'
                onClick={() => toggleSubmenu(item.title)}
              >
                <span>{item.title}</span>
                <ChevronDown className='h-4 w-4' />
              </button>

              <div className='absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300'>
                <div className='py-2'>
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.path}
                      onClick={() => handleNavigation(subItem.path)}
                      className='block px-4 py-2 text-gray-800 hover:bg-yellow-50 hover:text-yellow-600'
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Link to='/blog' className='hover:text-yellow-400 font-medium'>
            Blog
          </Link>
          <Link to='/about' className='hover:text-yellow-400 font-medium'>
            À Propos
          </Link>
          <Link to='/contact' className='hover:text-yellow-400 font-medium'>
            Contact
          </Link>
        </div>

        {/* User Actions */}
        <div className='hidden lg:flex items-center space-x-6'>
          {user ? (
            <>
              <button
                className='text-white hover:text-yellow-400 transition-colors'
                aria-label='Panier'
              >
                <ShoppingCart className='h-6 w-6' />
              </button>

              {/* User Dropdown */}
              <div className='relative'>
                <button
                  className='user-avatar flex items-center space-x-2 text-white hover:text-yellow-400 transition-colors'
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label='Menu utilisateur'
                >
                  <div className='w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-semibold'>
                    {getUserInitial()}
                  </div>
                  <span className='font-medium'>{getUserDisplayName()}</span>
                  <ChevronDown className='h-4 w-4' />
                </button>

                {userDropdownOpen && (
                  <div className='user-dropdown absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2'>
                    <Link
                      to='/profile'
                      onClick={() => handleNavigation('/profile')}
                      className='flex items-center px-4 py-2 text-gray-800 hover:bg-yellow-50 hover:text-yellow-600'
                    >
                      <User className='h-4 w-4 mr-2' />
                      Mon Profil
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to='/admin/dashboard'
                        onClick={() => handleNavigation('/admin/dashboard')}
                        className='flex items-center px-4 py-2 text-gray-800 hover:bg-yellow-50 hover:text-yellow-600'
                      >
                        <User className='h-4 w-4 mr-2' />
                        Administration
                      </Link>
                    )}
                    <div className='border-t border-gray-200 my-1'></div>
                    <button
                      onClick={handleSignOut}
                      disabled={loading}
                      className='flex items-center w-full px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
                    >
                      <LogOut className='h-4 w-4 mr-2' />
                      {loading ? 'Déconnexion...' : 'Se déconnecter'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to='/login'
                className='inline-flex items-center text-white hover:text-yellow-400 font-medium transition-colors'
              >
                <LogIn className='h-5 w-5 mr-2' />
                <span>Connexion</span>
              </Link>
              <Link
                to='/register'
                className='bg-yellow-400 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 transition-colors'
              >
                S'inscrire
              </Link>
            </>
          )}
          <Link to='/booking' className='inline-block'>
            <Button variant='primary' size='md'>
              Réserver
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className='lg:hidden text-white'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <Menu className='h-6 w-6' />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className='lg:hidden absolute left-0 right-0 top-28 bg-black border-t border-gray-800'>
          <div className='px-4 py-2'>
            <Link
              to='/'
              className='block py-2 text-white hover:text-yellow-400'
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>

            {mainMenuItems.map((item) => (
              <div key={item.title}>
                <button
                  className='flex items-center justify-between w-full py-2 text-white hover:text-yellow-400'
                  onClick={() => toggleSubmenu(item.title)}
                >
                  <span>{item.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 transform transition-transform ${
                      activeSubmenu === item.title ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {activeSubmenu === item.title && (
                  <div className='pl-4 pb-2'>
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.path}
                        onClick={() => handleNavigation(subItem.path)}
                        className='block py-2 text-gray-300 hover:text-yellow-400'
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              to='/blog'
              className='block py-2 text-white hover:text-yellow-400'
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to='/about'
              className='block py-2 text-white hover:text-yellow-400'
              onClick={() => setMobileMenuOpen(false)}
            >
              À Propos
            </Link>
            <Link
              to='/contact'
              className='block py-2 text-white hover:text-yellow-400'
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {/* Mobile User Section */}
            {user ? (
              <div className='border-t border-gray-800 mt-4 pt-4'>
                <div className='flex items-center space-x-2 py-2 text-yellow-400'>
                  <div className='w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black font-semibold text-sm'>
                    {getUserInitial()}
                  </div>
                  <span className='font-medium'>{getUserDisplayName()}</span>
                </div>
                <Link
                  to='/profile'
                  className='block py-2 text-white hover:text-yellow-400'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mon Profil
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to='/admin/dashboard'
                    className='block py-2 text-white hover:text-yellow-400'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className='block w-full text-left py-2 text-white hover:text-red-400 disabled:opacity-50'
                >
                  {loading ? 'Déconnexion...' : 'Se déconnecter'}
                </button>
              </div>
            ) : (
              <div className='border-t border-gray-800 mt-4 pt-4'>
                <Link
                  to='/login'
                  className='block py-2 text-white hover:text-yellow-400'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to='/register'
                  className='block py-2 text-white hover:text-yellow-400'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </div>
            )}

            <div className='pt-4 border-t border-gray-800 mt-4'>
              <Link
                to='/booking'
                onClick={() => setMobileMenuOpen(false)}
                className='block w-full'
              >
                <Button variant='primary' fullWidth>
                  Réserver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className='bg-gray-900 py-1 px-6 text-sm'>
        <div className='max-w-7xl mx-auto flex justify-between items-center text-gray-400'>
          <div className='flex items-center space-x-4'>
            <span>Support 24/7: +243 819 623 320</span>
          </div>
          <div className='flex items-center space-x-4'>
            <span>
              {user
                ? `Connecté: ${getUserDisplayName()}`
                : 'Connecté en tant que visiteur'}
            </span>
            <span>Panier: 0 réservation</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
