import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  Check,
  DollarSign,
  FileText,
  Loader,
  Plus,
  Save,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Button from './Button';

// Types for vehicle registration
interface VehicleFormData {
  // Basic Information
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  color: string;
  license_plate: string;
  vin: string;

  // Specifications
  engine_type: string;
  fuel_type: string;
  transmission: string;
  seats: number;
  doors: number;
  mileage: number;

  // Pricing
  daily_rate: number;
  weekly_discount: number;
  monthly_discount: number;
  seasonal_rates: SeasonalRate[];
  security_deposit: number;

  // Status & Location
  rental_status: 'available' | 'rented' | 'maintenance' | 'retired';
  current_location: string;
  home_location: string;

  // Description & Features
  description: string;
  features: string[];
  safety_features: string[];
  comfort_features: string[];

  // Images
  images: VehicleImage[];

  // Insurance & Documentation
  insurance_policy: string;
  registration_expiry: string;
  last_service_date: string;
  next_service_due: string;
}

interface SeasonalRate {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  rate_multiplier: number;
  description: string;
}

interface VehicleImage {
  id: string;
  url: string;
  title: string;
  is_primary: boolean;
  order: number;
}

const categories = [
  {
    value: 'economic',
    label: 'Économique',
    description: 'Véhicules abordables pour usage quotidien',
  },
  {
    value: 'luxury',
    label: 'Luxe',
    description: 'Véhicules premium avec services haut de gamme',
  },
  {
    value: 'suv',
    label: 'SUV',
    description: 'Véhicules spacieux pour familles et groupes',
  },
  {
    value: 'utility',
    label: 'Utilitaire',
    description: 'Véhicules pour transport de marchandises',
  },
];

const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const transmissionTypes = ['Manuelle', 'Automatique', 'CVT'];
const engineTypes = [
  '4 cylindres',
  '6 cylindres',
  'V8',
  'Électrique',
  'Hybride',
];

const steps = [
  { id: 'basic', title: 'Informations de base', icon: Car },
  { id: 'specs', title: 'Spécifications', icon: Settings },
  { id: 'pricing', title: 'Tarification', icon: DollarSign },
  { id: 'features', title: 'Caractéristiques', icon: FileText },
  { id: 'images', title: 'Photos', icon: Camera },
  { id: 'review', title: 'Révision', icon: Check },
];

interface VehicleRegistrationProps {
  onClose: () => void;
  onSuccess: (vehicle: any) => void;
  editingVehicle?: any;
}

