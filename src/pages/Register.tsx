import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import FormInput from '../components/FormInput';

interface FormErrors {
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      // Validate password requirements
      if (formData.password.length < 8 || 
          !/[A-Z]/.test(formData.password) || 
          !/[a-z]/.test(formData.password) || 
          !/\d/.test(formData.password)) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
      }

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.email.split('@')[0],
            full_name: formData.email.split('@')[0],
            role: 'user',
          }
        }
      });

      if (error) throw error;
      
      // Show success message
      setErrors({});
      showToast('Inscription réussie ! Vous allez être redirigé...', 'success');
      
      // Navigate to profile page after a short delay
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 2000);

    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('email')) {
          setErrors({ email: 'Cette adresse email est déjà utilisée ou invalide' });
        } else if (errorMessage.includes('password')) {
          setErrors({ password: 'Mot de passe invalide' });
        } else {
          setErrors({ email: err.message });
        }
        showToast(err.message, 'error');
      }
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidation = (field: keyof typeof isValid, valid: boolean) => {
    setIsValid(prev => ({ ...prev, [field]: valid }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-yellow-600 hover:text-yellow-500"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Champ Email */}
            <FormInput
              label="Adresse email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
              icon={<Mail className="h-5 w-5" />}
              onValidation={(valid) => handleValidation('email', valid)}
              required
            />

            {/* Champ Mot de passe */}
            <FormInput
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              error={errors.password}
              icon={<Lock className="h-5 w-5" />}
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? 
                    <EyeOff className="h-5 w-5 text-gray-400" /> : 
                    <Eye className="h-5 w-5 text-gray-400" />
                  }
                </button>
              }
              onValidation={(valid) => handleValidation('password', valid)}
            />

            {/* Champ Confirmer le mot de passe */}
            <FormInput
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={errors.confirmPassword}
              icon={<Lock className="h-5 w-5" />}
              required
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="focus:outline-none"
                >
                  {showConfirmPassword ? 
                    <EyeOff className="h-5 w-5 text-gray-400" /> : 
                    <Eye className="h-5 w-5 text-gray-400" />
                  }
                </button>
              }
              onValidation={(valid) => handleValidation('confirmPassword', valid)}
            />
          </div>

          {/* Password Requirements */}
          <div className="text-sm text-gray-600 space-y-1">
            <h4 className="font-medium text-gray-700">Le mot de passe doit contenir:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                Au moins 8 caractères
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                Une lettre majuscule
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                Une lettre minuscule
              </li>
              <li className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-600'}>
                Un chiffre
              </li>
            </ul>
          </div>

          {/* Bouton d'inscription */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
            size="lg"
            disabled={loading || !formData.email || !formData.password || !formData.confirmPassword}
          >
            S'inscrire
          </Button>
        </form>
      </div>
    </div>
  );
}