import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, SlidersHorizontal, Plus, ShieldCheck, MapPin, 
  Trash2, Edit, Check, Compass, ShoppingBag, User, 
  RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, X 
} from 'lucide-react';
import { useLanguage } from './hooks/useLanguage';
import { dbService, isLiveSupabase } from './lib/supabase';
import { Listing, UserProfile, CategoryType, ConditionType } from './types';
import { Navbar } from './components/Navbar';
import { ListingCard } from './components/ListingCard';
import { ListingDetailsModal } from './components/ListingDetailsModal';
import { CreateListingModal } from './components/CreateListingModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthOverlay } from './components/AuthOverlay';

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // App Tabs: 'browse', 'my-listings', 'profile'
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'profile'>('browse');

  // Listings Cache
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [selectedCondition, setSelectedCondition] = useState<ConditionType | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Active Modal States
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);

  // Minimal Action Notifications (Toasts)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Trigger custom toast alert
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Check user session on boot
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const currentUser = await dbService.getSessionUser();
        if (currentUser) {
          setUser(currentUser);
          // WhatsApp number is optional; only a missing region requires onboarding
          if (!currentUser.region) {
            setIsOnboarding(true);
          } else {
            // Respect seller preferred language on login
            if (currentUser.preferred_language) {
              setLanguage(currentUser.preferred_language);
            }
          }
        }
      } catch (err) {
        console.error("Auth session check error", err);
      } finally {
        setAuthChecked(true);
      }
    };
    fetchSession();
  }, []);

  // Sync listings whenever filters change
  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        condition: selectedCondition !== 'all' ? selectedCondition : undefined,
        region: selectedRegion !== 'all' ? selectedRegion : undefined,
        priceMin: priceMin !== '' ? Number(priceMin) : undefined,
        priceMax: priceMax !== '' ? Number(priceMax) : undefined,
        search: searchTerm.trim() || undefined,
      };
      
      const results = await dbService.getListings(filters);
      setListings(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedCondition, selectedRegion, priceMin, priceMax, searchTerm]);

  // Authenticate user successfully
  const handleSignInSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowAuthOverlay(false);
    
    // Check if onboarding is needed (WhatsApp number is optional)
    if (!profile.region) {
      setIsOnboarding(true);
    } else {
      if (profile.preferred_language) {
        setLanguage(profile.preferred_language);
      }
      showToast(`Welcome back, ${profile.display_name}!`, 'success');
    }
  };

  const handleSignOut = async () => {
    try {
      await dbService.signOut();
      setUser(null);
      setActiveTab('browse');
      showToast("Signed out successfully", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnboardingComplete = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    setIsOnboarding(false);
    showToast(t.toastProfileSaved, 'success');
    fetchListings(); // reload listings to refresh seller cache
  };

  // Manage personal listing modifications
  const handleMarkAsSold = async (listingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'sold' ? 'available' : 'sold';
    try {
      await dbService.updateListing(listingId, { status: nextStatus as any });
      showToast(nextStatus === 'sold' ? "Gear marked as SOLD!" : "Gear marked as AVAILABLE!", 'success');
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await dbService.deleteListing(listingId);
      showToast("Listing deleted successfully.", 'info');
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit action
  const handleTriggerEdit = (listing: Listing) => {
    setListingToEdit(listing);
    setShowCreateModal(true);
  };

  // Profile modifications form submission
  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const updatedName = formData.get('displayName') as string;
    const updatedWhatsApp = formData.get('whatsappNumber') as string;
    const updatedRegion = formData.get('region') as string;
    const updatedLang = formData.get('preferredLanguage') as any;

    try {
      const updatedProfile: UserProfile = {
        ...user,
        display_name: updatedName,
        whatsapp_number: updatedWhatsApp,
        region: updatedRegion,
        preferred_language: updatedLang
      };
      
      const saved = await dbService.upsertProfile(updatedProfile);
      setUser(saved);
      setLanguage(saved.preferred_language);
      showToast(t.toastProfileSaved, 'success');
    } catch (err) {
      console.error(err);
      showToast("Failed to save profile changes.", 'info');
    }
  };

  // Filter lists derived
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedCondition !== 'all') count++;
    if (selectedRegion !== 'all') count++;
    if (priceMin !== '') count++;
    if (priceMax !== '') count++;
    if (searchTerm !== '') count++;
    return count;
  }, [selectedCategory, selectedCondition, selectedRegion, priceMin, priceMax, searchTerm]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedRegion('all');
    setPriceMin('');
    setPriceMax('');
    setSearchTerm('');
  };

  // Filter listings for My Listings tab specifically
  const myListings = useMemo(() => {
    if (!user) return [];
    return listings.filter(l => l.seller_id === user.id);
  }, [listings, user]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navigation Header bar */}
      <Navbar 
        currentLanguage={language}
        onLanguageChange={setLanguage}
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (!user && (tab === 'my-listings' || tab === 'profile')) {
            setShowAuthOverlay(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onSignInClick={() => setShowAuthOverlay(true)}
        onSignOutClick={handleSignOut}
        t={t}
        isLive={isLiveSupabase}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {/* Global Floating Toast Success Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 border border-white/10">
            {toastType === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Compass className="w-5 h-5 text-orange-400 shrink-0 animate-spin-slow" />
            )}
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* ONBOARDING FLOW */}
        {isOnboarding && user && (
          <OnboardingModal 
            user={user}
            onComplete={handleOnboardingComplete}
            t={t}
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        )}

        {/* SIGN IN / AUTH SPLASH OVERLAY */}
        {showAuthOverlay && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setShowAuthOverlay(false)}
                className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-white/95 text-gray-400 hover:text-gray-900 border border-gray-100 shadow-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <AuthOverlay 
                onSignInSuccess={handleSignInSuccess}
                t={t}
                currentLanguage={language}
              />
            </div>
          </div>
        )}

        {/* TAB 1: BROWSE & FILTER GEAR */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            
            {/* Marketplace Banner Intro */}
            <div className="relative rounded-2xl bg-emerald-800 text-white overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-emerald-900/10">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              <div className="relative space-y-2 max-w-xl text-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-white/10 text-emerald-200 uppercase border border-white/10">
                  {language === 'ar' ? 'مجتمع المسافرين بالمغرب' : 'MOROCCO OUTDOOR HUB'}
                </span>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">
                  {t.appSubtitle}
                </h1>
                <p className="text-xs md:text-sm text-emerald-100 max-w-md leading-relaxed">
                  {t.appDescription}
                </p>
              </div>

              <div className="relative flex items-center shrink-0">
                <button
                  onClick={() => {
                    if (!user) {
                      setShowAuthOverlay(true);
                    } else {
                      setListingToEdit(null);
                      setShowCreateModal(true);
                    }
                  }}
                  className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/10 hover:-translate-y-0.5 transition-all text-sm w-full md:w-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>{t.navCreateListing}</span>
                </button>
              </div>
            </div>

            {/* Filter Hub Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Left search input */}
              <div className="relative w-full lg:max-w-md">
                <div className="absolute inset-y-0 start-4 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-11 pe-10 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 transition-all placeholder-gray-400"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute inset-y-0 end-4 flex items-center text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Right filters selections */}
              <div className="hidden lg:flex flex-wrap items-center gap-3">
                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-gray-700 cursor-pointer transition-colors"
                >
                  <option value="all">📁 {t.filterCategory}: {language === 'ar' ? 'الكل' : 'All'}</option>
                  <option value="tent">🏕️ {t.categoryTent}</option>
                  <option value="backpack">🎒 {t.categoryBackpack}</option>
                  <option value="sleeping_bag">🛌 {t.categorySleepingBag}</option>
                  <option value="cooking">🍳 {t.categoryCooking}</option>
                  <option value="clothing">🧥 {t.categoryClothing}</option>
                  <option value="footwear">🥾 {t.categoryFootwear}</option>
                  <option value="electronics">🛰️ {t.categoryElectronics}</option>
                  <option value="other">⚙️ {t.categoryOther}</option>
                </select>

                {/* Condition filter selector */}
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-gray-700 cursor-pointer transition-colors"
                >
                  <option value="all">✨ {t.filterCondition}: {language === 'ar' ? 'الكل' : 'All'}</option>
                  <option value="new">🆕 {t.conditionNewShort}</option>
                  <option value="used">🔄 {t.conditionUsedShort}</option>
                </select>

                {/* Region Selector */}
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-gray-700 max-w-[200px] truncate cursor-pointer transition-colors"
                >
                  <option value="all">📍 {t.allRegions}</option>
                  {Object.entries(t.regions).map(([key, value]) => (
                    <option key={key} value={key}>
                      📍 {value as string}
                    </option>
                  ))}
                </select>

                {/* Price limits */}
                <div className="flex items-center space-x-1.5 space-x-reverse border border-gray-200 rounded-md p-1 bg-gray-50/50">
                  <input
                    type="number"
                    placeholder="Min MAD"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-18 px-2 py-1 border border-gray-200 rounded text-xxs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-gray-400 font-mono text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max MAD"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-18 px-2 py-1 border border-gray-200 rounded text-xxs focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden w-full flex items-center justify-center space-x-2 space-x-reverse border border-gray-200 rounded-xl py-2.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              </button>
            </div>

            {/* Mobile Filters Drawer Overlay */}
            {showMobileFilters && (
              <div className="lg:hidden bg-white border border-gray-100 rounded-3xl p-5 shadow-lg space-y-4 text-start animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                  <h3 className="font-bold text-sm text-gray-900">Filter Marketplace</h3>
                  <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 text-xs font-semibold underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5">{t.filterCategory}</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="tent">{t.categoryTent}</option>
                      <option value="backpack">{t.categoryBackpack}</option>
                      <option value="sleeping_bag">{t.categorySleepingBag}</option>
                      <option value="cooking">{t.categoryCooking}</option>
                      <option value="clothing">{t.categoryClothing}</option>
                      <option value="footwear">{t.categoryFootwear}</option>
                      <option value="electronics">{t.categoryElectronics}</option>
                      <option value="other">{t.categoryOther}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5">{t.filterCondition}</label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value as any)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white"
                    >
                      <option value="all">All Conditions</option>
                      <option value="new">{t.conditionNew}</option>
                      <option value="used">{t.conditionUsed}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5">{t.filterRegion}</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl bg-white"
                    >
                      <option value="all">{t.allRegions}</option>
                      {Object.entries(t.regions).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-500 mb-1.5">Price Range (MAD)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2.5 border border-gray-200 rounded-xl"
                      />
                      <span className="text-gray-400 font-mono">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full p-2.5 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-bold text-gray-500 px-4 py-2 hover:bg-gray-50 rounded-xl cursor-pointer"
                  >
                    {t.btnClearAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters Pill list */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-start text-xs text-gray-500 bg-white border border-gray-100 px-4 py-2 rounded-2xl">
                <span className="font-semibold">{t.labelActiveFilters}:</span>
                {searchTerm && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Category: {t[`category${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())}`] || selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                {selectedCondition !== 'all' && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Condition: {selectedCondition === 'new' ? t.conditionNewShort : t.conditionUsedShort}
                    <button onClick={() => setSelectedCondition('all')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                {selectedRegion !== 'all' && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Region: {t.regions[selectedRegion] || selectedRegion}
                    <button onClick={() => setSelectedRegion('all')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                {priceMin !== '' && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Min: {priceMin} MAD
                    <button onClick={() => setPriceMin('')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                {priceMax !== '' && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 font-medium">
                    Max: {priceMax} MAD
                    <button onClick={() => setPriceMax('')} className="ms-1 text-emerald-600 hover:text-emerald-900 cursor-pointer">×</button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline ms-auto cursor-pointer"
                >
                  {t.btnClearAll}
                </button>
              </div>
            )}

            {/* Grid listings / loaders / empty states */}
            {loadingListings ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-sm font-semibold text-gray-500 mt-2">{t.labelLoading}</span>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    currentLanguage={language}
                    onOpenDetails={(l) => setSelectedListing(l)}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              /* Beautiful Empty States */
              <div className="border border-gray-150 border-dashed rounded-3xl bg-white p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {t.emptyNoListings}
                </h3>
                <p className="text-xs text-gray-400 leading-normal">
                  Try adjusting filters, clearing your keywords, or widen your region scope to locate other camper gear!
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
                >
                  {t.btnClearAll}
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: MY OWN PERSONAL LISTINGS */}
        {activeTab === 'my-listings' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="text-start">
                <h2 className="text-xl md:text-2xl font-sans font-black text-gray-900">
                  {t.navMyListings}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Manage, update, and mark your camp gear as sold.</p>
              </div>
              <button
                onClick={() => {
                  setListingToEdit(null);
                  setShowCreateModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 me-1" />
                {t.navCreateListing}
              </button>
            </div>

            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myListings.map((listing) => (
                  <div 
                    key={listing.id}
                    className="flex flex-col sm:flex-row bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all text-start"
                  >
                    {/* Image box */}
                    <div className="relative w-full sm:w-44 aspect-square sm:aspect-auto bg-gray-50 overflow-hidden shrink-0">
                      <img 
                        src={listing.photos && listing.photos.length > 0 ? listing.photos[0].storage_url : 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=400&q=80'} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {listing.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="bg-red-600 text-white font-sans font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wider transform -rotate-12 border-2 border-white/90">
                            {t.statusSold}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta values */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100">
                            {listing.category}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-100">
                            {listing.condition === 'new' ? t.conditionNewShort : t.conditionUsedShort}
                          </span>
                        </div>
                        <h3 className="font-sans font-bold text-gray-900 text-sm line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-emerald-700 font-extrabold text-sm font-sans mt-1">
                          {listing.price} MAD
                        </p>
                      </div>

                      {/* Action buttons inside My Listings card */}
                      <div className="pt-3 border-t border-gray-50 flex flex-wrap gap-2 items-center justify-between mt-4">
                        <button
                          onClick={() => handleMarkAsSold(listing.id, listing.status)}
                          className={`flex items-center space-x-1 space-x-reverse px-2.5 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-colors ${
                            listing.status === 'sold'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{listing.status === 'sold' ? t.btnMarkAsAvailable : t.btnMarkAsSold}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTriggerEdit(listing)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                            title={t.btnEdit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                            title={t.btnDelete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty My Listings CTA */
              <div className="border border-gray-150 border-dashed rounded-3xl bg-white p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {t.emptyMyListings}
                </h3>
                <p className="text-xs text-gray-400 leading-normal max-w-sm mx-auto">
                  Morocco's Atlas routes are calling! Clear out your unused tents, stoves, jackets, and shoes. Help a fellow backpacker and earn some Dirhams.
                </p>
                <button
                  onClick={() => {
                    setListingToEdit(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
                >
                  {t.emptyMyListingsCTA}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER PROFILE CONTROLLER */}
        {activeTab === 'profile' && user && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-start">
              <h2 className="text-xl md:text-2xl font-sans font-black text-gray-900">
                {t.navProfile}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Configure your hiking identity and primary contact channels.</p>
            </div>

            {/* Profile Form Details Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-xs text-start">
              
              {/* Trust Indicators header */}
              <div className="bg-blue-50/50 border border-blue-100/30 rounded-2xl p-4 flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm border-2 border-blue-500/20">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">Google Identity Active</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tied to real email security badge.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 space-x-reverse bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-full shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-white" fill="currentColor" stroke="rgb(59 130 246)" />
                  <span className="font-sans">{t.badgeGoogleVerifiedShort}</span>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
                    {t.labelDisplayName}
                  </label>
                  <input
                    type="text"
                    required
                    name="displayName"
                    defaultValue={user.display_name}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-1">
                    {t.labelWhatsApp}
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">{t.labelWhatsAppHint}</p>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    defaultValue={user.whatsapp_number || ''}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
                      {t.labelRegion}
                    </label>
                    <select
                      name="region"
                      defaultValue={user.region || 'marrakech'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
                    >
                      {Object.entries(t.regions).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
                      {t.labelPreferredLanguage}
                    </label>
                    <select
                      name="preferredLanguage"
                      defaultValue={user.preferred_language || 'en'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center cursor-pointer"
                  >
                    <Check className="w-4 h-4 me-1.5" />
                    <span>{t.btnSave}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer warning */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-auto text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="font-sans font-bold text-gray-500 text-sm">{t.appName}</p>
          <p className="max-w-md mx-auto leading-normal">
            Souk Trail is a local Morocco community marketplace. We do not coordinate payments, logistics, or shipping escrow. Arrange safe direct handovers.
          </p>
          <p className="font-mono text-[9px] mt-2">© 2026 Souk Trail. Safe Travels on Moroccan Ridges.</p>
        </div>
      </footer>

      {/* DETAIL MODAL DISPLAY */}
      {selectedListing && (
        <ListingDetailsModal 
          listing={selectedListing}
          user={user}
          onClose={() => setSelectedListing(null)}
          onRefreshListings={fetchListings}
          t={t}
          currentLanguage={language}
        />
      )}

      {/* CREATE / EDIT LISTING MODAL */}
      {showCreateModal && user && (
        <CreateListingModal 
          user={user}
          listingToEdit={listingToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setListingToEdit(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setListingToEdit(null);
            showToast(listingToEdit ? t.successListingUpdated : t.successListingCreated, 'success');
            fetchListings();
            setActiveTab('my-listings'); // route to my listings automatically
          }}
          t={t}
          currentLanguage={language}
        />
      )}

    </div>
  );
}
