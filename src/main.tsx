import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import default styles
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* Wrap the app with BrowserRouter */}
      <AuthProvider> {/* Wrap the app with AuthProvider */}
        <App /> {/* Render the App component */}
        <ToastContainer /> {/* Add ToastContainer here */}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);