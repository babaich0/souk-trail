import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, Trash2, AlertTriangle } from 'lucide-react';
import { Listing, Language, UserProfile, CategoryType, ConditionType } from '../types';
import { dbService } from '../lib/supabase';

interface CreateListingModalProps {
  user: UserProfile;
  listingToEdit?: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
  t: any;
  currentLanguage: Language;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  user,
  listingToEdit,
  onClose,
  onSuccess,
  t,
  currentLanguage
}) => {
  const isEditMode = !!listingToEdit;
  
  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('tent');
  const [condition, setCondition] = useState<ConditionType>('used');
  const [price, setPrice] = useState<number | ''>('');
  const [region, setRegion] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form if editing
  useEffect(() => {
    if (listingToEdit) {
      setTitle(listingToEdit.title);
      setDescription(listingToEdit.description);
      setCategory(listingToEdit.category);
      setCondition(listingToEdit.condition);
      setPrice(listingToEdit.price);
      setRegion(listingToEdit.region);
      const existingUrls = listingToEdit.photos?.map(p => p.storage_url) || [];
      setPhotoUrls(existingUrls);
    } else {
      // Prefill region from user profile
      setRegion(user.region || 'marrakech');
    }
  }, [listingToEdit, user]);

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFiles(e.target.files);
    }
  };

  // Process selected or dropped files
  const handleFiles = async (files: FileList) => {
    const remainingSlots = 5 - photoUrls.length;
    if (remainingSlots <= 0) {
      setErrorMessage("Maximum of 5 photos reached.");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploadingPhotos(true);
    setErrorMessage('');
    setPhotoError('');

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Simple file validation
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Images must be smaller than 5MB.');
        }
        return await dbService.uploadPhoto(file, user.id);
      });

      const newUrls = await Promise.all(uploadPromises);
      setPhotoUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to upload photos. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPhotoError('');

    if (!title.trim()) {
      setErrorMessage("Listing title is required.");
      return;
    }
    if (price === '' || price < 0) {
      setErrorMessage("Please enter a valid price.");
      return;
    }
    if (!region) {
      setErrorMessage("Please select your region.");
      return;
    }
    if (!isEditMode && photoUrls.length === 0) {
      setPhotoError("Please add at least one photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: Number(price),
        currency: 'MAD',
        region,
        status: listingToEdit?.status || 'available' as any
      };

      if (isEditMode && listingToEdit) {
        // Handle edit submission
        await dbService.updateListing(listingToEdit.id, {
          title: listingData.title,
          description: listingData.description,
          category: listingData.category,
          condition: listingData.condition,
          price: listingData.price,
          region: listingData.region,
        });
        
        // Note: For a live Supabase environment, updating list of photos can be extended
        // Here, we maintain consistency.
      } else {
        // Create new listing
        await dbService.createListing(listingData, photoUrls);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(t.errorListingCreateFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="create-listing-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="create-listing-container"
        className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-sans font-extrabold text-gray-900 flex items-center">
            <ImageIcon className="w-5 h-5 text-emerald-600 me-2" />
            {isEditMode ? t.btnEdit : t.btnCreate}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
            title={t.btnCancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Listing Title */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
              {t.labelTitle} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={70}
              placeholder="e.g. Deuter 45L Backpack - Like New"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
                {t.labelCategory} <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
              >
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
              <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
                {t.labelCondition} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition('new')}
                  className={`py-3 px-4 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    condition === 'new'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {t.conditionNew}
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('used')}
                  className={`py-3 px-4 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    condition === 'used'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {t.conditionUsed}
                </button>
              </div>
            </div>
          </div>

          {/* Price & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
                {t.labelPrice} (MAD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 350"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm pe-12"
                />
                <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-xs font-bold font-mono text-gray-400">
                  MAD
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
                {t.labelRegion} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
              >
                {Object.entries(t.regions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value as string}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-2">
              {t.labelDescription}
            </label>
            <textarea
              placeholder="Describe your gear. Mention how old it is, its weight, size, key features, and any wear/tear..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
            ></textarea>
          </div>

          {/* Photo Uploader */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-500 uppercase tracking-wider mb-1">
              {t.labelAddPhotos} <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-gray-400 mb-3">{t.labelAddPhotosHint}</p>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-99'
                  : photoError
                  ? 'border-red-300 bg-red-50/30 hover:border-red-400'
                  : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                multiple
                accept="image/*"
                className="hidden"
                disabled={photoUrls.length >= 5 || uploadingPhotos}
              />
              {uploadingPhotos ? (
                <div className="flex flex-col items-center py-2">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="text-xs font-medium text-emerald-700 mt-2">{t.labelLoading}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{currentLanguage === 'ar' ? 'اختر ملفًا أو اسحبه إلى هنا' : 'Click to Upload or Drag Images'}</span>
                  <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB</span>
                </div>
              )}
            </div>

            {photoError && (
              <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{photoError}</span>
              </p>
            )}

            {/* Photo Previews */}
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img 
                      src={url} 
                      alt={`Preview ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md hover:scale-105 transition-all cursor-pointer opacity-90"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] py-0.5 text-center font-bold">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            {t.btnCancel}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingPhotos}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 space-x-reverse text-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin me-1.5" />}
            <span>{isEditMode ? t.btnSave : t.btnCreate}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
