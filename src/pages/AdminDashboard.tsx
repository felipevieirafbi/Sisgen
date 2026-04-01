import { useEffect, useState } from "react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, Activity, FileText, Settings, LogOut, CheckCircle, Clock, Plus, LayoutDashboard, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import KanbanBoard from "../components/KanbanBoard";
import CreateLeadModal from "../components/CreateLeadModal";
import Dashboard from "../components/Dashboard";
import TaskCalendar from "../components/TaskCalendar";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leads");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async (currentUser: any) => {
      try {
        let isUserAdmin = false;
        
        // Check if user is the default admin or has admin role
        if (currentUser.email === "felipe.vieira.consultoria@gmail.com" && currentUser.emailVerified) {
          isUserAdmin = true;
        } else {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            isUserAdmin = true;
          }
        }

        if (!isUserAdmin) {
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);

        // Fetch Leads
        try {
          const leadsSnapshot = await getDocs(collection(db, "diagnostic_leads"));
          const leadsData: any[] = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by newest first
          leadsData.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setLeads(leadsData);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, "diagnostic_leads");
        }

        // Fetch Purchases
        try {
          const purchasesSnapshot = await getDocs(collection(db, "purchases"));
          const purchasesData: any[] = purchasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPurchases(purchasesData);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, "purchases");
        }

      } catch (error) {
        console.error("Error checking admin status:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminAndFetchData(user);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const lastEditedBy = auth.currentUser?.email || 'admin';
      await updateDoc(doc(db, "diagnostic_leads", leadId), {
        status: newStatus,
        lastEditedBy,
        updatedAt: serverTimestamp()
      });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, status: newStatus, lastEditedBy } : lead));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `diagnostic_leads/${leadId}`);
    }
  };

  const updateLead = async (leadId: string, updatedData: any) => {
    try {
      const lastEditedBy = auth.currentUser?.email || 'admin';
      const dataToUpdate = {
        ...updatedData,
        lastEditedBy,
        updatedAt: serverTimestamp()
      };
      await updateDoc(doc(db, "diagnostic_leads", leadId), dataToUpdate);
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, ...dataToUpdate } : lead));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `diagnostic_leads/${leadId}`);
    }
  };

  const deleteLeadPermanently = async (leadId: string) => {
    try {
      await deleteDoc(doc(db, "diagnostic_leads", leadId));
      setLeads(leads.filter(lead => lead.id !== leadId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `diagnostic_leads/${leadId}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('admin.loading')}</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#e8e0d8] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1b3a4b] text-white flex flex-col flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-[#234b61]">
          <h2 className="text-xl font-bold">{t('admin.title')}</h2>
          <p className="text-sm text-gray-300 mt-1">{t('admin.subtitle')}</p>
        </div>
        <nav className="flex md:flex-col overflow-x-auto p-2 md:p-4 gap-2 md:gap-0 md:space-y-2">
          <button 
            onClick={() => setActiveTab("leads")}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'leads' ? 'bg-[#234b61] text-white' : 'text-gray-300 hover:bg-[#234b61]'}`}
          >
            <Users size={18} className="md:w-5 md:h-5" />
            {t('admin.leads')}
          </button>
          <button 
            onClick={() => setActiveTab("sales")}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'sales' ? 'bg-[#234b61] text-white' : 'text-gray-300 hover:bg-[#234b61]'}`}
          >
            <DollarSign size={18} className="md:w-5 md:h-5" />
            {t('admin.sales')}
          </button>
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'dashboard' ? 'bg-[#234b61] text-white' : 'text-gray-300 hover:bg-[#234b61]'}`}
          >
            <LayoutDashboard size={18} className="md:w-5 md:h-5" />
            {t('admin.dashboard')}
          </button>
          <button 
            onClick={() => setActiveTab("calendar")}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'calendar' ? 'bg-[#234b61] text-white' : 'text-gray-300 hover:bg-[#234b61]'}`}
          >
            <CalendarIcon size={18} className="md:w-5 md:h-5" />
            {t('admin.calendar')}
          </button>
          <button 
            onClick={() => setActiveTab("metrics")}
            className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${activeTab === 'metrics' ? 'bg-[#234b61] text-white' : 'text-gray-300 hover:bg-[#234b61]'}`}
          >
            <Activity size={18} className="md:w-5 md:h-5" />
            {t('admin.metrics')}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className={`${activeTab === 'leads' ? 'w-full' : 'max-w-7xl mx-auto'}`}>
          
          {activeTab === "leads" && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.leads_title')}</h1>
                <div className="flex items-center gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                    {t('admin.total_leads', { count: leads.filter(l => l.status !== 'trash').length })}
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#1b3a4b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#234b61] transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t('admin.kanban.create_lead', 'Create Lead')}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-220px)] overflow-hidden">
                <div className="p-4 h-full overflow-x-auto">
                  <KanbanBoard leads={leads} onStatusChange={updateLeadStatus} onUpdateLead={updateLead} onDeleteLead={deleteLeadPermanently} />
                </div>
              </div>
              
              <CreateLeadModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onLeadCreated={(newLead) => setLeads([newLead, ...leads])} 
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.dashboard')}</h1>
              <Dashboard leads={leads.filter(l => l.status !== 'trash')} />
            </div>
          )}

          {activeTab === "sales" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.sales_control')}</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">{t('admin.sales_module')}</h3>
                <p className="text-gray-500">
                  {purchases.length === 0 
                    ? t('admin.no_sales') 
                    : t('admin.sales_count', { count: purchases.length })}
                </p>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.general_metrics')}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.total_diags')}</h3>
                  <p className="text-3xl font-bold text-[#1b3a4b]">{leads.filter(l => l.status !== 'trash').length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.high_risk_leads')}</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {leads.filter(l => l.riskLevel === 'high' && l.status !== 'trash').length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.conversion_rate')}</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {leads.filter(l => l.status !== 'trash').length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.filter(l => l.status !== 'trash').length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="h-full">
              <TaskCalendar leads={leads.filter(l => l.status !== 'trash')} />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
