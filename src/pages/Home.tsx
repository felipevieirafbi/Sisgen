import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, Leaf, BookOpen, MessageSquare } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-[#1b3a4b] text-white overflow-hidden py-24 lg:py-32">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://regulabio.com.br/assets/images/hero-bg.jpg')",
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            opacity: 0.18,
            filter: "saturate(0.4) contrast(1.1)"
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl"
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl max-w-2xl mb-10 text-gray-200"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/diagnostic" className="bg-[#b8975a] text-[#1b3a4b] px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#a47248] transition-colors shadow-lg flex items-center justify-center gap-2">
              <MessageSquare size={24} />
              {t('hero.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1b3a4b] mb-4">{t('home.why_regulate')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('home.why_regulate_desc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#e8e0d8] p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full text-red-600 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('home.fines')}</h3>
              <p className="text-gray-600">{t('home.fines_desc')}</p>
            </div>
            <div className="bg-[#e8e0d8] p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-orange-100 p-4 rounded-full text-orange-600 mb-6">
                <Leaf size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('home.export')}</h3>
              <p className="text-gray-600">{t('home.export_desc')}</p>
            </div>
            <div className="bg-[#e8e0d8] p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-6">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{t('home.patents')}</h3>
              <p className="text-gray-600">{t('home.patents_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-[#f5f0eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1b3a4b] mb-4">{t('home.how_it_works')}</h2>
            <p className="text-lg text-gray-600">{t('home.how_it_works_desc')}</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-[#234b61] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">{t('home.step1')}</h3>
              <p className="text-gray-600">{t('home.step1_desc')}</p>
            </div>
            <div className="hidden md:block w-16 h-1 bg-gray-300"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-[#234b61] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">{t('home.step2')}</h3>
              <p className="text-gray-600">{t('home.step2_desc')}</p>
            </div>
            <div className="hidden md:block w-16 h-1 bg-gray-300"></div>
            <div className="flex flex-col items-center text-center max-w-xs">
              <div className="w-16 h-16 bg-[#b8975a] text-[#1b3a4b] rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">{t('home.step3')}</h3>
              <p className="text-gray-600">{t('home.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
