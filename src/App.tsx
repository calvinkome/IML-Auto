import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { ToastProvider } from './contexts/ToastContext';
import About from './pages/About';
import AirportService from './pages/AirportService';
import CarRental from './pages/CarRental';
import Contact from './pages/Contact';
import Diagnostics from './pages/Diagnostics';
import Fleet from './pages/Fleet';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Locations from './pages/Locations';
import Login from './pages/Login';
import PremiumService from './pages/PremiumService';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Support from './pages/Support';
import VerifyEmailPage from './pages/VerifyEmailPage'; // Import VerifyEmailPage
import AdminLogin from './pages/admin/AdminLogin';
import AdminSettings from './pages/admin/AdminSettings';
import BookingManagement from './pages/admin/BookingManagement';
import AdminDashboard from './pages/admin/Dashboard';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import UserManagement from './pages/admin/UserManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import Blog from './pages/blog/Blog';
import CustomerBooking from './pages/CustomerBooking';

// ProtectedRoute Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return children;
};

// AdminLayout Component for Grouped Admin Routes
const AdminLayout = () => {
  return (
    <div>
      {/* Add a common admin layout (e.g., sidebar or header) here */}
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path='dashboard' element={<AdminDashboard />} />
        <Route path='users' element={<UserManagement />} />
        <Route path='vehicles' element={<VehicleManagement />} />
        <Route path='bookings' element={<BookingManagement />} />
        <Route path='reports' element={<ReportsAnalytics />} />
        <Route path='settings' element={<AdminSettings />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ReservationProvider>
          <div className='min-h-screen bg-white flex flex-col'>
            <Navbar />
            <main className='flex-grow'>
              <Routes>
                {/* Public Routes */}
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/verify-email' element={<VerifyEmailPage />} />
                <Route path='/blog/*' element={<Blog />} />
                <Route path='/about' element={<About />} />
                <Route path='/locations' element={<Locations />} />
                <Route path='/car-rental' element={<CarRental />} />
                <Route path='/fleet' element={<Fleet />} />
                <Route path='/diagnostics' element={<Diagnostics />} />
                <Route path='/airport-service' element={<AirportService />} />
                <Route path='/premium-service' element={<PremiumService />} />
                <Route path='/support' element={<Support />} />
                <Route path='/contact' element={<Contact />} />
                <Route path='/booking' element={<CustomerBooking />} />
                <Route path='/reserve' element={<CustomerBooking />} />

                {/* Protected Routes */}
                <Route
                  path='/profile'
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route path='/admin/login' element={<AdminLogin />} />
                <Route
                  path='/admin/*'
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </ReservationProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
