import React, { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Save, Loader2 } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { dbService } from '../lib/supabase';

interface OnboardingModalProps {
  user: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  t: any;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onComplete,
  t,
  currentLanguage,
  onLanguageChange
}) => {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user.whatsapp_number || '');
  const [region, setRegion] = useState(user.region || 'marrakech');
  const [preferredLang, setPreferredLang] = useState<Language>(currentLanguage);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setWhatsappNumber(user.whatsapp_number || '');
      setRegion(user.region || 'marrakech');
    }
  }, [user]);

  // Sync preferredLang dropdown and main language switcher
  const handleLangSelect = (lang: Language) => {
    setPreferredLang(lang);
    onLanguageChange(lang);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!displayName.trim()) {
      setErrorMsg("Display name is required.");
      return;
    }

    const cleanPhone = whatsappNumber.replace(/\s+/g, '');
    if (!cleanPhone) {
      setErrorMsg("WhatsApp number is required.");
      return;
    }

    // Basic WhatsApp validation for Morocco mobile numbers
    const moroccoRegex = /^(?:\+212|0|212)?[567]\d{8}$/;
    if (!moroccoRegex.test(cleanPhone)) {
      setErrorMsg(t.labelWhatsAppHint || "Please enter a valid Moroccan number (e.g. 0612345678 or +212612345678).");
      return;
    }

    setIsSaving(true);

    try {
      const updated: UserProfile = {
        ...user,
        display_name: displayName.trim(),
        whatsapp_number: cleanPhone,
        region,
        preferred_language: preferredLang,
        created_at: user.created_at || new Date().toISOString()
      };

      const saved = await dbService.upsertProfile(updated);
      onComplete(saved);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to save profile. Please check your inputs and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      id="onboarding-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div 
        id="onboarding-container"
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-100/50 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm shadow-emerald-100">
            <Compass className="w-8 h-8 animate-spin-slow text-emerald-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-black text-gray-900 mb-2">
            {t.setupProfileTitle}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-sm">
            {t.setupProfileSubtitle}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-xs font-semibold text-red-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
              {t.labelDisplayName}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anis Toubkal"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm"
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-1">
              {t.labelWhatsApp}
            </label>
            <p className="text-[10px] text-gray-400 mb-2 leading-tight">
              {t.labelWhatsAppHint}
            </p>
            <input
              type="tel"
              required
              placeholder="e.g. 0612345678"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm font-mono tracking-wide"
            />
          </div>

          {/* Region selection */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
              {t.labelRegion}
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

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold font-mono text-gray-400 uppercase tracking-wider mb-2">
              {t.labelPreferredLanguage}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLangSelect(lang)}
                  className={`py-2.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    preferredLang === lang
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm font-bold'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-100/50 hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin me-2" />
              ) : (
                <Save className="w-5 h-5 me-2" />
              )}
              <span>{t.setupProfileSubmit}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
