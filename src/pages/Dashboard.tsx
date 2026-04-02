import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Video, Settings, LogOut, CheckCircle, XCircle } from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
  const [activeTab, setActiveTab] = useState<'diags' | 'courses'>('diags');

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentStatus(payment);
      // Remove the parameter from the URL
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setPaymentStatus(null);
      }, 5000);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser({ id: currentUser.uid, ...userDoc.data() });
        }

        // Fetch user's diagnostic leads
        const q = query(collection(db, "diagnostic_leads"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeads(leadsData);

        // Fetch user's purchased courses
        const purchasesQ = query(collection(db, "purchases"), where("userId", "==", currentUser.uid), where("status", "==", "completed"));
        const purchasesSnapshot = await getDocs(purchasesQ);
        const purchasesData = purchasesSnapshot.docs.map(doc => doc.data());

        if (purchasesData.length > 0) {
          const productIds = purchasesData.map(p => p.productId);
          // Fetch products details
          const productsQ = query(collection(db, "products"), where("__name__", "in", productIds));
          const productsSnapshot = await getDocs(productsQ);
          const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Join purchase date with product data
          const enrichedCourses = productsData.map(product => {
            const purchase = purchasesData.find(p => p.productId === product.id);
            return {
              ...product,
              purchasedAt: purchase?.createdAt
            };
          });
          setPurchasedCourses(enrichedCourses);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('dashboard.loading')}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] flex flex-col md:flex-row">
      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 flex overflow-x-auto p-2 gap-2">
        <button 
          onClick={() => setActiveTab('diags')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${activeTab === 'diags' ? 'bg-[#f5f0eb] text-[#1b3a4b]' : 'text-gray-600 hover:bg-[#e8e0d8]'}`}
        >
          <FileText size={16} />
          {t('dashboard.diags')}
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${activeTab === 'courses' ? 'bg-[#f5f0eb] text-[#1b3a4b]' : 'text-gray-600 hover:bg-[#e8e0d8]'}`}
        >
          <Video size={16} />
          {t('dashboard.courses')}
        </button>
        <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-[#e8e0d8] rounded-lg font-medium text-sm">
          <Settings size={16} />
          {t('dashboard.settings')}
        </button>
        <button onClick={handleLogout} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm">
          <LogOut size={16} />
          {t('dashboard.logout')}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block flex-shrink-0">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#1b3a4b]">{t('dashboard.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('dashboard.welcome')}, {user?.name}</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('diags')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'diags' ? 'bg-[#f5f0eb] text-[#1b3a4b]' : 'text-gray-600 hover:bg-[#e8e0d8]'}`}
            >
              <FileText size={20} />
              {t('dashboard.my_diags')}
            </button>
            <button 
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'courses' ? 'bg-[#f5f0eb] text-[#1b3a4b]' : 'text-gray-600 hover:bg-[#e8e0d8]'}`}
            >
              <Video size={20} />
              {t('dashboard.my_courses')}
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-[#e8e0d8] rounded-lg font-medium transition-colors">
              <Settings size={20} />
              {t('dashboard.settings')}
            </button>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <LogOut size={20} />
              {t('dashboard.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {paymentStatus === 'success' && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-800">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h3 className="font-bold">Pagamento confirmado!</h3>
                <p className="text-sm">Sua compra foi processada com sucesso. O conteúdo estará disponível em breve.</p>
              </div>
            </div>
          )}
          
          {paymentStatus === 'cancelled' && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
              <XCircle className="text-red-600" size={24} />
              <div>
                <h3 className="font-bold">Pagamento cancelado</h3>
                <p className="text-sm">O processo de compra não foi concluído. Nenhuma cobrança foi realizada.</p>
              </div>
            </div>
          )}

          {activeTab === 'diags' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('dashboard.my_diags')}</h1>
              
              {leads.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboard.no_diags')}</h3>
                  <p className="text-gray-600 mb-6">{t('dashboard.no_diags_desc')}</p>
                  <button 
                    onClick={() => navigate("/diagnostic")}
                    className="bg-[#b8975a] text-[#1b3a4b] px-6 py-3 rounded-lg font-bold hover:bg-[#a47248] transition-colors"
                  >
                    {t('dashboard.start_diag')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.diag_risk')}</h3>
                        <p className="text-sm text-gray-500">
                          {t('dashboard.done_at')} {lead.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          lead.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          lead.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {t('dashboard.risk')} {lead.riskLevel === 'high' ? t('dashboard.risk_high') : lead.riskLevel === 'moderate' ? t('dashboard.risk_moderate') : t('dashboard.risk_low')}
                        </span>
                        <button className="text-[#234b61] font-medium hover:underline text-sm">
                          {t('dashboard.see_details')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('dashboard.my_courses')}</h1>
              
              {purchasedCourses.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum curso encontrado</h3>
                  <p className="text-gray-600 mb-6">Você ainda não adquiriu nenhum produto.</p>
                  <button 
                    onClick={() => navigate("/courses")}
                    className="bg-[#b8975a] text-[#1b3a4b] px-6 py-3 rounded-lg font-bold hover:bg-[#a47248] transition-colors"
                  >
                    Ver Cursos
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {purchasedCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                      <div className="p-6 flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <Video size={24} className="text-[#b8975a]" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {course.title?.pt || course.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description?.pt || course.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Adquirido em: {course.purchasedAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button 
                          onClick={() => navigate(`/course/${course.id}`)}
                          className="w-full bg-[#1b3a4b] text-white py-2 rounded-lg font-medium hover:bg-[#234b61] transition-colors"
                        >
                          Acessar Conteúdo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
