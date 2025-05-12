import React, { useState, useEffect } from 'react';
import { Mail, Phone, AlertCircle, Check } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  type: 'email' | 'tel' | 'text' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValidation?: (isValid: boolean) => void;
  endAdornment?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function FormInput({ 
  label, 
  error, 
  type, 
  value, 
  onChange,
  onValidation,
  endAdornment,
  icon,
  ...props 
}: FormInputProps) {
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const validateInput = (value: string) => {
    if (!value.trim()) return false;
    
    if (type === 'email') {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      return emailRegex.test(value);
    } else if (type === 'tel') {
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      return phoneRegex.test(value);
    } else if (type === 'password') {
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      
      return hasMinLength &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /\d/.test(value);
    }
    return value.trim().length >= 2;
  };

  useEffect(() => {
    if (isTouched) {
      const valid = validateInput(value);
      setIsValid(valid);
      onValidation?.(valid);
    }
  }, [value, isTouched]);

  const getIcon = () => {
    return icon || (
      type === 'email' ? <Mail className="h-5 w-5 text-gray-400" /> :
      type === 'tel' ? <Phone className="h-5 w-5 text-gray-400" /> :
      null
    );
  };

  const getBorderColor = () => {
    if (!isTouched) return 'border-gray-300';
    if (error) return 'border-red-500';
    return isValid ? 'border-green-500' : 'border-gray-300';
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getIcon()}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={() => setIsTouched(true)}
          className={`w-full pl-10 pr-${endAdornment ? '10' : '3'} py-2 border ${getBorderColor()} rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endAdornment}
          </div>
        )}
        {isTouched && !endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isValid ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>
      {error && isTouched && (
        <p className="text-sm text-red-600 flex items-center mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}