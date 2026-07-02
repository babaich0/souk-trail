import { createClient } from '@supabase/supabase-js';
import { UserProfile, Listing, CategoryType, ConditionType, ListingStatus, Report, ListingPhoto } from '../types';

// Read env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we should use the live Supabase client
export const isLiveSupabase = !!(supabaseUrl && supabaseAnonKey);

let supabaseInstance: any = null;
if (isLiveSupabase) {
  try {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (err) {
    console.error("Failed to initialize live Supabase client, using local mock", err);
  }
}

// Ensure local storage keys exist
const LOCAL_USERS_KEY = 'souktrail_users';
const LOCAL_LISTINGS_KEY = 'souktrail_listings';
const LOCAL_REPORTS_KEY = 'souktrail_reports';
const LOCAL_CURRENT_USER_KEY = 'souktrail_current_user';

// Pre-populated realistic listings for Moroccan backpacking
const INITIAL_MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1-tent-quechua',
    seller_id: 'u1-seller-hamza',
    title: 'Quechua MH100 2-Person Camping Tent',
    description: 'Perfect for backpacking in the Atlas Mountains or camping in Tafraout. Used only twice, very clean, no tears or missing stakes. Very lightweight and quick to pitch.',
    category: 'tent',
    condition: 'used',
    price: 450,
    currency: 'MAD',
    region: 'marrakech',
    status: 'available',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u1-seller-hamza',
      display_name: 'Hamza Imlil',
      whatsapp_number: '+212611223344',
      region: 'marrakech',
      preferred_language: 'fr'
    },
    photos: [
      { id: 'p1', listing_id: 'l1-tent-quechua', storage_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80' },
      { id: 'p1_2', listing_id: 'l1-tent-quechua', storage_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 'l2-backpack-deuter',
    seller_id: 'u2-seller-fatima',
    title: 'Deuter Aircontact Pro 60+15L',
    description: 'Heavy duty trekking pack. Excellent load distribution, perfect for multi-day treks like Toubkal or M\'goun. Features integrated rain cover and hydration system sleeve. A few scuffs but overall in excellent condition.',
    category: 'backpack',
    condition: 'used',
    price: 1200,
    currency: 'MAD',
    region: 'rabat',
    status: 'available',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u2-seller-fatima',
      display_name: 'Fatima-Zahra',
      whatsapp_number: '+212655667788',
      region: 'rabat',
      preferred_language: 'en'
    },
    photos: [
      { id: 'p2', listing_id: 'l2-backpack-deuter', storage_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 'l3-cooking-stove',
    seller_id: 'u3-seller-youssef',
    title: 'Ultralight Gas Camping Stove',
    description: 'Brand new pocket-sized stove. Extremely compact, weighs only 45g. Fits standard Moroccan screw-thread gas canisters. High-efficiency burner with piezo ignition. Comes with orange plastic storage box.',
    category: 'cooking',
    condition: 'new',
    price: 180,
    currency: 'MAD',
    region: 'casablanca',
    status: 'available',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u3-seller-youssef',
      display_name: 'Youssef Casa',
      whatsapp_number: '+212677889900',
      region: 'casablanca',
      preferred_language: 'ar'
    },
    photos: [
      { id: 'p3', listing_id: 'l3-cooking-stove', storage_url: 'https://images.unsplash.com/photo-1595123541434-297eb0fc70b8?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 'l4-sleeping-bag',
    seller_id: 'u1-seller-hamza',
    title: 'Forclaz 0°C Trekking Sleeping Bag',
    description: 'Mummy-shape synthetic sleeping bag, comfortable down to 0 degrees Celsius. Essential for high altitude Atlas camps where nights are cold even in summer. Lightweight and compresses small.',
    category: 'sleeping_bag',
    condition: 'used',
    price: 550,
    currency: 'MAD',
    region: 'marrakech',
    status: 'available',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u1-seller-hamza',
      display_name: 'Hamza Imlil',
      whatsapp_number: '+212611223344',
      region: 'marrakech',
      preferred_language: 'fr'
    },
    photos: [
      { id: 'p4', listing_id: 'l4-sleeping-bag', storage_url: 'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 'l5-footwear-salomon',
    seller_id: 'u4-seller-mehdi',
    title: 'Salomon X Ultra 4 Gore-Tex Boots',
    description: 'Size EU 43 / US 9.5. Waterproof Gore-Tex membrane. Exceptional grip with Contagrip sole, perfect for rocky desert tracks or mountain scree. Worn on only one day hike, selling because they are slightly too small for me.',
    category: 'footwear',
    condition: 'used',
    price: 950,
    currency: 'MAD',
    region: 'tangier',
    status: 'available',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u4-seller-mehdi',
      display_name: 'Mehdi Rif',
      whatsapp_number: '+212622998877',
      region: 'tangier',
      preferred_language: 'en'
    },
    photos: [
      { id: 'p5', listing_id: 'l5-footwear-salomon', storage_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 'l6-clothing-jacket',
    seller_id: 'u5-seller-amin',
    title: 'Patagonia Torrentshell 3L Rain Jacket',
    description: 'Size Medium, orange/rust color. 3-layer waterproof, windproof and breathable jacket. Unused gift, still has some original tags. Essential for unpredictable mountain weather.',
    category: 'clothing',
    condition: 'new',
    price: 1400,
    currency: 'MAD',
    region: 'souss',
    status: 'available',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: 'u5-seller-amin',
      display_name: 'Amin Agadir',
      whatsapp_number: '+212644556633',
      region: 'souss',
      preferred_language: 'en'
    },
    photos: [
      { id: 'p6', listing_id: 'l6-clothing-jacket', storage_url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80' }
    ]
  }
];

// Local state initializer helper
const initializeLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(LOCAL_LISTINGS_KEY)) {
    localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(INITIAL_MOCK_LISTINGS));
  }
  if (!localStorage.getItem(LOCAL_USERS_KEY)) {
    const mockUsers: Record<string, UserProfile> = {};
    INITIAL_MOCK_LISTINGS.forEach(listing => {
      if (listing.seller) {
        mockUsers[listing.seller.id] = listing.seller;
      }
    });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(LOCAL_REPORTS_KEY)) {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([]));
  }
};

initializeLocalStorage();

// Standard interface for database actions
export const dbService = {
  // Authentication Actions
  async signInWithGoogleSimulated(email: string, name: string): Promise<UserProfile | null> {
    initializeLocalStorage();
    // In local simulation, we sign in using the provided email as id
    const id = btoa(email).replace(/=/g, '').substring(0, 16);
    
    const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    let profile: UserProfile;
    
    if (users[id]) {
      profile = users[id];
    } else {
      // First-time signup flag (by omitting whatsapp_number/region or setting empty)
      profile = {
        id,
        display_name: name || email.split('@')[0],
        whatsapp_number: '',
        region: '',
        preferred_language: 'en',
        created_at: new Date().toISOString()
      };
      users[id] = profile;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
    
    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  },

  async signInWithPhoneSimulated(phone: string, name: string): Promise<UserProfile | null> {
    initializeLocalStorage();
    // In local simulation, we sign in using the phone number as id
    const id = 'tel_' + btoa(phone).replace(/=/g, '').substring(0, 12);
    
    const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    let profile: UserProfile;
    
    if (users[id]) {
      profile = users[id];
      if (name && profile.display_name !== name) {
        profile.display_name = name;
        users[id] = profile;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }
    } else {
      profile = {
        id,
        display_name: name || `User ${phone.substring(phone.length - 4)}`,
        whatsapp_number: phone,
        region: '',
        preferred_language: 'en',
        created_at: new Date().toISOString()
      };
      users[id] = profile;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }
    
    localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(profile));
    return profile;
  },

  async getSessionUser(): Promise<UserProfile | null> {
    if (isLiveSupabase && supabaseInstance) {
      const { data: { session } } = await supabaseInstance.auth.getSession();
      if (!session) return null;
      
      const { data: profile } = await supabaseInstance
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        return profile as UserProfile;
      } else {
        // Create tentative profile
        return {
          id: session.user.id,
          display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Backpacker',
          whatsapp_number: '',
          region: '',
          preferred_language: 'en'
        };
      }
    } else {
      const stored = localStorage.getItem(LOCAL_CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  },

  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    if (isLiveSupabase && supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('users')
        .upsert({
          id: profile.id,
          display_name: profile.display_name,
          whatsapp_number: profile.whatsapp_number,
          region: profile.region,
          preferred_language: profile.preferred_language,
          created_at: profile.created_at || new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    } else {
      initializeLocalStorage();
      const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      users[profile.id] = { ...profile, created_at: profile.created_at || new Date().toISOString() };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(users[profile.id]));
      
      // Update all local mock listings that are owned by this seller to stay consistent!
      const listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      const updatedListings = listings.map(l => {
        if (l.seller_id === profile.id) {
          return { ...l, seller: users[profile.id] };
        }
        return l;
      });
      localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(updatedListings));
      
      return users[profile.id];
    }
  },

  async signOut(): Promise<void> {
    if (isLiveSupabase && supabaseInstance) {
      await supabaseInstance.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
    }
  },

  // Listings Actions
  async getListings(filters?: {
    category?: CategoryType;
    condition?: ConditionType;
    region?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    sellerId?: string;
  }): Promise<Listing[]> {
    if (isLiveSupabase && supabaseInstance) {
      let query = supabaseInstance
        .from('listings')
        .select('*, seller:users(*), photos:listing_photos(*)')
        .order('created_at', { ascending: false });

      if (filters?.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters?.region) {
        query = query.eq('region', filters.region);
      }
      if (filters?.priceMin !== undefined) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters?.priceMax !== undefined) {
        query = query.lte('price', filters.priceMax);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let results = data as Listing[];
      
      // Perform text search on client-side if a search string is given since web client full text can be complex in Supabase
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        results = results.filter(l => 
          l.title.toLowerCase().includes(term) || 
          l.description.toLowerCase().includes(term)
        );
      }
      
      return results;
    } else {
      initializeLocalStorage();
      let listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      
      // Filter out deleted or sold listings (wait, sold listings should show up but we order them or let filters apply)
      // Sort by created_at descending
      listings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (filters?.sellerId) {
        listings = listings.filter(l => l.seller_id === filters.sellerId);
      }
      if (filters?.category) {
        listings = listings.filter(l => l.category === filters.category);
      }
      if (filters?.condition) {
        listings = listings.filter(l => l.condition === filters.condition);
      }
      if (filters?.region) {
        listings = listings.filter(l => l.region === filters.region);
      }
      if (filters?.priceMin !== undefined && !isNaN(filters.priceMin)) {
        listings = listings.filter(l => l.price >= filters.priceMin!);
      }
      if (filters?.priceMax !== undefined && !isNaN(filters.priceMax)) {
        listings = listings.filter(l => l.price <= filters.priceMax!);
      }
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        listings = listings.filter(l => 
          l.title.toLowerCase().includes(term) || 
          l.description.toLowerCase().includes(term)
        );
      }
      
      return listings;
    }
  },

  async getListingById(id: string): Promise<Listing | null> {
    if (isLiveSupabase && supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('listings')
        .select('*, seller:users(*), photos:listing_photos(*)')
        .eq('id', id)
        .single();
        
      if (error) return null;
      return data as Listing;
    } else {
      initializeLocalStorage();
      const listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      const match = listings.find(l => l.id === id);
      return match || null;
    }
  },

  async createListing(
    listing: Omit<Listing, 'id' | 'created_at' | 'seller' | 'photos'>, 
    photoUrls: string[]
  ): Promise<Listing> {
    if (isLiveSupabase && supabaseInstance) {
      // 1. Insert the listing
      const { data: newListing, error: listingError } = await supabaseInstance
        .from('listings')
        .insert({
          seller_id: listing.seller_id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          condition: listing.condition,
          price: listing.price,
          currency: listing.currency,
          region: listing.region,
          status: 'available'
        })
        .select()
        .single();
        
      if (listingError) throw listingError;
      
      // 2. Insert photos if any
      if (photoUrls.length > 0) {
        const photoRecords = photoUrls.map(url => ({
          listing_id: newListing.id,
          storage_url: url
        }));
        
        const { error: photoError } = await supabaseInstance
          .from('listing_photos')
          .insert(photoRecords);
          
        if (photoError) throw photoError;
      }
      
      // 3. Retrieve fully populated listing
      return await this.getListingById(newListing.id) as Listing;
    } else {
      initializeLocalStorage();
      const listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      
      const newId = 'l-' + Math.random().toString(36).substr(2, 9);
      const listingPhotos: ListingPhoto[] = photoUrls.map((url, index) => ({
        id: `p-${newId}-${index}`,
        listing_id: newId,
        storage_url: url,
        uploaded_at: new Date().toISOString()
      }));
      
      const sellerProfile = users[listing.seller_id] || {
        id: listing.seller_id,
        display_name: 'Backpacker',
        whatsapp_number: '+212600000000',
        region: listing.region,
        preferred_language: 'en'
      };
      
      const newListingRecord: Listing = {
        ...listing,
        id: newId,
        status: 'available',
        created_at: new Date().toISOString(),
        seller: sellerProfile,
        photos: listingPhotos
      };
      
      listings.unshift(newListingRecord);
      localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings));
      return newListingRecord;
    }
  },

  async updateListing(
    id: string, 
    updates: Partial<Omit<Listing, 'id' | 'seller_id' | 'created_at' | 'seller' | 'photos'>>
  ): Promise<Listing> {
    if (isLiveSupabase && supabaseInstance) {
      const { error } = await supabaseInstance
        .from('listings')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
      return await this.getListingById(id) as Listing;
    } else {
      initializeLocalStorage();
      const listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      const index = listings.findIndex(l => l.id === id);
      if (index === -1) throw new Error("Listing not found");
      
      listings[index] = {
        ...listings[index],
        ...updates
      };
      
      localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings));
      return listings[index];
    }
  },

  async deleteListing(id: string): Promise<void> {
    if (isLiveSupabase && supabaseInstance) {
      const { error } = await supabaseInstance
        .from('listings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    } else {
      initializeLocalStorage();
      const listings: Listing[] = JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || '[]');
      const filtered = listings.filter(l => l.id !== id);
      localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(filtered));
    }
  },

  // Upload Photo to Storage Bucket
  async uploadPhoto(file: File, sellerId: string): Promise<string> {
    if (isLiveSupabase && supabaseInstance) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${sellerId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabaseInstance.storage
        .from('listing_photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      const { data } = supabaseInstance.storage
        .from('listing_photos')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } else {
      // Return a simulated image source (either a base64 encoded string or a placeholder outdoor gear image)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  },

  // Report Actions
  async reportListing(listingId: string, reporterId: string, reason: string): Promise<Report> {
    if (isLiveSupabase && supabaseInstance) {
      const { data, error } = await supabaseInstance
        .from('reports')
        .insert({
          listing_id: listingId,
          reporter_id: reporterId,
          reason
        })
        .select()
        .single();
        
      if (error) throw error;
      return data as Report;
    } else {
      initializeLocalStorage();
      const reports: Report[] = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const newReport: Report = {
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        listing_id: listingId,
        reporter_id: reporterId,
        reason,
        created_at: new Date().toISOString()
      };
      
      reports.push(newReport);
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
      return newReport;
    }
  },

  // Supabase Auth Google Sign-in Trigger
  getSupabaseAuthUrl(): string {
    // In real app, we trigger OAuth with Supabase:
    // supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    return '';
  },

  async triggerRealGoogleSignIn(): Promise<void> {
    if (isLiveSupabase && supabaseInstance) {
      const { error } = await supabaseInstance.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    }
  }
};