const VehicleRegistration: React.FC<VehicleRegistrationProps> = ({
  onClose,
  onSuccess,
  editingVehicle,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Initialize form data
  const [formData, setFormData] = useState<VehicleFormData>({
    // Basic Information
    name: editingVehicle?.name || '',
    make: editingVehicle?.make || '',
    model: editingVehicle?.model || '',
    year: editingVehicle?.year || new Date().getFullYear(),
    category: editingVehicle?.category || 'economic',
    color: editingVehicle?.color || '',
    license_plate: editingVehicle?.license_plate || '',
    vin: editingVehicle?.vin || '',

    // Specifications
    engine_type: editingVehicle?.engine_type || '',
    fuel_type: editingVehicle?.fuel_type || 'Essence',
    transmission: editingVehicle?.transmission || 'Manuelle',
    seats: editingVehicle?.seats || 5,
    doors: editingVehicle?.doors || 4,
    mileage: editingVehicle?.mileage || 0,

    // Pricing
    daily_rate: editingVehicle?.daily_rate || 0,
    weekly_discount: editingVehicle?.weekly_discount || 10,
    monthly_discount: editingVehicle?.monthly_discount || 20,
    seasonal_rates: editingVehicle?.seasonal_rates || [],
    security_deposit: editingVehicle?.security_deposit || 500,

    // Status & Location
    rental_status: editingVehicle?.rental_status || 'available',
    current_location: editingVehicle?.current_location || '',
    home_location: editingVehicle?.home_location || '',

    // Description & Features
    description: editingVehicle?.description || '',
    features: editingVehicle?.features || [],
    safety_features: editingVehicle?.safety_features || [],
    comfort_features: editingVehicle?.comfort_features || [],

    // Images
    images: editingVehicle?.images || [],

    // Insurance & Documentation
    insurance_policy: editingVehicle?.insurance_policy || '',
    registration_expiry: editingVehicle?.registration_expiry || '',
    last_service_date: editingVehicle?.last_service_date || '',
    next_service_due: editingVehicle?.next_service_due || '',
  });

  // Validation for each step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return !!(
          formData.name &&
          formData.make &&
          formData.model &&
          formData.daily_rate > 0
        );
      case 1: // Specifications
        return !!(
          formData.fuel_type &&
          formData.transmission &&
          formData.seats > 0
        );
      case 2: // Pricing
        return formData.daily_rate > 0;
      case 3: // Features
        return true; // Optional step
      case 4: // Images
        return formData.images.length > 0;
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  // Add feature functions
  const addFeature = (
    type: 'features' | 'safety_features' | 'comfort_features'
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ''],
    }));
  };

  const updateFeature = (
    type: 'features' | 'safety_features' | 'comfort_features',
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeFeature = (
    type: 'features' | 'safety_features' | 'comfort_features',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  // Seasonal rate functions
  const addSeasonalRate = () => {
    const newRate: SeasonalRate = {
      id: Date.now().toString(),
      name: '',
      start_date: '',
      end_date: '',
      rate_multiplier: 1.0,
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      seasonal_rates: [...prev.seasonal_rates, newRate],
    }));
  };

  const updateSeasonalRate = (
    index: number,
    field: keyof SeasonalRate,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      seasonal_rates: prev.seasonal_rates.map((rate, i) =>
        i === index ? { ...rate, [field]: value } : rate
      ),
    }));
  };

  const removeSeasonalRate = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      seasonal_rates: prev.seasonal_rates.filter((_, i) => i !== index),
    }));
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingImages(true);
    setError(null);

    try {
      const uploadedImages: VehicleImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const filePath = `vehicle-images/${fileName}`;

        // Upload to Supabase Storage (this is a placeholder - you'd need to set up storage)
        // const { data, error } = await supabase.storage
        //   .from('vehicles')
        //   .upload(filePath, file);

        // For now, create a blob URL for preview
        const imageUrl = URL.createObjectURL(file);

        uploadedImages.push({
          id: Date.now().toString() + i,
          url: imageUrl,
          title: file.name,
          is_primary: formData.images.length === 0 && i === 0,
          order: formData.images.length + i,
        });
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (err) {
      setError('Erreur lors du téléchargement des images');
    } finally {
      setUploadingImages(false);
    }
  };

  const setPrimaryImage = (imageId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      })),
    }));
  };

  const removeImage = (imageId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare data for Supabase
      const vehicleData = {
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        category: formData.category,
        color: formData.color,
        license_plate: formData.license_plate,
        vin: formData.vin,
        daily_rate: formData.daily_rate,
        rental_status: formData.rental_status,
        description: formData.description,
        features: formData.features.filter((f) => f.trim()),

        // Additional specifications as JSON
        specifications: {
          engine_type: formData.engine_type,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          seats: formData.seats,
          doors: formData.doors,
          mileage: formData.mileage,
          safety_features: formData.safety_features.filter((f) => f.trim()),
          comfort_features: formData.comfort_features.filter((f) => f.trim()),
        },

        // Pricing information
        pricing: {
          daily_rate: formData.daily_rate,
          weekly_discount: formData.weekly_discount,
          monthly_discount: formData.monthly_discount,
          seasonal_rates: formData.seasonal_rates,
          security_deposit: formData.security_deposit,
        },

        // Location and service info
        location: formData.current_location,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (editingVehicle) {
        // Update existing vehicle
        result = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)
          .select()
          .single();
      } else {
        // Create new vehicle
        result = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onSuccess(result.data);
      onClose();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError('Erreur lors de la sauvegarde du véhicule');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total estimated rate
  const calculateEstimatedRate = (days: number) => {
    let rate = formData.daily_rate * days;

    if (days >= 30) {
      rate *= 1 - formData.monthly_discount / 100;
    } else if (days >= 7) {
      rate *= 1 - formData.weekly_discount / 100;
    }

    return rate;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Informations de base
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Remise mensuelle (%)
                </label>
                <input
                  type='number'
                  value={formData.monthly_discount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthly_discount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min='0'
                  max='50'
                  step='0.1'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                />
              </div>
            </div>

            {/* Pricing Preview */}
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-3'>
                Aperçu des tarifs
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>1 jour:</span>
                  <span className='font-medium ml-2'>
                    {formData.daily_rate.toFixed(2)} €
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>7 jours:</span>
                  <span className='font-medium ml-2'>
                    {calculateEstimatedRate(7).toFixed(2)} €
                  </span>
                  <span className='text-green-600 text-xs ml-1'>
                    (-{formData.weekly_discount}%)
                  </span>
                </div>
                <div>
                  <span className='text-gray-600'>30 jours:</span>
                  <span className='font-medium ml-2'>
                    {calculateEstimatedRate(30).toFixed(2)} €
                  </span>
                  <span className='text-green-600 text-xs ml-1'>
                    (-{formData.monthly_discount}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Seasonal Rates */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  Tarifs saisonniers
                </h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={addSeasonalRate}
                  icon={<Plus className='h-4 w-4' />}
                >
                  Ajouter
                </Button>
              </div>

              <div className='space-y-3'>
                {formData.seasonal_rates.map((rate, index) => (
                  <div
                    key={rate.id}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <input
                        type='text'
                        value={rate.name}
                        onChange={(e) =>
                          updateSeasonalRate(index, 'name', e.target.value)
                        }
                        placeholder='Nom de la saison (ex: Été)'
                        className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                      <div className='flex space-x-2'>
                        <input
                          type='number'
                          value={rate.rate_multiplier}
                          onChange={(e) =>
                            updateSeasonalRate(
                              index,
                              'rate_multiplier',
                              parseFloat(e.target.value)
                            )
                          }
                          step='0.1'
                          min='0.1'
                          max='5'
                          placeholder='Multiplicateur'
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeSeasonalRate(index)}
                          className='text-red-600'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                      <input
                        type='date'
                        value={rate.start_date}
                        onChange={(e) =>
                          updateSeasonalRate(
                            index,
                            'start_date',
                            e.target.value
                          )
                        }
                        className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                      <input
                        type='date'
                        value={rate.end_date}
                        onChange={(e) =>
                          updateSeasonalRate(index, 'end_date', e.target.value)
                        }
                        className='px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                      />
                      <div className='md:col-span-2'>
                        <input
                          type='text'
                          value={rate.description}
                          onChange={(e) =>
                            updateSeasonalRate(
                              index,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder='Description (optionnel)'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.seasonal_rates.length === 0 && (
                  <p className='text-sm text-gray-500 italic text-center py-4'>
                    Aucun tarif saisonnier configuré. Cliquez sur "Ajouter" pour
                    commencer.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3: // Features
        return (
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Caractéristiques et équipements
            </h3>

            {/* General Features */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  Caractéristiques générales
                </h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => addFeature('features')}
                  icon={<Plus className='h-4 w-4' />}
                >
                  Ajouter
                </Button>
              </div>
              <div className='space-y-2'>
                {formData.features.map((feature, index) => (
                  <div key={index} className='flex space-x-2'>
                    <input
                      type='text'
                      value={feature}
                      onChange={(e) =>
                        updateFeature('features', index, e.target.value)
                      }
                      placeholder='Ex: Climatisation, GPS, Bluetooth...'
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFeature('features', index)}
                      className='text-red-600'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {formData.features.length === 0 && (
                  <p className='text-sm text-gray-500 italic'>
                    Aucune caractéristique ajoutée.
                  </p>
                )}
              </div>
            </div>

            {/* Safety Features */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  Équipements de sécurité
                </h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => addFeature('safety_features')}
                  icon={<Plus className='h-4 w-4' />}
                >
                  Ajouter
                </Button>
              </div>
              <div className='space-y-2'>
                {formData.safety_features.map((feature, index) => (
                  <div key={index} className='flex space-x-2'>
                    <input
                      type='text'
                      value={feature}
                      onChange={(e) =>
                        updateFeature('safety_features', index, e.target.value)
                      }
                      placeholder='Ex: ABS, Airbags, ESP...'
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFeature('safety_features', index)}
                      className='text-red-600'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {formData.safety_features.length === 0 && (
                  <p className='text-sm text-gray-500 italic'>
                    Aucun équipement de sécurité ajouté.
                  </p>
                )}
              </div>
            </div>

            {/* Comfort Features */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  Équipements de confort
                </h4>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => addFeature('comfort_features')}
                  icon={<Plus className='h-4 w-4' />}
                >
                  Ajouter
                </Button>
              </div>
              <div className='space-y-2'>
                {formData.comfort_features.map((feature, index) => (
                  <div key={index} className='flex space-x-2'>
                    <input
                      type='text'
                      value={feature}
                      onChange={(e) =>
                        updateFeature('comfort_features', index, e.target.value)
                      }
                      placeholder='Ex: Cuir, Chauffage sièges, Toit ouvrant...'
                      className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFeature('comfort_features', index)}
                      className='text-red-600'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                {formData.comfort_features.length === 0 && (
                  <p className='text-sm text-gray-500 italic'>
                    Aucun équipement de confort ajouté.
                  </p>
                )}
              </div>
            </div>

            {/* Insurance & Documentation */}
            <div className='border-t border-gray-200 pt-6'>
              <h4 className='font-medium text-gray-900 mb-4'>
                Assurance et documentation
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Police d'assurance
                  </label>
                  <input
                    type='text'
                    value={formData.insurance_policy}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        insurance_policy: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                    placeholder='Numéro de police'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Expiration de l'immatriculation
                  </label>
                  <input
                    type='date'
                    value={formData.registration_expiry}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        registration_expiry: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Dernière révision
                  </label>
                  <input
                    type='date'
                    value={formData.last_service_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        last_service_date: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Prochaine révision prévue
                  </label>
                  <input
                    type='date'
                    value={formData.next_service_due}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        next_service_due: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500'
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Images
        return (
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Photos du véhicule
            </h3>

            {/* Image Upload */}
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={(e) =>
                  e.target.files && handleImageUpload(e.target.files)
                }
                className='hidden'
                id='image-upload'
              />
              <label htmlFor='image-upload' className='cursor-pointer'>
                <Upload className='h-12 w-12 mx-auto text-gray-400 mb-4' />
                <p className='text-lg font-medium text-gray-900'>
                  Cliquez pour télécharger des photos
                </p>
                <p className='text-sm text-gray-500'>
                  PNG, JPG, JPEG jusqu'à 10MB chacune
                </p>
              </label>
              {uploadingImages && (
                <div className='mt-4'>
                  <Loader className='h-6 w-6 animate-spin mx-auto text-yellow-400' />
                  <p className='text-sm text-gray-500 mt-2'>
                    Téléchargement en cours...
                  </p>
                </div>
              )}
            </div>

            {/* Image Gallery */}
            {formData.images.length > 0 && (
              <div>
                <h4 className='font-medium text-gray-900 mb-3'>
                  Photos téléchargées ({formData.images.length})
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {formData.images.map((image) => (
                    <div key={image.id} className='relative group'>
                      <img
                        src={image.url}
                        alt={image.title}
                        className='w-full h-32 object-cover rounded-lg border border-gray-200'
                      />

                      {/* Image Controls */}
                      <div className='absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => setPrimaryImage(image.id)}
                          className={`text-white hover:text-yellow-400 ${
                            image.is_primary ? 'text-yellow-400' : ''
                          }`}
                          title={
                            image.is_primary
                              ? 'Photo principale'
                              : 'Définir comme principale'
                          }
                        >
                          <Camera className='h-4 w-4' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeImage(image.id)}
                          className='text-white hover:text-red-400'
                          title='Supprimer'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>

                      {/* Primary Badge */}
                      {image.is_primary && (
                        <div className='absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-medium'>
                          Principale
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.images.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                <Camera className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                <p>Aucune photo téléchargée</p>
                <p className='text-sm'>Au moins une photo est requise</p>
              </div>
            )}
          </div>
        );

      case 5: // Review
        return (
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Révision finale
            </h3>

            <div className='bg-gray-50 rounded-lg p-6'>
              <h4 className='font-medium text-gray-900 mb-4'>
                Résumé du véhicule
              </h4>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Informations de base
                  </h5>
                  <div className='space-y-1 text-sm'>
                    <p>
                      <span className='text-gray-600'>Nom:</span>{' '}
                      {formData.name}
                    </p>
                    <p>
                      <span className='text-gray-600'>Véhicule:</span>{' '}
                      {formData.make} {formData.model} {formData.year}
                    </p>
                    <p>
                      <span className='text-gray-600'>Catégorie:</span>{' '}
                      {
                        categories.find((c) => c.value === formData.category)
                          ?.label
                      }
                    </p>
                    <p>
                      <span className='text-gray-600'>Couleur:</span>{' '}
                      {formData.color || 'Non spécifiée'}
                    </p>
                    <p>
                      <span className='text-gray-600'>Plaque:</span>{' '}
                      {formData.license_plate || 'Non spécifiée'}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Spécifications
                  </h5>
                  <div className='space-y-1 text-sm'>
                    <p>
                      <span className='text-gray-600'>Carburant:</span>{' '}
                      {formData.fuel_type}
                    </p>
                    <p>
                      <span className='text-gray-600'>Transmission:</span>{' '}
                      {formData.transmission}
                    </p>
                    <p>
                      <span className='text-gray-600'>Places:</span>{' '}
                      {formData.seats}
                    </p>
                    <p>
                      <span className='text-gray-600'>Portes:</span>{' '}
                      {formData.doors}
                    </p>
                    <p>
                      <span className='text-gray-600'>Kilométrage:</span>{' '}
                      {formData.mileage.toLocaleString()} km
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Tarification
                  </h5>
                  <div className='space-y-1 text-sm'>
                    <p>
                      <span className='text-gray-600'>Tarif journalier:</span>{' '}
                      {formData.daily_rate.toFixed(2)} €
                    </p>
                    <p>
                      <span className='text-gray-600'>Remise 7 jours:</span>{' '}
                      {formData.weekly_discount}%
                    </p>
                    <p>
                      <span className='text-gray-600'>Remise 30 jours:</span>{' '}
                      {formData.monthly_discount}%
                    </p>
                    <p>
                      <span className='text-gray-600'>Caution:</span>{' '}
                      {formData.security_deposit.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Statut et localisation
                  </h5>
                  <div className='space-y-1 text-sm'>
                    <p>
                      <span className='text-gray-600'>Statut:</span>{' '}
                      {formData.rental_status}
                    </p>
                    <p>
                      <span className='text-gray-600'>Localisation:</span>{' '}
                      {formData.current_location || 'Non spécifiée'}
                    </p>
                    <p>
                      <span className='text-gray-600'>Photos:</span>{' '}
                      {formData.images.length} téléchargée(s)
                    </p>
                  </div>
                </div>
              </div>

              {formData.features.length > 0 && (
                <div className='mt-4'>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Caractéristiques principales
                  </h5>
                  <div className='flex flex-wrap gap-2'>
                    {formData.features.slice(0, 5).map((feature, index) => (
                      <span
                        key={index}
                        className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                      >
                        {feature}
                      </span>
                    ))}
                    {formData.features.length > 5 && (
                      <span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full'>
                        +{formData.features.length - 5} autres
                      </span>
                    )}
                  </div>
                </div>
              )}

              {formData.description && (
                <div className='mt-4'>
                  <h5 className='font-medium text-gray-700 mb-2'>
                    Description
                  </h5>
                  <p className='text-sm text-gray-600'>
                    {formData.description}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-center'>
                  <AlertCircle className='h-5 w-5 text-red-400 mr-2' />
                  <span className='text-red-700'>{error}</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
      <div className='bg-white rounded-lg w-full max-w-4xl my-4'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {editingVehicle
                ? 'Modifier le véhicule'
                : 'Enregistrer un nouveau véhicule'}
            </h2>
            <Button
              variant='ghost'
              onClick={onClose}
              icon={<X className='h-5 w-5' />}
            />
          </div>

          {/* Progress Steps */}
          <div className='mt-4'>
            <div className='flex items-center space-x-4 overflow-x-auto'>
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isValid = validateStep(index);

                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                      isActive
                        ? 'bg-yellow-100 text-yellow-800'
                        : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <StepIcon className='h-4 w-4' />
                    <span className='text-sm font-medium'>{step.title}</span>
                    {isActive && !isValid && (
                      <AlertCircle className='h-4 w-4 text-red-500' />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 max-h-96 overflow-y-auto'>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
          <div className='flex space-x-3'>
            <Button
              variant='secondary'
              onClick={prevStep}
              disabled={currentStep === 0}
              icon={<ArrowLeft className='h-4 w-4' />}
            >
              Précédent
            </Button>
          </div>

          <div className='text-sm text-gray-500'>
            Étape {currentStep + 1} sur {steps.length}
          </div>

          <div className='flex space-x-3'>
            {currentStep === steps.length - 1 ? (
              <Button
                variant='primary'
                onClick={handleSubmit}
                loading={loading}
                disabled={loading || !validateStep(currentStep)}
                icon={<Save className='h-4 w-4' />}
              >
                {editingVehicle ? 'Mettre à jour' : 'Enregistrer le véhicule'}
              </Button>
            ) : (
              <Button
                variant='primary'
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                icon={<ArrowRight className='h-4 w-4' />}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistration;
