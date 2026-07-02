import React from 'react';
import { MapPin, ShieldCheck, Tag } from 'lucide-react';
import { Listing, Language } from '../types';

interface ListingCardProps {
  listing: Listing;
  currentLanguage: Language;
  onOpenDetails: (listing: Listing) => void;
  t: any;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  currentLanguage,
  onOpenDetails,
  t
}) => {
  const firstPhotoUrl = listing.photos && listing.photos.length > 0 
    ? listing.photos[0].storage_url 
    : 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=600&q=80'; // fallback outdoor placeholder

  const isSold = listing.status === 'sold';

  // Localized values
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'tent': return t.categoryTent;
      case 'backpack': return t.categoryBackpack;
      case 'sleeping_bag': return t.categorySleepingBag;
      case 'cooking': return t.categoryCooking;
      case 'clothing': return t.categoryClothing;
      case 'footwear': return t.categoryFootwear;
      case 'electronics': return t.categoryElectronics;
      default: return t.categoryOther;
    }
  };

  const getConditionStyle = (cond: string) => {
    if (cond === 'new') {
      return 'bg-white/90 backdrop-blur text-emerald-700 border-transparent';
    }
    return 'bg-gray-700 text-white border-transparent';
  };

  const getRegionName = (regKey: string) => {
    return t.regions[regKey] || regKey;
  };

  return (
    <div 
      id={`listing-card-${listing.id}`}
      onClick={() => onOpenDetails(listing)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-pointer ${
        isSold ? 'opacity-75' : ''
      }`}
    >
      {/* Image Gallery Showcase & Overlay Badges */}
      <div className="relative h-48 w-full bg-gray-50 overflow-hidden shrink-0">
        <img 
          src={firstPhotoUrl} 
          alt={listing.title}
          referrerPolicy="no-referrer"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isSold ? 'filter grayscale contrast-125' : ''
          }`}
          onError={(e) => {
            // fallback if custom file failed to load
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Condition Badge */}
        <div className="absolute top-3 start-3 z-10">
          <span className={`inline-block px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider border ${getConditionStyle(listing.condition)}`}>
            {listing.condition === 'new' ? t.conditionNewShort : t.conditionUsedShort}
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 start-3 z-10">
          <div className="bg-white/90 backdrop-blur text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <span>{getCategoryLabel(listing.category).toUpperCase()}</span>
          </div>
        </div>

        {/* SOLD Overlay Banner */}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="bg-red-600 text-white font-sans font-black tracking-widest text-xs px-4 py-2 rounded-xl uppercase transform -rotate-12 border-2 border-white/90 shadow-md">
              {t.statusSold}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 text-start">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-sm md:text-base leading-snug">
            {listing.title}
          </h3>
          <span className="text-emerald-700 font-extrabold text-sm md:text-base shrink-0">
            {listing.price} MAD
          </span>
        </div>
        
        <p className="text-xs text-gray-400 mb-4">
          {getRegionName(listing.region)}
        </p>

        <div className="flex items-center gap-1.5 mt-auto">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 tracking-tight uppercase">
            {t.badgeGoogleVerifiedShort ? t.badgeGoogleVerifiedShort.toUpperCase() : "VERIFIED SELLER"}
          </span>
        </div>
      </div>
    </div>
  );
};
