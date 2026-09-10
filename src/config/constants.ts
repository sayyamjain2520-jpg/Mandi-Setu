import type { Commodity } from '@/types/procurement.types'
import type { ProcurementCentre } from '@/types/mandi.types'
import type { UserProfile } from '@/types/user.types'

/* =========================================================
   INITIAL COMMODITIES
   ========================================================= */

export const INITIAL_COMMODITIES: Commodity[] = [
  {
    id: 'comm-1',
    code: 'WHEAT-FAQ',
    name: 'Wheat (FAQ Grade)',
    category: 'Cereals',
    variety: 'Sharbati / Lokwan',
    mspPricePerQuintal: 2275.0,
    maxMoisturePercentage: 12.0,
    unit: 'Quintal',
    isActive: true,
  },
  {
    id: 'comm-2',
    code: 'PADDY-GR-A',
    name: 'Paddy (Grade A Basmati)',
    category: 'Cereals',
    variety: '1121 Sugandh',
    mspPricePerQuintal: 2320.0,
    maxMoisturePercentage: 14.0,
    unit: 'Quintal',
    isActive: true,
  },
  {
    id: 'comm-3',
    code: 'MUSTARD-OIL',
    name: 'Mustard Seeds (High Oil)',
    category: 'Oilseeds',
    variety: 'Pusa Bold',
    mspPricePerQuintal: 5650.0,
    maxMoisturePercentage: 8.0,
    unit: 'Quintal',
    isActive: true,
  },
  {
    id: 'comm-4',
    code: 'CHANA-GRAM',
    name: 'Bengal Gram (Chana)',
    category: 'Pulses',
    variety: 'Desi Bold',
    mspPricePerQuintal: 5440.0,
    maxMoisturePercentage: 10.0,
    unit: 'Quintal',
    isActive: true,
  },
  {
    id: 'comm-5',
    code: 'SOYABEAN-Y',
    name: 'Soybean (Yellow)',
    category: 'Oilseeds',
    variety: 'JS-335',
    mspPricePerQuintal: 4892.0,
    maxMoisturePercentage: 10.0,
    unit: 'Quintal',
    isActive: true,
  },
]

/* =========================================================
   PROCUREMENT CENTRES
   IMPORTANT:
   These IDs match the real Supabase UUIDs.
   ========================================================= */

export const INITIAL_CENTRES: ProcurementCentre[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    code: 'RJ-KOTA-01',
    name: 'Kota Bhamashah APMC Mega Yard',
    state: 'Rajasthan',
    district: 'Kota',
    address:
      'Anantpura Industrial Area, Jhalawar Road, Kota, Rajasthan - 324005',
    latitude: 25.1388,
    longitude: 75.8456,
    contactPhone: '+91 744 250123',
    operationalStatus: 'active',
    dailyCapacityQuintals: 12000.0,
    operatingHours: {
      open: '08:00',
      close: '18:30',
    },
    distanceKm: 4.2,
    activeTokensCount: 14,
    avgWaitTimeMinutes: 22,
  },

  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    code: 'MP-SEHORE-02',
    name: 'Sehore Krishi Upaj Mandi',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    address:
      'Bhopal-Indore Bypass Road, Sehore, Madhya Pradesh - 466001',
    latitude: 23.2032,
    longitude: 77.0844,
    contactPhone: '+91 7562 22456',
    operationalStatus: 'active',
    dailyCapacityQuintals: 8500.0,
    operatingHours: {
      open: '08:30',
      close: '18:00',
    },
    distanceKm: 8.7,
    activeTokensCount: 9,
    avgWaitTimeMinutes: 18,
  },

  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    code: 'HR-KARNAL-03',
    name: 'Karnal Grain & Paddy APMC Market',
    state: 'Haryana',
    district: 'Karnal',
    address:
      'New Grain Market, GT Road, Karnal, Haryana - 132001',
    latitude: 29.6857,
    longitude: 76.9905,
    contactPhone: '+91 184 225678',
    operationalStatus: 'active',
    dailyCapacityQuintals: 15000.0,
    operatingHours: {
      open: '07:30',
      close: '19:00',
    },
    distanceKm: 14.5,
    activeTokensCount: 21,
    avgWaitTimeMinutes: 30,
  },

  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    code: 'TS-NZB-04',
    name: 'Nizamabad Agricultural Market Yard',
    state: 'Telangana',
    district: 'Nizamabad',
    address:
      'APMC Complex, Station Road, Nizamabad, Telangana - 503001',
    latitude: 18.6725,
    longitude: 78.0941,
    contactPhone: '+91 8462 23145',
    operationalStatus: 'active',
    dailyCapacityQuintals: 9500.0,
    operatingHours: {
      open: '08:00',
      close: '17:30',
    },
    distanceKm: 19.1,
    activeTokensCount: 6,
    avgWaitTimeMinutes: 15,
  },
]

/* =========================================================
   DEMO PERSONAS
   ========================================================= */

export const DEMO_PERSONAS: Record<
  'farmer' | 'operator' | 'admin',
  UserProfile
> = {
  /* -------------------------------------------------------
     FARMER
     ------------------------------------------------------- */
  farmer: {
    id: 'usr-farmer-sayyam',
    role: 'farmer',
    fullName: 'Sayyam Jain',
    phoneNumber: '+91 9000000000',
    state: 'Telangana',
    district: 'Nizamabad',
    kisanId: 'KCC-TS-2024-8901',
    mandiId: 'a1b2c3d4-0004-4000-8000-000000000004',
    createdAt: '2026-01-15T09:00:00.000Z',
  },

  /* -------------------------------------------------------
     MANDI OPERATOR

     IMPORTANT:
     This MUST be the real Supabase UUID of
     Nizamabad Agricultural Market Yard.
     ------------------------------------------------------- */
  operator: {
    id: 'usr-operator-rajesh',
    role: 'operator',
    fullName: 'Rajesh Kumar Sharma',
    phoneNumber: '+91 94140 56789',

    state: 'Telangana',
    district: 'Nizamabad',

    mandiId: 'a1b2c3d4-0004-4000-8000-000000000004',

    createdAt: '2026-01-10T10:30:00.000Z',
  },

  /* -------------------------------------------------------
     ADMINISTRATOR
     ------------------------------------------------------- */
  admin: {
    id: 'usr-admin-meenakshi',
    role: 'admin',
    fullName: 'Dr. Meenakshi Sundaram (Director)',
    phoneNumber: '+91 98800 11223',
    state: 'Delhi',
    district: 'New Delhi',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
}