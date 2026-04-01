import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700 flex-1">
          <p>
            {t('cookies.message', 'Utilizamos cookies essenciais para o funcionamento do nosso site e cookies opcionais para melhorar sua experiência e segurança. Ao continuar navegando, você concorda com o uso de cookies.')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleRejectNonEssential}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
          >
            {t('cookies.reject', 'Recusar Não Essenciais')}
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1b3a4b] hover:bg-[#234b61] rounded-md transition-colors whitespace-nowrap"
          >
            {t('cookies.accept', 'Aceitar Todos')}
          </button>
        </div>
      </div>
    </div>
  );
}
