import {
  BarChart3,
  Calendar,
  Car,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users },
  { path: '/admin/vehicles', label: 'Véhicules', icon: Car },
  { path: '/admin/bookings', label: 'Réservations', icon: Calendar },
  { path: '/admin/reports', label: 'Rapports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export default function AdminNav() {
  const location = useLocation();

  return (
    <nav className='bg-white shadow-md rounded-lg overflow-hidden'>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center space-x-2 px-4 py-3 transition-colors ${
            location.pathname === item.path
              ? 'bg-yellow-50 text-yellow-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <item.icon className='h-5 w-5' />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
