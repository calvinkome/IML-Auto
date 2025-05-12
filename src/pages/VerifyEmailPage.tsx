import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    const verifyEmail = async () => {
      if (token && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: token,
          });

          if (error) throw error;

          toast.success('Email verified successfully! You can now log in.');
          navigate('/login', { replace: true });
        } catch (error) {
          console.error('Email verification failed:', error);
          toast.error('Email verification failed. Please try again.');
          navigate('/signup', { replace: true });
        }
      } else {
        toast.error('Invalid verification link.');
        navigate('/signup', { replace: true });
      }
    };

    verifyEmail();
  }, [token, type, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Verifying your email...</h2>
        <p>Please wait while we verify your email address.</p>
      </div>
    </div>
  );
}