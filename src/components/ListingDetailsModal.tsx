import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MessageSquare, MessageSquareOff, AlertTriangle, ShieldCheck, Calendar, MapPin, Tag, RefreshCw } from 'lucide-react';
import { Listing, Language, UserProfile } from '../types';
import { dbService } from '../lib/supabase';

interface ListingDetailsModalProps {
  listing: Listing;
  user: UserProfile | null;
  onClose: () => void;
  onRefreshListings: () => void;
  t: any;
  currentLanguage: Language;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  listing,
  user,
  onClose,
  onRefreshListings,
  t,
  currentLanguage
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<boolean | null>(null);

  const photos = listing.photos && listing.photos.length > 0 
    ? listing.photos 
    : [{ id: 'fallback', storage_url: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=1200&q=80' }];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Safe WhatsApp Link Formatter
  const getWhatsAppLink = () => {
    let rawNum = listing.seller?.whatsapp_number || listing.description.match(/(06|07)\d{8}/)?.[0] || '';
    if (!rawNum) return '#';

    // Format to digits only
    let cleanNum = rawNum.replace(/\D/g, '');

    // Convert Moroccan local format to international
    if (cleanNum.startsWith('06') || cleanNum.startsWith('07')) {
      cleanNum = '212' + cleanNum.substring(1);
    } else if (cleanNum.startsWith('21206') || cleanNum.startsWith('21207')) {
      cleanNum = '212' + cleanNum.substring(4);
    } else if (!cleanNum.startsWith('212') && cleanNum.length === 9 && (cleanNum.startsWith('6') || cleanNum.startsWith('7'))) {
      cleanNum = '212' + cleanNum;
    }

    // Build prefilled message
    let messageTemplate = t.phWhatsAppMessage || "Hi, I'm interested in your \"{title}\" on Souk Trail for {price} MAD. Is it still available?";
    const finalMsg = messageTemplate
      .replace('{title}', listing.title)
      .replace('{price}', listing.price.toString())
      .replace('{currency}', listing.currency);

    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(finalMsg)}`;
  };

  // Handle reporting
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t.reportPromptSignIn);
      return;
    }
    if (!reportReason.trim()) return;

    setSubmittingReport(true);
    try {
      await dbService.reportListing(listing.id, user.id, reportReason);
      setReportSuccess(true);
      setReportReason('');
      // Dismiss after 3s
      setTimeout(() => {
        setShowReportForm(false);
        setReportSuccess(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setReportSuccess(false);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Convert categories keys to labels
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

  const getRegionName = (regKey: string) => {
    return t.regions[regKey] || regKey;
  };

  const whatsAppLink = getWhatsAppLink();
  const hasWhatsAppContact = whatsAppLink !== '#';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : currentLanguage === 'fr' ? 'fr-FR' : 'ar-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      id="listing-details-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="listing-details-container"
        className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] md:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 end-4 z-30 p-2 rounded-full bg-white/95 shadow-md border border-gray-100 hover:bg-gray-150 text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
          title={t.btnCancel}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Column: Photo Showcase (Grid Span 6/12) */}
          <div className="md:col-span-6 relative bg-gray-50 flex flex-col justify-between min-h-[300px] md:min-h-full border-b md:border-b-0 md:border-e border-gray-100">
            
            {/* Large Image View */}
            <div className="relative flex-1 flex items-center justify-center min-h-[250px] max-h-[450px] overflow-hidden group">
              <img 
                src={photos[activePhotoIndex].storage_url} 
                alt={`${listing.title} - Photo ${activePhotoIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover max-h-[450px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              
              {/* Carousel Arrows */}
              {photos.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevPhoto}
                    className="absolute start-3 p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronLeft className={`w-5 h-5 ${currentLanguage === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                  <button 
                    onClick={handleNextPhoto}
                    className="absolute end-3 p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/60 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <ChevronRight className={`w-5 h-5 ${currentLanguage === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Indicators */}
            {photos.length > 1 && (
              <div className="p-4 bg-white/70 backdrop-blur-md border-t border-gray-100 flex items-center justify-center space-x-2 space-x-reverse overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setActivePhotoIndex(index)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIndex === index ? 'border-emerald-600 scale-105 shadow-sm' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={photo.storage_url} 
                      alt="thumbnail" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Listing Details (Grid Span 6/12) */}
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Header metadata */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {getCategoryLabel(listing.category)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  listing.condition === 'new' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                }`}>
                  {listing.condition === 'new' ? t.conditionNew : t.conditionUsed}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-sans font-extrabold text-gray-900 leading-tight mb-4">
                {listing.title}
              </h2>

              {/* Price Row */}
              <div className="flex items-baseline space-x-1.5 space-x-reverse mb-6 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100/20">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
                  {t.labelPrice}:
                </span>
                <span className="text-3xl font-bold font-sans text-emerald-800">
                  {listing.price}
                </span>
                <span className="text-sm font-bold font-sans text-emerald-700">
                  MAD
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t.labelDescription}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-gray-50/70 p-4 rounded-xl border border-gray-100/50">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {/* Location & Date */}
              <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-4 mb-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 text-emerald-700 me-2 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{t.labelRegion}</span>
                    <span className="font-semibold text-gray-800 line-clamp-1">{getRegionName(listing.region)}</span>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 text-emerald-700 me-2 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Listed On</span>
                    <span className="font-semibold text-gray-800 line-clamp-1">{formatDate(listing.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Seller details with Google Verified Badge */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Seller</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {listing.seller?.display_name ? listing.seller.display_name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div className="text-start">
                      <h4 className="font-sans font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <span>{listing.seller?.display_name || "Community Backpacker"}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold tracking-tight">VERIFIED</span>
                        </div>
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400 leading-none mt-1">
                        Preferred language: {listing.seller?.preferred_language === 'ar' ? 'العربية' : listing.seller?.preferred_language === 'fr' ? 'Français' : 'English'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Actions & Payment Warn */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              
              {/* WhatsApp Call to Action */}
              {hasWhatsAppContact ? (
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:opacity-95 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all text-sm md:text-base cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>{t.btnContactWhatsApp}</span>
                </a>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 border border-gray-150 text-sm md:text-base">
                  <MessageSquareOff className="w-5 h-5 shrink-0" />
                  <span>{t.noWhatsAppMessage}</span>
                </div>
              )}

              {/* Safety Warning */}
              <div className="mt-4 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-normal">{t.warningNoPayments}</p>
              </div>

              {/* Report Listing Button */}
              {!showReportForm ? (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      if (!user) {
                        alert(t.reportPromptSignIn);
                      } else {
                        setShowReportForm(true);
                      }
                    }}
                    className="text-xs font-medium text-gray-400 hover:text-red-500 underline transition-colors cursor-pointer"
                  >
                    {t.btnReport}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="mt-4 p-4 border border-red-100 rounded-2xl bg-red-50/20 animate-in slide-in-from-bottom-3 duration-200">
                  <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 me-1" />
                    {t.reportModalTitle}
                  </h5>

                  {reportSuccess === null ? (
                    <>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        {t.reportReasonLabel}
                      </label>
                      <textarea
                        required
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder={t.reportReasonPlaceholder}
                        rows={2}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      ></textarea>
                      <div className="flex justify-end space-x-2 space-x-reverse mt-2">
                        <button
                          type="button"
                          onClick={() => setShowReportForm(false)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          {t.btnCancel}
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReport}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors shadow-xs flex items-center cursor-pointer"
                        >
                          {submittingReport && <RefreshCw className="w-3 h-3 me-1 animate-spin" />}
                          {t.btnSubmitReport}
                        </button>
                      </div>
                    </>
                  ) : reportSuccess ? (
                    <div className="text-xs text-emerald-700 font-medium py-1">
                      {t.reportSuccessMessage}
                    </div>
                  ) : (
                    <div className="text-xs text-red-700 font-medium py-1">
                      {t.reportErrorMessage}
                    </div>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
