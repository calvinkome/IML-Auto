import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  AlertCircle,
  Send,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const {
    signIn,
    user,
    loading,
    resendVerificationEmail,
    isEmailVerified,
    pendingVerificationEmail,
    setPendingVerificationEmail,
  } = useAuth();
    console.log("🚀 ~ Login ~ loading:", loading)

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    loading: boolean;
    message: string | null;
    success: boolean;
  }>({
    loading: false,
    message: null,
    success: false,
  });

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user && isEmailVerified()) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }

    // Check for pending verification
    if (pendingVerificationEmail) {
      setIdentifier(pendingVerificationEmail);
      setError('Please verify your email first');
    }

    // Pre-fill identifier if remembered
    const rememberedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
    }
  }, [user, navigate, isEmailVerified, pendingVerificationEmail]);

  const validateForm = (): boolean => {
    if (!identifier.trim()) {
      setError('Email is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendStatus({ loading: false, message: null, success: false });

    if (!validateForm()) {
      return;
    }

    try {
      await signIn(identifier.trim(), password);
      // Success handling is done in AuthContext
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        const errorMessage = err.message;
        setError(errorMessage);

        // Auto-set pending email if verification required
        if (
          errorMessage.includes('verify your email') ||
          errorMessage.includes('Email not confirmed')
        ) {
          setPendingVerificationEmail(identifier);
        }
      }
    }
  };

  const handleResendVerification = async () => {
    const emailToResend = pendingVerificationEmail || identifier;
    if (!emailToResend) {
      setResendStatus({
        loading: false,
        message: 'Please enter your email address first',
        success: false,
      });
      return;
    }

    setResendStatus({ loading: true, message: null, success: false });
    try {
      await resendVerificationEmail(emailToResend);
      setResendStatus({
        loading: false,
        message:
          'Verification email sent! Please check your inbox and spam folder.',
        success: true,
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        message: 'Failed to resend. Please try again later.',
        success: false,
      });
    }
  };

  const handleRememberMe = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      localStorage.setItem('rememberedIdentifier', identifier);
    } else {
      localStorage.removeItem('rememberedIdentifier');
    }
  };

  const showResendLink = Boolean(
    error?.includes('verify your email') ||
      error?.includes('Email not confirmed') ||
      pendingVerificationEmail
  );

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Sign in to your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link
              to='/register'
              className='font-medium text-yellow-600 hover:text-yellow-500'
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='rounded-md shadow-sm space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email address
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Mail className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='identifier'
                  name='identifier'
                  type='email'
                  autoComplete='email'
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null); // Clear error when typing
                  }}
                  className='appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm'
                  placeholder='Email address'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null); // Clear error when typing
                  }}
                  className='appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm'
                  placeholder='Password'
                />
                <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <AlertCircle className='h-5 w-5 text-red-400' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                  {showResendLink && (
                    <div className='mt-3 space-y-2'>
                      <button
                        type='button'
                        onClick={handleResendVerification}
                        disabled={resendStatus.loading}
                        className='flex items-center text-sm text-yellow-600 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {resendStatus.loading ? (
                          <>
                            <RefreshCw className='w-4 h-4 mr-1 animate-spin' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className='w-4 h-4 mr-1' />
                            Resend verification email
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {resendStatus.message && (
            <div
              className={`rounded-md p-4 ${
                resendStatus.success ? 'bg-green-50' : 'bg-yellow-50'
              }`}
            >
              <div className='flex'>
                <div className='flex-shrink-0'>
                  {resendStatus.success ? (
                    <CheckCircle className='h-5 w-5 text-green-400' />
                  ) : (
                    <AlertCircle className='h-5 w-5 text-yellow-400' />
                  )}
                </div>
                <div className='ml-3'>
                  <h3
                    className={`text-sm font-medium ${
                      resendStatus.success
                        ? 'text-green-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    {resendStatus.message}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <input
                id='remember-me'
                name='remember-me'
                type='checkbox'
                onChange={handleRememberMe}
                className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
              />
              <label
                htmlFor='remember-me'
                className='ml-2 block text-sm text-gray-900'
              >
                Remember me
              </label>
            </div>

            <div className='text-sm'>
              <Link
                to='/forgot-password'
                className='font-medium text-yellow-600 hover:text-yellow-500'
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type='submit'
            variant='primary'
            loading={loading}
            fullWidth
            size='lg'
          >
            Sign in
          </Button>

          {/* Standalone Resend Button for users who just need to resend */}
          {!error && (
            <div className='text-center'>
              <button
                type='button'
                onClick={handleResendVerification}
                disabled={resendStatus.loading || !identifier}
                className='text-sm text-yellow-600 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Need to resend verification email?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
