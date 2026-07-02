import React, { useState } from 'react';
import { Compass, ShieldCheck, Mail, AlertCircle, Sparkles, LogIn, ChevronRight, HelpCircle, Phone } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { dbService, isLiveSupabase } from '../lib/supabase';

interface AuthOverlayProps {
  onSignInSuccess: (user: UserProfile) => void;
  t: any;
  currentLanguage: Language;
}

const phoneTranslations = {
  en: {
    tabGoogle: "Google Identity",
    tabPhone: "Phone Verification",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "e.g., 0612345678 or +212612345678",
    nameLabel: "Your Full Name / Seller Name",
    namePlaceholder: "e.g., Mehdi Alami",
    btnSendCode: "Send Verification Code",
    btnVerify: "Verify & Sign In",
    otpSubtitle: "We sent a simulated SMS verification code to",
    otpPrompt: "Enter verification code:",
    otpHelper: "SMS simulator: Your verification code is",
    otpIncorrect: "Incorrect code. Please enter the displayed code.",
    goBack: "Go Back",
    trustBadgePhoneTitle: "WhatsApp Ready",
    trustBadgePhoneDesc: "Log in with your WhatsApp phone number. Buyers can instantly click to text you directly."
  },
  fr: {
    tabGoogle: "Compte Google",
    tabPhone: "Vérification Téléphone",
    phoneLabel: "Numéro de téléphone",
    phonePlaceholder: "ex: 0612345678 ou +212612345678",
    nameLabel: "Votre nom complet / Nom du vendeur",
    namePlaceholder: "ex: Mehdi Alami",
    btnSendCode: "Envoyer le code de vérification",
    btnVerify: "Vérifier & Connexion",
    otpSubtitle: "Nous avons envoyé un code de vérification simulé au",
    otpPrompt: "Entrez le code de vérification :",
    otpHelper: "Simulateur SMS : Votre code de vérification est",
    otpIncorrect: "Code incorrect. Veuillez entrer le code affiché.",
    goBack: "Retour",
    trustBadgePhoneTitle: "WhatsApp Prêt",
    trustBadgePhoneDesc: "Connectez-vous avec votre numéro WhatsApp. Les acheteurs peuvent vous écrire directement."
  },
  ar: {
    tabGoogle: "حساب Google",
    tabPhone: "التحقق من الهاتف",
    phoneLabel: "رقم الهاتف المحمول",
    phonePlaceholder: "مثال: 0612345678 أو +212612345678",
    nameLabel: "الاسم الكامل / اسم البائع",
    namePlaceholder: "مثال: مهدي العلمي",
    btnSendCode: "إرسال رمز التحقق",
    btnVerify: "التحقق وتسجيل الدخول",
    otpSubtitle: "لقد أرسلنا رمز تحقق افتراضي إلى",
    otpPrompt: "أدخل رمز التحقق:",
    otpHelper: "محاكي SMS: رمز التحقق الخاص بك هو",
    otpIncorrect: "الرمز غير صحيح. الرجاء إدخال الرمز المعروض.",
    goBack: "العودة",
    trustBadgePhoneTitle: "جاهز لتطبيق WhatsApp",
    trustBadgePhoneDesc: "قم بتسجيل الدخول برقم WhatsApp الخاص بك لكي يتمكن المشترون من الاتصال بك مباشرة بضغطة زر."
  }
};

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  onSignInSuccess,
  t,
  currentLanguage
}) => {
  const [showSandboxSelector, setShowSandboxSelector] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  // Phone Sign-In State
  const [authMethod, setAuthMethod] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const pt = phoneTranslations[currentLanguage] || phoneTranslations['en'];

  // Quick sandbox accounts
  const SANDBOX_ACCOUNTS = [
    { email: 'hamza.outdoor@gmail.com', name: 'Hamza Toubkal' },
    { email: 'fatima.zahra.trek@gmail.com', name: 'Fatima-Zahra' },
    { email: 'youssef.hiking.casa@gmail.com', name: 'Youssef Casa' },
    { email: 'abdoubabaich5@gmail.com', name: 'Abdou Babaich' }, // User email from metadata
  ];

  const handleRealSignIn = async () => {
    setLoading(true);
    try {
      await dbService.triggerRealGoogleSignIn();
    } catch (err) {
      console.error(err);
      alert("Failed to connect to Google Sign-In. Falling back to simulated login.");
      setShowSandboxSelector(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedSignIn = async (email: string, name: string) => {
    setLoading(true);
    try {
      const profile = await dbService.signInWithGoogleSimulated(email, name);
      if (profile) {
        onSignInSuccess(profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;
    handleSimulatedSignIn(customEmail.trim(), customName.trim());
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !phoneName.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setOtpError('');
      setLoading(false);
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    
    if (otpCode.trim() !== generatedOtp) {
      setOtpError(pt.otpIncorrect);
      return;
    }
    
    setLoading(true);
    try {
      const profile = await dbService.signInWithPhoneSimulated(phoneNumber.trim(), phoneName.trim());
      if (profile) {
        onSignInSuccess(profile);
      }
    } catch (err) {
      console.error(err);
      setOtpError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
        
        {/* Splash Image banner */}
        <div className="relative h-44 bg-emerald-800 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 contrast-125"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent"></div>
          
          <div className="relative flex flex-col items-center text-center px-4">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-2 shadow-xs border border-white/10">
              <Compass className="w-6 h-6 text-emerald-300" />
            </div>
            <h1 className="font-sans font-black text-2xl tracking-tight text-white">{t.appName}</h1>
            <p className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase mt-0.5">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 sm:p-8">
          
          <div className="mb-6 text-center">
            <p className="text-gray-600 text-sm leading-relaxed">
              {t.appDescription}
            </p>
          </div>

          {/* Authentication Method Tabs */}
          {!showSandboxSelector && !otpSent && (
            <div className="flex border-b border-gray-200 mb-6 text-start">
              <button
                type="button"
                onClick={() => setAuthMethod('google')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                  authMethod === 'google' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {pt.tabGoogle}
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer ${
                  authMethod === 'phone' ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {pt.tabPhone}
              </button>
            </div>
          )}

          {/* Core Trust Indicators */}
          {!showSandboxSelector && !otpSent && (
            <div className="space-y-3 mb-6">
              {authMethod === 'google' ? (
                <div className="flex items-start gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/30">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-gray-900 font-sans">Google Identity Protection</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Every buyer and seller requires Google Sign-In, reducing fake listings and anonymous scammers.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/30">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-start">
                    <h4 className="text-xs font-bold text-gray-900 font-sans">{pt.trustBadgePhoneTitle}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{pt.trustBadgePhoneDesc}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/30">
                <Compass className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-start">
                  <h4 className="text-xs font-bold text-gray-900 font-sans">100% Direct Morocco Trading</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Morocco-specific mountain regions and direct WhatsApp deal-making. Zero platform fee or escrow hassle.</p>
                </div>
              </div>
            </div>
          )}

          {/* Trigger Authentication */}
          {!showSandboxSelector ? (
            authMethod === 'google' ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={isLiveSupabase ? handleRealSignIn : () => setShowSandboxSelector(true)}
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  <span>{t.btnSignInWithGoogle}</span>
                </button>

                {!isLiveSupabase && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowSandboxSelector(true)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline flex items-center justify-center mx-auto gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>Open Sandbox Simulator (Recommended for Testing)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : !otpSent ? (
              /* Phone Sign-In Input Form */
              <form onSubmit={handleSendOtp} className="space-y-4 text-start">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{pt.nameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={pt.namePlaceholder}
                    value={phoneName}
                    onChange={(e) => setPhoneName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{pt.phoneLabel}</label>
                  <input
                    type="tel"
                    required
                    placeholder={pt.phonePlaceholder}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all text-sm cursor-pointer mt-2"
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  <span>{pt.btnSendCode}</span>
                </button>
              </form>
            ) : (
              /* OTP Code Verification Form */
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-start animate-in fade-in duration-300">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {pt.otpSubtitle} <strong className="text-gray-900">{phoneNumber}</strong>
                  </p>
                  
                  {/* SMS Simulator banner */}
                  <div className="mt-3 bg-white px-3 py-2 rounded-lg border border-dashed border-emerald-300 inline-flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-800 font-bold">
                      {pt.otpHelper}: <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-950 font-black tracking-widest">{generatedOtp}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{pt.otpPrompt}</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="------"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest font-mono font-bold text-lg px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400 transition-all"
                  />
                </div>

                {otpError && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{otpError}</span>
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {pt.goBack}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 4}
                    className="flex-[2] bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    <span>{pt.btnVerify}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Mock Account Selector Container */
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    Sandbox Account Hub
                  </h3>
                  <button
                    onClick={() => setShowSandboxSelector(false)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    {pt.goBack}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mb-4 leading-normal text-start">
                  You are in the Local Preview Sandbox. Click any mock Google identity below to log in as that backpacker instantly, or add a custom identity.
                </p>

                {/* Grid of quick accounts */}
                <div className="grid grid-cols-1 gap-2">
                  {SANDBOX_ACCOUNTS.map((acc, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSimulatedSignIn(acc.email, acc.name)}
                      className="w-full p-3 bg-gray-50 hover:bg-emerald-50 border border-gray-150 hover:border-emerald-200 rounded-xl flex items-center justify-between text-start text-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{acc.name}</p>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{acc.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Google Identity Input */}
              <form onSubmit={handleCustomSubmit} className="border-t border-gray-200 pt-4">
                <h4 className="text-[11px] font-bold text-gray-500 mb-3 uppercase text-start">Or Create a Custom Account</h4>
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-xs text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Your Gmail Address"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-xs text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Generate & Sign In</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
