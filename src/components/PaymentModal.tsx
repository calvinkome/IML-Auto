import React, { useState } from 'react';
import { Phone, Building2, AlertCircle } from 'lucide-react'; // Import missing icons
import Button from './Button'; // Import Button component

interface PaymentModalProps {
  amount: number;
  onClose: () => void;
  onConfirm: (paymentDetails: PaymentDetails) => void;
  title?: string;
}

export interface PaymentDetails {
  method: 'bank' | 'mobile';
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
  };
  mobileDetails?: {
    phoneNumber: string;
    provider: string;
  };
}

export default function PaymentModal({ amount, onClose, onConfirm, title = 'Paiement' }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'mobile'>('mobile');
  const [formData, setFormData] = useState<PaymentDetails>({
    method: 'mobile',
    mobileDetails: {
      phone: '',
      provider: 'mpesa',
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      accountHolder: '',
    },
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'mobile') {
      const { phone } = formData.mobileDetails || {};
      if (!phone) {
        setError('Veuillez entrer un numéro de téléphone valide');
        return;
      }
      const phoneRegex = /^\+?[1-9]\d{8,14}$/;
      if (!phoneRegex.test(phone)) {
        setError('Format de numéro de téléphone invalide');
        return;
      }
    } else {
      const { accountNumber, bankName, accountHolder } = formData.bankDetails || {};
      if (!accountNumber || !bankName || !accountHolder) {
        setError('Veuillez remplir tous les champs bancaires');
        return;
      }
    }

    onConfirm({
      ...formData,
      method: paymentMethod,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [paymentMethod === 'mobile' ? 'mobileDetails' : 'bankDetails']: {
        ...(paymentMethod === 'mobile' ? prev.mobileDetails : prev.bankDetails),
        [name]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">{title} - {amount}€</h2>

        <div className="mb-6">
          <div className="flex space-x-4 mb-6">
            <button
              className={`flex-1 p-4 rounded-lg border-2 ${
                paymentMethod === 'mobile'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200'
              }`}
              onClick={() => setPaymentMethod('mobile')}
              aria-label="Sélectionner Mobile Money"
            >
              <Phone className="h-6 w-6 mb-2 mx-auto text-yellow-600" />
              <div className="text-sm font-medium text-center">Mobile Money</div>
            </button>
            <button
              className={`flex-1 p-4 rounded-lg border-2 ${
                paymentMethod === 'bank'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200'
              }`}
              onClick={() => setPaymentMethod('bank')}
              aria-label="Sélectionner Virement Bancaire"
            >
              <Building2 className="h-6 w-6 mb-2 mx-auto text-yellow-600" />
              <div className="text-sm font-medium text-center">Virement Bancaire</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {paymentMethod === 'mobile' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opérateur Mobile
                  </label>
                  <div className="relative">
                    <select
                      name="provider"
                      value={formData.mobileDetails?.provider}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      aria-label="Sélectionner un opérateur mobile"
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="orange">Orange Money</option>
                    </select>
                  </div>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    aria-label="Entrez votre numéro de téléphone"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la banque
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankDetails?.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    aria-label="Entrez le nom de la banque"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titulaire du compte
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={formData.bankDetails?.accountHolder}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    aria-label="Entrez le titulaire du compte"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de compte
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.bankDetails?.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    aria-label="Entrez le numéro de compte"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={onClose}
                aria-label="Annuler le paiement"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                aria-label="Confirmer le paiement"
              >
                Confirmer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}