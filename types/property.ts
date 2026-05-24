export type PropertyType = '1BHK' | '2BHK' | '3BHK' | 'PG' | 'Room' | 'Independent House';
export type ForWhomType = 'Family' | 'Bachelor' | 'Any';

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  rent: number;
  deposit: number;
  type: PropertyType;
  furnished: boolean;
  for_whom: ForWhomType;
  latitude: number;
  longitude: number;
  address: string;
  photos: string[];
  owner_phone: string;
  available: boolean;
  created_at: string;
  description?: string;
  owner_name?: string;
  amenities?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}
