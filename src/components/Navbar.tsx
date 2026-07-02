import React from 'react';
import { Compass, PlusCircle, ShoppingBag, User, LogOut, Globe, CheckCircle2 } from 'lucide-react';
import { Language, UserProfile } from '../types';

interface NavbarProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  user: UserProfile | null;
  activeTab: 'browse' | 'my-listings' | 'profile';
  onTabChange: (tab: 'browse' | 'my-listings' | 'profile') => void;
  onSignInClick: () => void;
  onSignOutClick: () => void;
  t: any;
  isLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  user,
  activeTab,
  onTabChange,
  onSignInClick,
  onSignOutClick,
  t,
  isLive
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('browse')}>
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex flex-col ms-1 text-start">
              <span className="text-base md:text-lg font-bold tracking-tight text-gray-900 leading-none">
                {t.appName ? t.appName.toUpperCase() : "SOUK TRAIL"}
              </span>
              <span className="text-[9px] font-bold font-mono text-emerald-700 uppercase tracking-wider mt-0.5">
                {currentLanguage === 'ar' ? 'ممر السوق' : 'Morocco Trail'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 space-x-reverse">
            <button
              onClick={() => onTabChange('browse')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Compass className={`w-4 h-4 me-2 ${currentLanguage === 'ar' ? 'ml-0' : ''}`} />
              {t.navBrowse}
            </button>
            
            {user && (
              <>
                <button
                  onClick={() => onTabChange('my-listings')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'my-listings'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className={`w-4 h-4 me-2 ${currentLanguage === 'ar' ? 'ml-0' : ''}`} />
                  {t.navMyListings}
                </button>

                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  <User className={`w-4 h-4 me-2 ${currentLanguage === 'ar' ? 'ml-0' : ''}`} />
                  {t.navProfile}
                </button>
              </>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-3 space-x-reverse">
            
            {/* Database Connection Status Light */}
            <div 
              title={isLive ? t.connectionSuccess : t.connectionFallback}
              className="flex items-center justify-center p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-help"
            >
              <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              </span>
            </div>

            {/* Language Switcher Button Group */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-md p-1 bg-gray-50">
              {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    currentLanguage === lang
                      ? 'bg-white shadow-sm text-emerald-700 font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'AR'}
                </button>
              ))}
            </div>

            {/* User Auth Info / Action Buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end text-right me-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900">
                      {user.display_name}
                    </span>
                    <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 leading-none mt-0.5">
                    {user.whatsapp_number ? user.whatsapp_number : t.navProfile}
                  </span>
                </div>
                
                {/* User Icon/Avatar */}
                <div 
                  onClick={() => onTabChange('profile')}
                  className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  title={user.display_name}
                >
                  {user.display_name ? user.display_name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase() : 'MA'}
                </div>

                <button
                  onClick={onSignOutClick}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title={t.btnSignOut}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center cursor-pointer"
              >
                <User className="w-4 h-4 me-1.5" />
                <span className="hidden sm:inline">{t.btnSignInWithGoogle}</span>
                <span className="sm:hidden">{t.btnSignInWithGoogle.split(' ')[0]}</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      {user && (
        <div className="md:hidden flex justify-around items-center border-t border-gray-100 bg-white py-2 px-2 text-center">
          <button
            onClick={() => onTabChange('browse')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === 'browse' ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            {t.navBrowse}
          </button>

          <button
            onClick={() => onTabChange('my-listings')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === 'my-listings' ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {t.navMyListings}
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            {t.navProfile}
          </button>
        </div>
      )}
    </header>
  );
};
