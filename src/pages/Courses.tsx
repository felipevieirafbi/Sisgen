import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlayCircle, FileText, BookOpen } from "lucide-react";

export default function Courses() {
  const { t } = useTranslation();

  const products = [
    {
      id: "1",
      title: t('courses.course1.title'),
      description: t('courses.course1.desc'),
      price: "R$ 497,00",
      category: "course",
      icon: <PlayCircle size={32} className="text-[#b8975a]" />
    },
    {
      id: "2",
      title: t('courses.course2.title'),
      description: t('courses.course2.desc'),
      price: "R$ 197,00",
      category: "toolkit",
      icon: <FileText size={32} className="text-[#b8975a]" />
    },
    {
      id: "3",
      title: t('courses.course3.title'),
      description: t('courses.course3.desc'),
      price: "R$ 97,00",
      category: "ebook",
      icon: <BookOpen size={32} className="text-[#b8975a]" />
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-[#1b3a4b] mb-4">{t('courses.title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-8 flex-grow flex flex-col items-center text-center">
                <div className="bg-yellow-50 p-4 rounded-full mb-6">
                  {product.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{product.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{product.description}</p>
                <div className="text-2xl font-extrabold text-[#1b3a4b] mb-6">
                  {product.price}
                </div>
                <button className="w-full bg-[#1b3a4b] text-white py-3 rounded-lg font-bold hover:bg-[#234b61] transition-colors">
                  {t('courses.buy')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
