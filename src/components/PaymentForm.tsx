import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Building2, AlertCircle, HelpCircle, Smartphone, Shield, Bitcoin } from 'lucide-react';
import Button from './Button';

interface PaymentFormProps {
  amount: number;
  duration?: number;
  currency?: string;
  onSubmit: (paymentDetails: PaymentDetails) => void;
  onCancel: () => void;
}

export interface PaymentDetails {
  method: 'card' | 'mobile' | 'bank' | 'paypal' | 'crypto' | 'digital_wallet';
  cardDetails?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
    type?: 'visa' | 'mastercard' | 'amex' | 'discover';
    saveForFuture?: boolean;
  };
  mobileDetails?: {
    provider: string;
    phone: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
    swiftCode?: string;
  };
  digitalWalletDetails?: {
    provider: 'apple_pay' | 'google_pay';
  };
  cryptoDetails?: {
    currency: string;
    address: string;
  };
}

interface ValidationState {
  cardNumber: boolean;
  cardExpiry: boolean;
  cardCvv: boolean;
  cardName: boolean;
}

const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, American Express',
    processingTime: 'Instant',
    fee: '0%'
  },
  {
    id: 'mobile',
    name: 'Mobile Money',
    icon: Wallet,
    description: 'M-Pesa, Orange Money, Airtel Money',
    processingTime: 'Instant',
    fee: '1%'
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Building2,
    description: 'Direct bank transfer',
    processingTime: '1-3 business days',
    fee: '0%'
  },
  {
    id: 'digital_wallet',
    name: 'Digital Wallets',
    icon: Smartphone,
    description: 'Apple Pay, Google Pay',
    processingTime: 'Instant',
    fee: '0%'
  }
 ];

const MOBILE_PROVIDERS = [
  { id: 'mpesa', name: 'M-Pesa' },
  { id: 'orange', name: 'Orange Money' },
  { id: 'airtel', name: 'Airtel Money' }
];

// Card type patterns
const CARD_PATTERNS = {
  visa: /^4/,
  mastercard: /^5[1-5]/,
  amex: /^3[47]/,
  discover: /^6/
};

