import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PlayCircle, FileText, BookOpen, Loader2 } from "lucide-react";
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

interface Product {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
}

export default function Courses() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        if (auth.currentUser.email === 'felipe.vieira.consultoria@gmail.com') {
          setIsAdmin(true);
        } else {
          const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', auth.currentUser.email)));
          if (!userDoc.empty && userDoc.docs[0].data().role === 'admin') {
            setIsAdmin(true);
          }
        }
      }
    };
    checkAdmin();
  }, []);

  const fetchProductsAndPurchases = async () => {
    try {
      const q = query(collection(db, "products"), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      // Sort products by price descending
      fetchedProducts.sort((a, b) => b.price - a.price);
      setProducts(fetchedProducts);

      if (auth.currentUser) {
        const purchasesQuery = query(
          collection(db, "purchases"),
          where("userId", "==", auth.currentUser.uid),
          where("status", "==", "completed")
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const purchasedIds = purchasesSnapshot.docs.map(doc => doc.data().productId);
        setPurchasedProductIds(purchasedIds);
      }
    } catch (error) {
      console.error("Error fetching products or purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchProductsAndPurchases();
    });
    return () => unsubscribe();
  }, []);

  const seedProducts = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const initialProducts = [
        {
          id: "masterclass",
          title: { pt: "Masterclass SisGen na Prática", en: "SisGen Masterclass in Practice", fr: "Masterclass SisGen en Pratique", es: "Masterclass SisGen en la Práctica", de: "SisGen Masterclass in der Praxis" },
          description: { pt: "Aprenda o passo a passo para regularizar sua empresa no SisGen e evitar multas milionárias.", en: "Learn step-by-step how to regularize your company in SisGen and avoid million-dollar fines.", fr: "Apprenez étape par étape comment régulariser votre entreprise dans SisGen et éviter des amendes millionnaires.", es: "Aprenda paso a paso cómo regularizar su empresa en SisGen y evitar multas millonarias.", de: "Lernen Sie Schritt für Schritt, wie Sie Ihr Unternehmen in SisGen regulieren und millionenschwere Geldstrafen vermeiden." },
          price: 49700,
          currency: "BRL",
          category: "course",
          isActive: true,
          createdAt: serverTimestamp()
        },
        {
          id: "toolkit",
          title: { pt: "Toolkit de Compliance", en: "Compliance Toolkit", fr: "Boîte à outils de conformité", es: "Kit de herramientas de cumplimiento", de: "Compliance-Toolkit" },
          description: { pt: "Modelos de contratos, planilhas de controle e checklists completos para sua equipe.", en: "Contract templates, control spreadsheets, and complete checklists for your team.", fr: "Modèles de contrats, feuilles de calcul de contrôle et listes de contrôle complètes pour votre équipe.", es: "Plantillas de contratos, hojas de cálculo de control y listas de verificación completas para su equipo.", de: "Vertragsvorlagen, Kontrolltabellen und vollständige Checklisten für Ihr Team." },
          price: 29700,
          currency: "BRL",
          category: "toolkit",
          isActive: true,
          createdAt: serverTimestamp()
        },
        {
          id: "ebook",
          title: { pt: "E-book: Guia Definitivo SisGen", en: "E-book: Definitive SisGen Guide", fr: "E-book : Guide définitif SisGen", es: "E-book: Guía definitiva SisGen", de: "E-Book: Der ultimative SisGen-Leitfaden" },
          description: { pt: "Tudo o que você precisa saber sobre a Lei da Biodiversidade em uma leitura rápida e direta.", en: "Everything you need to know about the Biodiversity Law in a quick and direct read.", fr: "Tout ce que vous devez savoir sur la loi sur la biodiversité dans une lecture rapide et directe.", es: "Todo lo que necesita saber sobre la Ley de Biodiversidad en una lectura rápida y directa.", de: "Alles, was Sie über das Biodiversitätsgesetz in einer schnellen und direkten Lektüre wissen müssen." },
          price: 9700,
          currency: "BRL",
          category: "ebook",
          isActive: true,
          createdAt: serverTimestamp()
        }
      ];

      for (const prod of initialProducts) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      await fetchProductsAndPurchases();
    } catch (error) {
      console.error("Error seeding products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (productId: string) => {
    setCheckoutLoading(productId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          productId,
          userId: auth.currentUser?.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(t('diag.error', 'Ocorreu um erro ao iniciar o pagamento.'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'course': return <PlayCircle size={32} className="text-[#b8975a]" />;
      case 'toolkit': return <FileText size={32} className="text-[#b8975a]" />;
      case 'ebook': return <BookOpen size={32} className="text-[#b8975a]" />;
      default: return <PlayCircle size={32} className="text-[#b8975a]" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

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
          {loading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1b3a4b]" />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500 mb-4">Nenhum produto disponível no momento.</p>
              {isAdmin && (
                <button 
                  onClick={seedProducts}
                  className="px-4 py-2 bg-[#b8975a] text-white rounded-lg hover:bg-[#a0834e] transition-colors"
                >
                  Inicializar Produtos (Admin)
                </button>
              )}
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-8 flex-grow flex flex-col items-center text-center">
                  <div className="bg-yellow-50 p-4 rounded-full mb-6">
                    {getIcon(product.category)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {product.title[i18n.language] || product.title['pt']}
                  </h3>
                  <p className="text-gray-600 mb-6 flex-grow">
                    {product.description[i18n.language] || product.description['pt']}
                  </p>
                  <div className="text-2xl font-extrabold text-[#1b3a4b] mb-6">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  {purchasedProductIds.includes(product.id) ? (
                    <Link 
                      to={`/course/${product.id}`}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex justify-center items-center"
                    >
                      Acessar Curso
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleCheckout(product.id)}
                      disabled={checkoutLoading === product.id}
                      className="w-full bg-[#1b3a4b] text-white py-3 rounded-lg font-bold hover:bg-[#234b61] transition-colors flex justify-center items-center"
                    >
                      {checkoutLoading === product.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        t('courses.buy')
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
