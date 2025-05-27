import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import FormInput from '../components/FormInput';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const validateEmail = (email: string): boolean => {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(formData.password)) {
      newErrors.password =
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName || formData.email.split('@')[0],
      });
      // Success handling is done in the AuthContext
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('email')) {
          setErrors({ email: err.message });
        } else if (errorMessage.includes('password')) {
          setErrors({ password: err.message });
        } else {
          setErrors({ general: err.message });
        }
      }
    }
  };

  const handleValidation = (field: keyof typeof isValid, valid: boolean) => {
    setIsValid((prev) => ({ ...prev, [field]: valid }));
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Créer un compte
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Ou{' '}
            <Link
              to='/login'
              className='font-medium text-yellow-600 hover:text-yellow-500'
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {errors.general && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <AlertCircle className='h-5 w-5 text-red-400' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    {errors.general}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className='rounded-md shadow-sm space-y-4'>
            {/* Full Name Field (Optional) */}
            <div>
              <label
                htmlFor='fullName'
                className='block text-sm font-medium text-gray-700'
              >
                Nom complet (optionnel)
              </label>
              <div className='mt-1 relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <User className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id='fullName'
                  name='fullName'
                  type='text'
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange('fullName', e.target.value)
                  }
                  className='appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm'
                  placeholder='Votre nom complet'
                />
              </div>
            </div>

            {/* Email Field */}
            <FormInput
              label='Adresse email'
              type='email'
              name='email'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              icon={<Mail className='h-5 w-5' />}
              onValidation={(valid) => handleValidation('email', valid)}
              required
            />

            {/* Password Field */}
            <FormInput
              label='Mot de passe'
              type={showPassword ? 'text' : 'password'}
              name='password'
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              icon={<Lock className='h-5 w-5' />}
              required
              endAdornment={
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='focus:outline-none'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5 text-gray-400' />
                  ) : (
                    <Eye className='h-5 w-5 text-gray-400' />
                  )}
                </button>
              }
              onValidation={(valid) => handleValidation('password', valid)}
            />

            {/* Confirm Password Field */}
            <FormInput
              label='Confirmer le mot de passe'
              type={showConfirmPassword ? 'text' : 'password'}
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange('confirmPassword', e.target.value)
              }
              error={errors.confirmPassword}
              icon={<Lock className='h-5 w-5' />}
              required
              endAdornment={
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='focus:outline-none'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-5 w-5 text-gray-400' />
                  ) : (
                    <Eye className='h-5 w-5 text-gray-400' />
                  )}
                </button>
              }
              onValidation={(valid) =>
                handleValidation('confirmPassword', valid)
              }
            />
          </div>

          {/* Password Requirements */}
          <div className='text-sm text-gray-600 space-y-1'>
            <h4 className='font-medium text-gray-700'>
              Le mot de passe doit contenir:
            </h4>
            <ul className='list-disc pl-5 space-y-1'>
              <li
                className={
                  formData.password.length >= 8
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              >
                Au moins 8 caractères
              </li>
              <li
                className={
                  /[A-Z]/.test(formData.password)
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              >
                Une lettre majuscule
              </li>
              <li
                className={
                  /[a-z]/.test(formData.password)
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              >
                Une lettre minuscule
              </li>
              <li
                className={
                  /\d/.test(formData.password)
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              >
                Un chiffre
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            variant='primary'
            loading={loading}
            fullWidth
            size='lg'
            disabled={
              loading ||
              !formData.email ||
              !formData.password ||
              !formData.confirmPassword
            }
          >
            S'inscrire
          </Button>
        </form>
      </div>
    </div>
  );
}
