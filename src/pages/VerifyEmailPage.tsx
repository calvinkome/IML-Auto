import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying'
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check for error in hash (when verification fails)
        const hash = location.hash;
        if (
          hash.includes('error=access_denied') ||
          hash.includes('error_code=otp_expired')
        ) {
          console.log('Verification failed from URL hash:', hash);
          setStatus('error');
          setMessage(
            'Email verification link has expired or is invalid. Please request a new verification email.'
          );
          toast.error(
            'Email verification link has expired. Please request a new verification email.'
          );

          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 4000);
          return;
        }

        // Check for success token in hash
        if (hash.includes('access_token')) {
          console.log('Verification successful from URL hash');
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          toast.success('Email verified successfully! You can now log in.');

          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 2000);
          return;
        }

        // Check URL parameters for token-based verification
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const token = searchParams.get('token'); // Legacy format

        console.log('Verification params:', { token_hash, type, token, hash });

        if (token_hash && type) {
          console.log('Verifying with token_hash:', token_hash);

          const { data, error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          });

          if (error) {
            console.error('Token hash verification failed:', error);
            setStatus('error');
            setMessage(
              'Email verification failed. The link may be expired or invalid.'
            );
            toast.error(
              'Email verification failed. Please try requesting a new verification email.'
            );
          } else if (data.user) {
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to login...');
            toast.success('Email verified successfully! You can now log in.');

            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
          return;
        }

        if (token && type) {
          console.log('Verifying with legacy token:', token);

          const { data, error } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash: token,
          });

          if (error) {
            console.error('Legacy token verification failed:', error);
            setStatus('error');
            setMessage(
              'Email verification failed. The link may be expired or invalid.'
            );
            toast.error(
              'Email verification failed. Please try requesting a new verification email.'
            );
          } else if (data.user) {
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to login...');
            toast.success('Email verified successfully! You can now log in.');

            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
          return;
        }

        // If we get here, there's no valid verification method
        setStatus('error');
        setMessage(
          'Invalid verification link. Please check your email for the correct link or request a new one.'
        );
        toast.error('Invalid verification link.');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 4000);
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred during email verification.');
        toast.error('Verification failed. Please try again.');

        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 4000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, location.hash]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-4'>
            {status === 'verifying' && (
              <Loader2 className='h-12 w-12 text-yellow-500 animate-spin' />
            )}
            {status === 'success' && (
              <CheckCircle className='h-12 w-12 text-green-500' />
            )}
            {status === 'error' && (
              <XCircle className='h-12 w-12 text-red-500' />
            )}
          </div>

          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          <p className='mt-2 text-center text-sm text-gray-600'>{message}</p>

          {status === 'error' && (
            <div className='mt-6 space-y-3'>
              <button
                onClick={() => navigate('/login')}
                className='w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors'
              >
                Return to Login (with resend option)
              </button>
              <p className='text-xs text-gray-500'>
                You can resend the verification email from the login page
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className='mt-4'>
              <button
                onClick={() => navigate('/login')}
                className='text-yellow-600 hover:text-yellow-700 font-medium'
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
