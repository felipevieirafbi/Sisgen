import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import CookieBanner from "./CookieBanner";

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#e8e0d8] text-gray-900">
      <header className="bg-[#1b3a4b] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <img src="https://regulabio.com.br/assets/logo/regulabio-logo-light.png" alt="RegulaBio Logo" className="h-8 w-auto" referrerPolicy="no-referrer" />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="hover:text-[#b8975a] transition-colors">{t('nav.home')}</Link>
              <Link to="/#services" className="hover:text-[#b8975a] transition-colors">{t('nav.services')}</Link>
              <Link to="/courses" className="hover:text-[#b8975a] transition-colors">{t('nav.courses')}</Link>
              
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-[#b8975a] transition-colors">
                  <Globe size={18} />
                  <span>{i18n.language.toUpperCase()}</span>
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 hidden group-hover:block text-gray-800">
                  <button onClick={() => changeLanguage('pt')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🇧🇷 PT-BR</button>
                  <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🇺🇸 EN</button>
                  <button onClick={() => changeLanguage('fr')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🇫🇷 FR</button>
                  <button onClick={() => changeLanguage('es')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🇪🇸 ES</button>
                  <button onClick={() => changeLanguage('de')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🇩🇪 DE</button>
                </div>
              </div>

              <Link to="/login" className="hover:text-[#b8975a] transition-colors">{t('nav.login')}</Link>
              <Link to="/diagnostic" className="bg-[#b8975a] text-[#1b3a4b] px-4 py-2 rounded-md font-semibold hover:bg-[#a47248] transition-colors">
                {t('hero.cta')}
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-[#b8975a]">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#234b61] px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#1b3a4b] text-white">{t('nav.home')}</Link>
            <Link to="/courses" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#1b3a4b] text-white">{t('nav.courses')}</Link>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#1b3a4b] text-white">{t('nav.login')}</Link>
            <Link to="/diagnostic" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium bg-[#b8975a] text-[#1b3a4b] mt-4 text-center">
              {t('hero.cta')}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-[#132a37] text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="https://regulabio.com.br/assets/logo/regulabio-logo-light.png" alt="RegulaBio Logo" className="h-8 w-auto mb-4" referrerPolicy="no-referrer" />
            <p className="text-sm">{t('footer.desc')}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.links')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/courses" className="hover:text-white transition-colors">{t('nav.courses')}</Link></li>
              <li><Link to="/diagnostic" className="hover:text-white transition-colors">{t('footer.diag')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/admin" className="hover:text-[#b8975a] transition-colors">{t('footer.admin')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">{t('footer.contact')}</h4>
            <p className="text-sm">contato@regulabio.com.br</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-700 text-sm text-center">
          &copy; {new Date().getFullYear()} RegulaBio. {t('footer.rights')}
        </div>
      </footer>
      <CookieBanner />
    </div>
  );
}
