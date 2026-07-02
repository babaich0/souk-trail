import React, { useState } from 'react';
import { Compass, ShieldCheck, Mail, Sparkles, LogIn, ChevronRight } from 'lucide-react';
import { Language, UserProfile } from '../types';
import { dbService, isLiveSupabase } from '../lib/supabase';

interface AuthOverlayProps {
  onSignInSuccess: (user: UserProfile) => void;
  t: any;
  currentLanguage: Language;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  onSignInSuccess,
  t,
  currentLanguage
}) => {
  const [showSandboxSelector, setShowSandboxSelector] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

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

          {/* Core Trust Indicators */}
          {!showSandboxSelector && (
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/30">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-start">
                  <h4 className="text-xs font-bold text-gray-900 font-sans">Google Identity Protection</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Every buyer and seller requires Google Sign-In, reducing fake listings and anonymous scammers.</p>
                </div>
              </div>
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
                    {t.btnCancel}
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
