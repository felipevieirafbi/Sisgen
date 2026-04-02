import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Shield, ShieldOff, User, Mail, Calendar, Search } from "lucide-react";

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{userId: string, newRole: string, message: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation date (newest first)
      usersData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });
      setUsers(usersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "client" : "admin";
    const message = newRole === "admin" 
      ? t('admin.users.confirm_promote') 
      : t('admin.users.confirm_demote');
    setConfirmDialog({ userId, newRole, message });
  };

  const executeRoleChange = async () => {
    if (!confirmDialog) return;
    const { userId, newRole } = confirmDialog;

    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setConfirmDialog(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">{t('admin.loading')}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.users_management')}</h1>
        <p className="text-gray-500">{t('admin.users_subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('admin.users.name') + ' / ' + t('admin.users.email')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b3a4b] focus:border-transparent outline-none"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Total: {filteredUsers.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">{t('admin.users.name')}</th>
                <th className="p-4 font-semibold">{t('admin.users.email')}</th>
                <th className="p-4 font-semibold">{t('admin.users.role')}</th>
                <th className="p-4 font-semibold">{t('admin.users.joined')}</th>
                <th className="p-4 font-semibold text-right">{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1b3a4b] text-white flex items-center justify-center font-bold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                      </div>
                      <span className="font-medium text-gray-900">{user.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {user.role === 'admin' ? t('admin.users.role_admin') : t('admin.users.role_client')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar size={14} />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {/* Don't allow changing the super admin role */}
                    {user.email !== "felipe.vieira.consultoria@gmail.com" && (
                      <button
                        onClick={() => handleToggleClick(user.id, user.role)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          user.role === 'admin'
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                            : 'text-[#1b3a4b] bg-blue-50 hover:bg-blue-100 border border-blue-200'
                        }`}
                        title={user.role === 'admin' ? t('admin.users.demote') : t('admin.users.promote')}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <ShieldOff size={16} />
                            <span className="hidden sm:inline">{t('admin.users.demote')}</span>
                          </>
                        ) : (
                          <>
                            <Shield size={16} />
                            <span className="hidden sm:inline">{t('admin.users.promote')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmDialog.newRole === 'admin' ? t('admin.users.promote') : t('admin.users.demote')}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('admin.kanban.cancel')}
              </button>
              <button
                onClick={executeRoleChange}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmDialog.newRole === 'admin' ? 'bg-[#1b3a4b] hover:bg-[#234b61]' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {t('admin.kanban.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