export default function PaymentForm({ amount, duration = 1, onSubmit, onCancel }: PaymentFormProps) {
  const [method, setMethod] = useState<'card' | 'mobile' | 'bank' | 'paypal'>('card');
  const [formData, setFormData] = useState<PaymentDetails>({
    method: 'card',
    cardDetails: {
      number: '',
      expiry: '',
      cvv: '',
      name: '',
      type: undefined
    }
  });

  const [validation, setValidation] = useState<ValidationState>({
    cardNumber: true,
    cardExpiry: true,
    cardCvv: true,
    cardName: true
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Luhn algorithm for card validation
  const validateLuhn = (number: string): boolean => {
    const digits = number.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19);
  };

  // Format expiry date with slash
  const formatExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.substr(0, 2)}/${digits.substr(2, 2)}`;
    }
    return digits;
  };

  // Detect card type based on number
  const detectCardType = (number: string): string | undefined => {
    const cleanNumber = number.replace(/\D/g, '');
    for (const [type, pattern] of Object.entries(CARD_PATTERNS)) {
      if (pattern.test(cleanNumber)) return type;
    }
    return undefined;
  };

  // Field validation
  const validateField = (name: string, value: string): boolean => {
    switch (name) {
      case 'cardNumber': {
        const digits = value.replace(/\D/g, '');
        return digits.length === 16 && validateLuhn(digits);
      }
      case 'cardExpiry': {
        const [month, year] = value.split('/');
        const now = new Date();
        const expiry = new Date(2000 + parseInt(year || '0'), parseInt(month || '0') - 1);
        return expiry > now && parseInt(month || '0') <= 12;
      }
      case 'cardCvv':
        return /^\d{3,4}$/.test(value);
      case 'cardName':
        return /^[A-Za-z\s]{2,}$/.test(value);
      default:
        return true;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format input based on field type
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      const cardType = detectCardType(formattedValue);
      setFormData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails!,
          type: cardType as any,
          number: formattedValue
        }
      }));
    } else if (name === 'cardExpiry') {
      formattedValue = formatExpiry(value);
      setFormData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails!,
          expiry: formattedValue
        }
      }));
    } else if (name === 'cardName') {
      formattedValue = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails!,
          name: formattedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cardDetails: {
          ...prev.cardDetails!,
          [name.replace('card', '').toLowerCase()]: formattedValue
        }
      }));
    }

    // Validate field if touched
    if (touched[name]) {
      const isValid = validateField(name, formattedValue);
      setValidation(prev => ({ ...prev, [name]: isValid }));
      setErrors(prev => ({
        ...prev,
        [name]: isValid ? '' : getErrorMessage(name)
      }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const isValid = validateField(name, value);
    setValidation(prev => ({ ...prev, [name]: isValid }));
    setErrors(prev => ({
      ...prev,
      [name]: isValid ? '' : getErrorMessage(name)
    }));
  };

  // Get error message for field
  const getErrorMessage = (field: string): string => {
    switch (field) {
      case 'cardNumber':
        return 'Numéro de carte invalide';
      case 'cardExpiry':
        return 'Date d\'expiration invalide';
      case 'cardCvv':
        return 'Code CVV invalide';
      case 'cardName':
        return 'Nom invalide (lettres uniquement)';
      default:
        return 'Champ invalide';
    }
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    if (method === 'card') {
      return Object.values(validation).every(v => v) &&
             Object.keys(validation).every(k => touched[k]);
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Paiement - {amount * duration}€</h2>

      <div className="mb-6">
        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {PAYMENT_METHODS.map(paymentMethod => (
            <button
              key={paymentMethod.id}
              type="button"
              onClick={() => setMethod(paymentMethod.id as any)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                method === paymentMethod.id
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`Sélectionner ${paymentMethod.name}`}
            >
              <paymentMethod.icon className="h-6 w-6 mb-2 mx-auto text-yellow-600" />
              <div className="text-sm font-medium text-center">{paymentMethod.name}</div>
              <div className="text-xs text-gray-500 text-center mt-1">{paymentMethod.description}</div>
              <div className="text-xs text-gray-400 text-center mt-2">
                <div>Processing: {paymentMethod.processingTime}</div>
                <div>Fee: {paymentMethod.fee}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Secure Payment Badge */}
        <div className="flex items-center justify-center mb-6 bg-gray-50 p-3 rounded-lg">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-gray-600">Secure Payment - PCI DSS Compliant</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {method === 'card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardDetails?.number}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500 ${
                      touched.cardNumber && !validation.cardNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={touched.cardNumber && !validation.cardNumber}
                    aria-describedby="cardNumber-error"
                  />
                  {formData.cardDetails?.type && (
                    <div className="absolute right-3 top-2.5">
                      <img
                        src={`/images/${formData.cardDetails.type}.svg`}
                        alt={formData.cardDetails.type}
                        className="h-6"
                      />
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <p id="cardNumber-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    name="cardExpiry"
                    value={formData.cardDetails?.expiry}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500 ${
                      touched.cardExpiry && !validation.cardExpiry ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={touched.cardExpiry && !validation.cardExpiry}
                    aria-describedby="cardExpiry-error"
                  />
                  {errors.cardExpiry && (
                    <p id="cardExpiry-error" className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.cardExpiry}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-gray-500 group relative"
                      aria-label="Aide CVV"
                    >
                      <HelpCircle className="inline-block h-4 w-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="bg-white p-2 rounded shadow-lg border text-xs w-48">
                          <img
                            src="/images/cvv-help.png"
                            alt="Emplacement du code CVV"
                            className="mb-1"
                          />
                          <p>Le code CVV se trouve au dos de votre carte</p>
                        </div>
                      </div>
                    </button>
                  </label>
                  <input
                    type="password"
                    name="cardCvv"
                    value={formData.cardDetails?.cvv}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500 ${
                      touched.cardCvv && !validation.cardCvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={touched.cardCvv && !validation.cardCvv}
                    aria-describedby="cardCvv-error"
                  />
                  {errors.cardCvv && (
                    <p id="cardCvv-error" className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.cardCvv}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du titulaire
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardDetails?.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="JOHN DOE"
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500 ${
                    touched.cardName && !validation.cardName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-invalid={touched.cardName && !validation.cardName}
                  aria-describedby="cardName-error"
                />
                {errors.cardName && (
                  <p id="cardName-error" className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cardName}
                  </p>
                )}
              </div>
            </>
          )}

          {method === 'mobile' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opérateur
                </label>
                <select
                  name="provider"
                  value={formData.mobileDetails?.provider}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                >
                  {MOBILE_PROVIDERS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.mobileDetails?.phone}
                  onChange={handleInputChange}
                  placeholder="+243..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </>
          )}

          {method === 'bank' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Informations bancaires</h3>
              <div className="space-y-2">
                <p><span className="text-gray-600">Titulaire :</span> IML Auto SARL</p>
                <p><span className="text-gray-600">Banque :</span> Rawbank</p>
                <p><span className="text-gray-600">Numéro de compte :</span> 00000-00000-00000</p>
                <p><span className="text-gray-600">Code SWIFT :</span> RAWBCDKI</p>
                <p><span className="text-gray-600">Référence :</span> {`REF-${Date.now()}`}</p>
              </div>
            </div>
          )}

          {method === 'paypal' && (
            <div className="text-center p-4">
              <p className="text-gray-600 mb-4">
                Vous allez être redirigé vers PayPal pour finaliser votre paiement
              </p>
              <img
                src="/images/paypal-button.png"
                alt="PayPal"
                className="mx-auto"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
            <Button
              variant="secondary"
              type="button"
              onClick={onCancel}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              fullWidth
              disabled={method === 'card' && !isFormValid()}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirmer le paiement'}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Accepted Currencies */}
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Accepted Currencies</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">EUR</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs">USD</span>
          </div>
      </div>
    </div>
  );
}