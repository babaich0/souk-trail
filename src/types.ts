export type Language = 'en' | 'fr' | 'ar';

export interface UserProfile {
  id: string; // matches auth.users.id
  display_name: string;
  whatsapp_number: string; // e.g., +212612345678 or 0612345678
  region: string;
  preferred_language: Language;
  created_at?: string;
}

export type CategoryType = 'tent' | 'backpack' | 'sleeping_bag' | 'cooking' | 'clothing' | 'footwear' | 'electronics' | 'other';

export type ConditionType = 'new' | 'used';

export type ListingStatus = 'available' | 'sold';

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: CategoryType;
  condition: ConditionType;
  price: number;
  currency: string; // default 'MAD'
  region: string;
  status: ListingStatus;
  created_at: string;
  // Joins
  seller?: UserProfile;
  photos?: ListingPhoto[];
}

export interface ListingPhoto {
  id: string;
  listing_id: string;
  storage_url: string;
  uploaded_at?: string;
}

export interface Report {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  created_at?: string;
}
