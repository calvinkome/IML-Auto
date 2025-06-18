import {
  AlertCircle,
  Bell,
  CheckCircle,
  DollarSign,
  Download,
  Loader,
  Save,
  Settings,
  Shield,
  Upload,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';

// Types for settings
interface GeneralSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  currency: string;
  timezone: string;
  language: string;
}

interface BusinessSettings {
  defaultRentalDuration: number;
  minimumRentalDuration: number;
  maximumRentalDuration: number;
  advanceBookingDays: number;
  cancellationPolicy: string;
  lateFeePercentage: number;
  securityDepositPercentage: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingConfirmations: boolean;
  paymentReminders: boolean;
  maintenanceAlerts: boolean;
  lowStockAlerts: boolean;
  adminEmailAddress: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: string;
  dataRetentionDays: number;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    companyName: 'IML Auto',
    companyEmail: 'contact@imlauto.com',
    companyPhone: '+243 819 623 320',
    companyAddress: 'Kinshasa, République Démocratique du Congo',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    language: 'fr',
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    defaultRentalDuration: 1,
    minimumRentalDuration: 1,
    maximumRentalDuration: 30,
    advanceBookingDays: 90,
    cancellationPolicy: 'free_24h',
    lateFeePercentage: 10,
    securityDepositPercentage: 20,
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      smsNotifications: false,
      bookingConfirmations: true,
      paymentReminders: true,
      maintenanceAlerts: true,
      lowStockAlerts: true,
      adminEmailAddress: 'admin@imlauto.com',
    });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    backupFrequency: 'daily',
    dataRetentionDays: 365,
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would fetch settings from a dedicated table
      // For now, we'll use default values and potentially store in localStorage
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setGeneralSettings((prev) => ({ ...prev, ...parsed.general }));
        setBusinessSettings((prev) => ({ ...prev, ...parsed.business }));
        setNotificationSettings((prev) => ({
          ...prev,
          ...parsed.notifications,
        }));
        setSystemSettings((prev) => ({ ...prev, ...parsed.system }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // In a real implementation, you would save to Supabase
      // For now, we'll save to localStorage
      const settings = {
        general: generalSettings,
        business: businessSettings,
        notifications: notificationSettings,
        system: systemSettings,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('admin_settings', JSON.stringify(settings));

      setSuccess('Paramètres sauvegardés avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Export settings
  const exportSettings = () => {
    const settings = {
      general: generalSettings,
      business: businessSettings,
      notifications: notificationSettings,
      system: systemSettings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-settings-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import settings
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.general) setGeneralSettings(imported.general);
        if (imported.business) setBusinessSettings(imported.business);
        if (imported.notifications)
          setNotificationSettings(imported.notifications);
        if (imported.system) setSystemSettings(imported.system);
        setSuccess('Paramètres importés avec succès');
      } catch (err) {
        setError("Erreur lors de l'importation");
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'business', label: 'Business', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'Système', icon: Shield },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-4 text-yellow-400' />
          <p className='text-gray-600'>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0'>
        <h1 className='text-3xl font-bold text-gray-900'>Paramètres système</h1>
        <div className='flex space-x-3'>
          <Button
            variant='ghost'
            icon={<Download className='h-4 w-4' />}
            onClick={exportSettings}
          >
            Exporter
          </Button>
          <label className='cursor-pointer'>
            <Button
              variant='ghost'
              icon={<Upload className='h-4 w-4' />}
              as='span'
            >
              Importer
            </Button>
            <input
              type='file'
              accept='.json'
              onChange={importSettings}
              className='hidden'
            />
          </label>
          <Button
            variant='primary'
            icon={<Save className='h-4 w-4' />}
            onClick={saveSettings}
            loading={saving}
          >
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <AlertCircle className='h-5 w-5 text-red-400 mr-2' />
            <span className='text-red-700'>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <CheckCircle className='h-5 w-5 text-green-400 mr-2' />
            <span className='text-green-700'>{success}</span>
          </div>
        </div>
      )}

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Sidebar */}
        <div className='w-full lg:w-64'>
          <nav className='bg-white rounded-lg shadow-md'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-600 bg-yellow-50 border-r-2 border-yellow-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className='h-5 w-5' />
                <span className='font-medium'>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className='flex-1'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            {/* General Settings */}
            {activeTab === 'general' && (
              <div>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Paramètres généraux
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nom de l'entreprise
                    </label>
                    <input
                      type='text'
                      value={generalSettings.companyName}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email de contact
                    </label>
                    <input
                      type='email'
                      value={generalSettings.companyEmail}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          companyEmail: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Téléphone
                    </label>
                    <input
                      type='tel'
                      value={generalSettings.companyPhone}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          companyPhone: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Devise
                    </label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    >
                      <option value='EUR'>Euro ($)</option>
                      <option value='USD'>Dollar US ($)</option>
                      <option value='CDF'>Franc congolais (CDF)</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Fuseau horaire
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    >
                      <option value='Europe/Paris'>Europe/Paris</option>
                      <option value='Africa/Kinshasa'>Africa/Kinshasa</option>
                      <option value='America/New_York'>America/New_York</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Langue
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    >
                      <option value='fr'>Français</option>
                      <option value='en'>English</option>
                    </select>
                  </div>
                </div>

                <div className='mt-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Adresse
                  </label>
                  <textarea
                    value={generalSettings.companyAddress}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        companyAddress: e.target.value,
                      }))
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Paramètres business
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Durée de location par défaut (jours)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.defaultRentalDuration}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          defaultRentalDuration: parseInt(e.target.value),
                        }))
                      }
                      min='1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Durée minimum (jours)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.minimumRentalDuration}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          minimumRentalDuration: parseInt(e.target.value),
                        }))
                      }
                      min='1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Durée maximum (jours)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.maximumRentalDuration}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          maximumRentalDuration: parseInt(e.target.value),
                        }))
                      }
                      min='1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Réservation à l'avance (jours)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.advanceBookingDays}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          advanceBookingDays: parseInt(e.target.value),
                        }))
                      }
                      min='1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Politique d'annulation
                    </label>
                    <select
                      value={businessSettings.cancellationPolicy}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          cancellationPolicy: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    >
                      <option value='free_24h'>Gratuit 24h avant</option>
                      <option value='free_48h'>Gratuit 48h avant</option>
                      <option value='free_7d'>Gratuit 7 jours avant</option>
                      <option value='no_refund'>Aucun remboursement</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Frais de retard (%)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.lateFeePercentage}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          lateFeePercentage: parseFloat(e.target.value),
                        }))
                      }
                      min='0'
                      max='100'
                      step='0.1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Caution (% du montant)
                    </label>
                    <input
                      type='number'
                      value={businessSettings.securityDepositPercentage}
                      onChange={(e) =>
                        setBusinessSettings((prev) => ({
                          ...prev,
                          securityDepositPercentage: parseFloat(e.target.value),
                        }))
                      }
                      min='0'
                      max='100'
                      step='0.1'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Paramètres de notification
                </h2>

                <div className='space-y-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Email administrateur
                    </label>
                    <input
                      type='email'
                      value={notificationSettings.adminEmailAddress}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          adminEmailAddress: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                  </div>

                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      Types de notifications
                    </h3>

                    <div className='space-y-3'>
                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              emailNotifications: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Notifications par email
                          </span>
                          <p className='text-sm text-gray-500'>
                            Activer les notifications par email
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              smsNotifications: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Notifications SMS
                          </span>
                          <p className='text-sm text-gray-500'>
                            Activer les notifications par SMS
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.bookingConfirmations}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              bookingConfirmations: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Confirmations de réservation
                          </span>
                          <p className='text-sm text-gray-500'>
                            Envoyer les confirmations automatiquement
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.paymentReminders}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              paymentReminders: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Rappels de paiement
                          </span>
                          <p className='text-sm text-gray-500'>
                            Rappeler les paiements en attente
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.maintenanceAlerts}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              maintenanceAlerts: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Alertes de maintenance
                          </span>
                          <p className='text-sm text-gray-500'>
                            Notifier pour la maintenance des véhicules
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={notificationSettings.lowStockAlerts}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              lowStockAlerts: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Alertes de stock bas
                          </span>
                          <p className='text-sm text-gray-500'>
                            Notifier quand peu de véhicules disponibles
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div>
                <h2 className='text-xl font-semibold text-gray-900 mb-6'>
                  Paramètres système
                </h2>

                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Timeout de session (minutes)
                      </label>
                      <input
                        type='number'
                        value={systemSettings.sessionTimeout}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            sessionTimeout: parseInt(e.target.value),
                          }))
                        }
                        min='5'
                        max='1440'
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Tentatives de connexion max
                      </label>
                      <input
                        type='number'
                        value={systemSettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            maxLoginAttempts: parseInt(e.target.value),
                          }))
                        }
                        min='3'
                        max='10'
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Fréquence de sauvegarde
                      </label>
                      <select
                        value={systemSettings.backupFrequency}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            backupFrequency: e.target.value,
                          }))
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      >
                        <option value='hourly'>Horaire</option>
                        <option value='daily'>Quotidien</option>
                        <option value='weekly'>Hebdomadaire</option>
                        <option value='monthly'>Mensuel</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Rétention des données (jours)
                      </label>
                      <input
                        type='number'
                        value={systemSettings.dataRetentionDays}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            dataRetentionDays: parseInt(e.target.value),
                          }))
                        }
                        min='30'
                        max='3650'
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      Options système
                    </h3>

                    <div className='space-y-3'>
                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={systemSettings.maintenanceMode}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              maintenanceMode: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Mode maintenance
                          </span>
                          <p className='text-sm text-gray-500'>
                            Désactiver l'accès public au site
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={systemSettings.allowRegistrations}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              allowRegistrations: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Autoriser les inscriptions
                          </span>
                          <p className='text-sm text-gray-500'>
                            Permettre aux nouveaux utilisateurs de s'inscrire
                          </p>
                        </div>
                      </label>

                      <label className='flex items-center space-x-3'>
                        <input
                          type='checkbox'
                          checked={systemSettings.requireEmailVerification}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              requireEmailVerification: e.target.checked,
                            }))
                          }
                          className='h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded'
                        />
                        <div>
                          <span className='font-medium text-gray-900'>
                            Vérification email obligatoire
                          </span>
                          <p className='text-sm text-gray-500'>
                            Exiger la vérification de l'email à l'inscription
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
