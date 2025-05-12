import { Car } from 'lucide-react';

export interface Vehicle {
  id: number;
  name: string;
  category: VehicleCategory;
  price: number;
  image: string;
  description: string;
  features: string[];
  vin?: string;
  status?: {
    state: 'in_service' | 'maintenance' | 'rented' | 'out_of_service';
    reason?: string;
    expectedReturnDate?: string;
  };
  specifications: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
    fuelEfficiency?: string;
    seating?: number;
    luggage?: string;
  };
  marketSegment: string;
  advantages: string[];
  disadvantages: string[];
  commonUses: string[];
  rating: number;
  reviews: number;
  available: boolean;
}

export type VehicleCategory = 'Van' | 'SUV' | 'Luxe SUV' | 'Berline';

export const categories: VehicleCategory[] = ['Van', 'SUV', 'Luxe SUV', 'Berline'];

export const vehicles: Vehicle[] = [
  // Berlines
  {
    id: 1,
    name: 'Audi A8',
    vin: 'WAUV24B23N1234567',
    category: 'Berline',
    price: 220,
    image: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&q=60&w=800',
    description: 'Le summum du confort et de la technologie',
    status: {
      state: 'in_service'
    },
    features: [
      '5 places',
      'Climatisation quadri-zone',
      'GPS avec réalité augmentée',
      'Sièges massants',
      'Système audio Bang & Olufsen',
      'Assistant de conduite autonome'
    ],
    rating: 4.9,
    reviews: 18,
    available: true,
  },
  {
    id: 2,
    name: 'Mercedes-Benz Classe E',
    vin: 'WDDZF4JB5LA123456',
    category: 'Berline',
    price: 180,
    image: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=60&w=800',
    description: 'Élégance et confort pour vos déplacements professionnels',
    status: {
      state: 'maintenance',
      reason: 'Révision programmée',
      expectedReturnDate: '2024-03-20'
    },
    features: [
      '5 places',
      'Climatisation',
      'GPS',
      'Sièges en cuir',
      'Système audio premium',
      'Régulateur de vitesse adaptatif'
    ],
    rating: 4.8,
    reviews: 15,
    available: true,
  },
  {
    id: 3,
    name: 'BMW Série 7',
    vin: 'WBA7U2C08BCX12345',
    category: 'Berline',
    price: 250,
    image: 'https://images.unsplash.com/photo-1635769444271-50a516cc3673?auto=format&fit=crop&q=60&w=800',
    description: 'Performance et luxe pour une conduite dynamique',
    status: {
      state: 'rented',
      expectedReturnDate: '2024-03-18'
    },
    features: [
      '5 places',
      'Climatisation',
      'GPS',
      'Système audio premium',
      'Toit panoramique',
      'Massage sièges avant'
    ],
    rating: 4.7,
    reviews: 12,
    available: true,
  },

  // SUVs
  {
    id: 4,
    name: 'Mercedes-Benz GLE',
    category: 'SUV',
    price: 220,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=2000',
    description: 'SUV premium alliant confort et polyvalence',
    features: [
      '7 places',
      'Climatisation',
      'GPS',
      'Transmission 4x4',
      'Toit ouvrant panoramique',
      'Pack AMG Line'
    ],
    rating: 4.9,
    reviews: 18,
    available: true,
  },
  {
    id: 5,
    name: 'Range Rover Sport',
    category: 'SUV',
    price: 280,
    image: 'https://images.unsplash.com/photo-1669224288162-d90a6f40f71f?auto=format&fit=crop&q=60&w=800',
    description: 'L\'excellence britannique en format SUV',
    features: [
      '7 places',
      'Climatisation',
      'GPS',
      'Système audio Meridian',
      'Assistance au stationnement',
      'Suspension pneumatique'
    ],
    rating: 4.8,
    reviews: 14,
    available: true,
  },

  // Luxe
  {
    id: 6,
    name: 'Mercedes-Benz S-Class',
    category: 'Luxe',
    price: 450,
    image: 'https://images.unsplash.com/photo-1621019333662-26380628ce46?auto=format&fit=crop&q=60&w=800',
    description: 'Le summum du luxe automobile',
    features: [
      '4 places',
      'Climatisation quadri-zone',
      'GPS',
      'Sièges massants',
      'Chauffeur disponible',
      'Mini-bar et champagne'
    ],
    rating: 5.0,
    reviews: 25,
    available: true,
  },
  {
    id: 7,
    name: 'Rolls-Royce Ghost',
    category: 'Luxe',
    price: 800,
    image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&q=60&w=800',
    description: 'L\'alliance parfaite entre luxe et technologie',
    features: [
      '4 places',
      'Climatisation quadri-zone',
      'GPS',
      'Starlight Headliner',
      'Système de divertissement arrière',
      'Service de chauffeur dédié'
    ],
    rating: 4.9,
    reviews: 22,
    available: true,
  },

  // Vans
  {
    id: 8,
    name: 'Mercedes-Benz V-Class',
    category: 'Van',
    price: 280,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=60&w=800',
    description: 'Le transport de groupe version premium',
    features: [
      '8 places',
      'Climatisation',
      'GPS',
      'Configuration Business',
      'Tables de travail',
      'Prises électriques',
      'Wi-Fi embarqué'
    ],
    rating: 4.7,
    reviews: 15,
    available: true,
  },
  {
    id: 9,
    name: 'Mercedes-Benz Sprinter VIP',
    category: 'Van',
    price: 320,
    image: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&q=60&w=800',
    description: 'Polyvalence et confort pour vos déplacements en groupe',
    features: [
      '12 places',
      'Climatisation',
      'GPS',
      'Sièges modulables',
      'Portes coulissantes électriques',
      'Caméra de recul',
      'Configuration VIP'
    ],
    rating: 4.6,
    reviews: 12,
    available: true,
  },
  {
    id: 10,
    name: 'Volkswagen Multivan Business',
    category: 'Van',
    price: 200,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=60&w=800',
    description: 'Le van parfait pour les déplacements professionnels',
    features: [
      '7 places',
      'Configuration business',
      'Tables de travail',
      'Wi-Fi embarqué',
      'Prises USB et 220V',
      'Climatisation tri-zone',
      'Sièges pivotants'
    ],
    rating: 4.7,
    reviews: 14,
    available: true,
  },
  {
    id: 11,
    name: 'Toyota Alphard',
    category: 'Van',
    price: 280,
    image: 'https://images.unsplash.com/photo-1632183715740-8d21fdc73313?auto=format&fit=crop&q=80&w=1600',
    description: 'Le summum du luxe en format van, parfait pour les voyages d\'affaires en groupe',
    features: [
      '7-8 places',
      'Sièges capitaine en cuir',
      'Climatisation tri-zone',
      'Portes coulissantes électriques',
      'Système audio premium',
      'Tables de travail intégrées'
    ],
    specifications: {
      engine: '3.5L V6',
      transmission: 'Automatique 8 vitesses',
      fuelType: 'Essence',
      fuelEfficiency: '9.5L/100km',
      seating: 7,
      luggage: '500L'
    },
    marketSegment: 'Premium Business / Familial luxe',
    advantages: [
      'Confort exceptionnel',
      'Espace intérieur généreux',
      'Équipement luxueux',
      'Silence de roulement'
    ],
    disadvantages: [
      'Consommation élevée',
      'Dimensions imposantes',
      'Prix élevé'
    ],
    commonUses: [
      'Transport VIP',
      'Voyages d\'affaires en groupe',
      'Familles nombreuses',
      'Events corporate'
    ],
    rating: 4.8,
    reviews: 15,
    available: true
  },
  {
    id: 12,
    name: 'Toyota Noah',
    category: 'Van',
    price: 220,
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=2000',
    description: 'Van familial polyvalent offrant un excellent rapport qualité-prix',
    features: [
      '8 places',
      'Climatisation automatique',
      'Portes coulissantes',
      'Caméra de recul',
      'Connectivité Bluetooth',
      'Rangements multiples'
    ],
    specifications: {
      engine: '2.0L 4 cylindres',
      transmission: 'CVT',
      fuelType: 'Essence',
      fuelEfficiency: '7.8L/100km',
      seating: 8,
      luggage: '400L'
    },
    marketSegment: 'Familial / Transport de groupe',
    advantages: [
      'Excellent rapport qualité-prix',
      'Faible consommation',
      'Fiabilité Toyota',
      'Modularité'
    ],
    disadvantages: [
      'Finitions moins luxueuses que l\'Alphard',
      'Performances modestes',
      'Design plus utilitaire'
    ],
    commonUses: [
      'Transport familial',
      'Petits groupes',
      'Usage quotidien',
      'Transport de bagages'
    ],
    rating: 4.6,
    reviews: 12,
    available: true
  },

  // SUVs
  {
    id: 13,
    name: 'Toyota RAV4',
    category: 'SUV',
    price: 180,
    image: 'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&q=80&w=1600',
    description: 'SUV compact polyvalent, alliance parfaite entre confort et praticité',
    features: [
      '5 places',
      'Apple CarPlay/Android Auto',
      'Caméra 360°',
      'Système de sécurité Toyota Safety Sense',
      'Hayon électrique',
      'Mode tout-terrain'
    ],
    specifications: {
      engine: '2.5L Hybrid',
      transmission: 'CVT',
      fuelType: 'Hybride',
      fuelEfficiency: '5.7L/100km',
      seating: 5,
      luggage: '580L'
    },
    marketSegment: 'SUV Compact Premium',
    advantages: [
      'Excellente économie de carburant',
      'Fiabilité reconnue',
      'Équipement complet',
      'Bon comportement routier'
    ],
    disadvantages: [
      'Design intérieur conservateur',
      'Insonorisation moyenne',
      'Prix des options'
    ],
    commonUses: [
      'Usage quotidien',
      'Voyages en famille',
      'Activités de plein air',
      'Trajets urbains'
    ],
    rating: 4.7,
    reviews: 18,
    available: true
  },
  {
    id: 14,
    name: 'Toyota Rush',
    category: 'SUV',
    price: 150,
    image: 'https://images.unsplash.com/photo-1661956602153-23384936a1d3?auto=format&fit=crop&q=80&w=2000',
    description: 'SUV compact urbain avec capacités tout-terrain',
    features: [
      '7 places',
      'Climatisation',
      'Caméra de recul',
      'Bluetooth',
      'Contrôle de stabilité',
      'ABS avec EBD'
    ],
    specifications: {
      engine: '1.5L 4 cylindres',
      transmission: 'Automatique 4 vitesses',
      fuelType: 'Essence',
      fuelEfficiency: '6.7L/100km',
      seating: 7,
      luggage: '400L'
    },
    marketSegment: 'SUV Compact Économique',
    advantages: [
      'Prix accessible',
      'Position de conduite surélevée',
      '7 places disponibles',
      'Faible consommation'
    ],
    disadvantages: [
      'Finitions basiques',
      'Performances limitées',
      'Confort routier moyen'
    ],
    commonUses: [
      'Transport familial',
      'Usage urbain',
      'Petits trajets',
      'Budget limité'
    ],
    rating: 4.3,
    reviews: 14,
    available: true
  },
  {
    id: 15,
    name: 'Nissan X-Trail',
    category: 'SUV',
    price: 190,
    image: 'https://images.unsplash.com/photo-1609563193716-4c6c6d0fd2c7?auto=format&fit=crop&q=80&w=1600',
    description: 'SUV familial polyvalent avec d\'excellentes capacités tout-terrain',
    features: [
      '5-7 places',
      'ProPILOT Assist',
      'Système audio Bose',
      'Toit panoramique',
      'Navigation connectée',
      'Mode tout-terrain intelligent'
    ],
    specifications: {
      engine: '2.5L 4 cylindres',
      transmission: 'CVT',
      fuelType: 'Essence',
      fuelEfficiency: '7.1L/100km',
      seating: 7,
      luggage: '565L'
    },
    marketSegment: 'SUV Familial Premium',
    advantages: [
      'Excellent confort',
      'Technologies avancées',
      'Modularité intérieure',
      'Capacités tout-terrain'
    ],
    disadvantages: [
      'Consommation en usage urbain',
      'Boîte CVT peu sportive',
      'Prix avec options'
    ],
    commonUses: [
      'Famille nombreuse',
      'Longs trajets',
      'Activités outdoor',
      'Usage polyvalent'
    ],
    rating: 4.6,
    reviews: 16,
    available: true
  },

  // Luxury SUVs
  {
    id: 16,
    name: 'Toyota Land Cruiser',
    category: 'Luxe SUV',
    price: 350,
    image: 'https://images.unsplash.com/photo-1675707255512-3070d4bd0552?auto=format&fit=crop&q=80&w=1600',
    description: 'Le SUV légendaire alliant luxe et capacités tout-terrain exceptionnelles',
    features: [
      '7 places',
      'Système Multi-Terrain',
      'Suspension adaptative',
      'Intérieur cuir premium',
      'Système audio JBL',
      'Climatisation 4 zones'
    ],
    specifications: {
      engine: '3.5L V6 Twin-Turbo',
      transmission: 'Automatique 10 vitesses',
      fuelType: 'Essence',
      fuelEfficiency: '10.5L/100km',
      seating: 7,
      luggage: '700L'
    },
    marketSegment: 'SUV Luxe Premium',
    advantages: [
      'Capacités tout-terrain exceptionnelles',
      'Qualité de fabrication',
      'Confort royal',
      'Fiabilité légendaire'
    ],
    disadvantages: [
      'Prix élevé',
      'Consommation importante',
      'Dimensions imposantes'
    ],
    commonUses: [
      'VIP transport',
      'Expéditions',
      'Usage familial luxe',
      'Représentation'
    ],
    rating: 4.9,
    reviews: 22,
    available: true
  },
  {
    id: 17,
    name: 'Toyota Fortuner',
    category: 'Luxe SUV',
    price: 280,
    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80&w=2000',
    description: 'SUV robuste et luxueux, parfait pour les terrains difficiles',
    features: [
      '7 places',
      'Système 4x4',
      'Intérieur cuir',
      'Caméra 360°',
      'Navigation',
      'Contrôle de descente'
    ],
    specifications: {
      engine: '2.8L Turbodiesel',
      transmission: 'Automatique 6 vitesses',
      fuelType: 'Diesel',
      fuelEfficiency: '8.2L/100km',
      seating: 7,
      luggage: '600L'
    },
    marketSegment: 'SUV Premium Polyvalent',
    advantages: [
      'Excellent rapport qualité-prix',
      'Robustesse',
      'Confort',
      'Polyvalence'
    ],
    disadvantages: [
      'Moins luxueux que le Land Cruiser',
      'Dynamique routière moyenne',
      'Bruit moteur diesel'
    ],
    commonUses: [
      'Usage familial',
      'Tout-terrain',
      'Transport professionnel',
      'Longs trajets'
    ],
    rating: 4.7,
    reviews: 19,
    available: true
  },
  {
    id: 18,
    name: 'Toyota Prado GLX',
    category: 'Luxe SUV',
    price: 320,
    image: 'https://images.unsplash.com/photo-1650371665544-f5e6c8c44cd9?auto=format&fit=crop&q=80&w=2000',
    description: 'SUV luxueux combinant confort et capacités tout-terrain',
    features: [
      '7 places',
      'KDSS (Système de Stabilisation Dynamique)',
      'Multi-terrain Select',
      'Cuir premium',
      'Toit ouvrant',
      'JBL Audio'
    ],
    specifications: {
      engine: '2.8L Turbodiesel',
      transmission: 'Automatique 6 vitesses',
      fuelType: 'Diesel',
      fuelEfficiency: '8.0L/100km',
      seating: 7,
      luggage: '620L'
    },
    marketSegment: 'SUV Luxe Aventurier',
    advantages: [
      'Excellent compromis luxe/tout-terrain',
      'Confort de conduite',
      'Équipement complet',
      'Fiabilité'
    ],
    disadvantages: [
      'Prix élevé',
      'Consommation en ville',
      'Technologie vieillissante'
    ],
    commonUses: [
      'Famille',
      'Aventure',
      'Business',
      'Longs trajets'
    ],
    rating: 4.8,
    reviews: 20,
    available: true
  },
  {
    id: 19,
    name: 'Mercedes-Benz GLE',
    category: 'Luxe SUV',
    price: 400,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=2000',
    description: 'SUV premium allemand, référence du luxe et de la technologie',
    features: [
      '5-7 places',
      'MBUX avec IA',
      'Suspension pneumatique',
      'Sièges massants',
      'Burmester Audio',
      'Conduite semi-autonome'
    ],
    specifications: {
      engine: '3.0L 6 cylindres',
      transmission: '9G-TRONIC',
      fuelType: 'Essence/Hybride',
      fuelEfficiency: '8.5L/100km',
      seating: 5,
      luggage: '630L'
    },
    marketSegment: 'SUV Ultra Premium',
    advantages: [
      'Technologie de pointe',
      'Confort exceptionnel',
      'Prestige de la marque',
      'Performances'
    ],
    disadvantages: [
      'Prix très élevé',
      'Coût d\'entretien',
      'Complexité technologique'
    ],
    commonUses: [
      'VIP',
      'Représentation',
      'Famille premium',
      'Business'
    ],
    rating: 4.9,
    reviews: 25,
    available: true
  },

  // Berlines
  {
    id: 20,
    name: 'Toyota Corolla',
    category: 'Berline',
    price: 150,
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&q=80&w=1600',
    description: 'La berline compacte la plus vendue au monde, fiable et économique',
    features: [
      '5 places',
      'Toyota Safety Sense',
      'Apple CarPlay/Android Auto',
      'Caméra de recul',
      'Climatisation auto',
      'LED'
    ],
    specifications: {
      engine: '1.8L Hybrid',
      transmission: 'CVT',
      fuelType: 'Hybride',
      fuelEfficiency: '4.5L/100km',
      seating: 5,
      luggage: '470L'
    },
    marketSegment: 'Berline Compacte',
    advantages: [
      'Excellente économie de carburant',
      'Fiabilité Toyota',
      'Coût d\'entretien bas',
      'Bonne revente'
    ],
    disadvantages: [
      'Performances modestes',
      'Équipement de base limité',
      'Design conservateur'
    ],
    commonUses: [
      'Usage quotidien',
      'Trajets urbains',
      'Premier véhicule',
      'Fleet'
    ],
    rating: 4.7,
    reviews: 30,
    available: true
  },
  {
    id: 21,
    name: 'Toyota Mark X',
    category: 'Berline',
    price: 200,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=2000',
    description: 'Berline sportive premium avec un caractère unique',
    features: [
      '5 places',
      'Sièges sport cuir',
      'Système audio premium',
      'Suspension sport',
      'Jantes 18"',
      'Double échappement'
    ],
    specifications: {
      engine: '3.5L V6',
      transmission: 'Automatique 6 vitesses',
      fuelType: 'Essence',
      fuelEfficiency: '9.8L/100km',
      seating: 5,
      luggage: '480L'
    },
    marketSegment: 'Berline Sport Premium',
    advantages: [
      'Performances élevées',
      'Finitions soignées',
      'Comportement dynamique',
      'Exclusivité'
    ],
    disadvantages: [
      'Consommation élevée',
      'Coût d\'entretien',
      'Disponibilité pièces'
    ],
    commonUses: [
      'Conduite sportive',
      'Business',
      'Usage personnel',
      'Collection'
    ],
    rating: 4.6,
    reviews: 15,
    available: true
  },
  {
    id: 22,
    name: 'Hyundai Elantra',
    category: 'Berline',
    price: 160,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=1600',
    description: 'Berline moderne au design audacieux et bien équipée',
    features: [
      '5 places',
      'Écran tactile 10.25"',
      'CarPlay/Android Auto',
      'Aide à la conduite',
      'Sièges chauffants',
      'Clé digitale'
    ],
    specifications: {
      engine: '2.0L 4 cylindres',
      transmission: 'IVT',
      fuelType: 'Essence',
      fuelEfficiency: '6.7L/100km',
      seating: 5,
      luggage: '450L'
    },
    marketSegment: 'Berline Compacte Premium',
    advantages: [
      'Design moderne',
      'Équipement généreux',
      'Bon rapport qualité-prix',
      'Garantie longue'
    ],
    disadvantages: [
      'Performances moyennes',
      'Confort ferme',
      'Finitions plastiques'
    ],
    commonUses: [
      'Usage quotidien',
      'Trajets urbains',
      'Famille',
      'Pendulaire'
    ],
    rating: 4.5,
    reviews: 22,
    available: true
  }
];