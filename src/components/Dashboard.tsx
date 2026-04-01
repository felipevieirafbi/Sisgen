import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Calendar, Phone, MapPin, Users } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  status: string;
  riskLevel: string;
  relevance?: string;
  source?: string;
  nextContactDate?: string;
  scheduledVisitDate?: string;
  scheduledMeetingDate?: string;
}

interface DashboardProps {
  leads: Lead[];
}

const COLORS = ['#1b3a4b', '#b8975a', '#234b61', '#8b5e3c', '#f5f0eb'];

export default function Dashboard({ leads }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('pt') ? ptBR : enUS;

  const upcomingTasks = useMemo(() => {
    const allTasks: any[] = [];
    const today = startOfDay(new Date());
    const nextWeek = addDays(today, 7);

    leads.forEach(lead => {
      if (lead.nextContactDate) {
        const date = new Date(lead.nextContactDate);
        if (isAfter(date, today) && isBefore(date, nextWeek)) {
          allTasks.push({ id: `${lead.id}-contact`, leadName: lead.name, date, type: 'contact' });
        }
      }
      if (lead.scheduledVisitDate) {
        const date = new Date(lead.scheduledVisitDate);
        if (isAfter(date, today) && isBefore(date, nextWeek)) {
          allTasks.push({ id: `${lead.id}-visit`, leadName: lead.name, date, type: 'visit' });
        }
      }
      if (lead.scheduledMeetingDate) {
        const date = new Date(lead.scheduledMeetingDate);
        if (isAfter(date, today) && isBefore(date, nextWeek)) {
          allTasks.push({ id: `${lead.id}-meeting`, leadName: lead.name, date, type: 'meeting' });
        }
      }
    });
    return allTasks.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [leads]);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'contact': return <Phone size={16} className="text-blue-600" />;
      case 'visit': return <MapPin size={16} className="text-green-600" />;
      case 'meeting': return <Users size={16} className="text-purple-600" />;
      default: return <Calendar size={16} />;
    }
  };

  const getTaskTitle = (task: any) => {
    switch (task.type) {
      case 'contact': return `${t('admin.calendar.task_contact')} ${task.leadName}`;
      case 'visit': return `${t('admin.calendar.task_visit')} ${task.leadName}`;
      case 'meeting': return `${t('admin.calendar.task_meeting')} ${task.leadName}`;
      default: return task.leadName;
    }
  };

  const leadsByStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(leadsByStatus).map(([name, value]) => ({ name: t(`admin.kanban.${name}`), value }));

  const leadsByRelevance = leads.reduce((acc, lead) => {
    const relevance = lead.relevance || 'low';
    acc[relevance] = (acc[relevance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relevanceData = Object.entries(leadsByRelevance).map(([name, value]) => ({ name: t(`admin.kanban.relevance_${name.toLowerCase()}`), value }));

  const leadsBySource = leads.reduce((acc, lead) => {
    const source = lead.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{t('admin.dashboard.leads_by_status')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1b3a4b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{t('admin.dashboard.leads_by_relevance')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={relevanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {relevanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{t('admin.dashboard.leads_by_source')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#b8975a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('admin.upcoming_tasks')}</h3>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t('admin.calendar.no_tasks')}
              </div>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    {getTaskIcon(task.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{getTaskTitle(task)}</p>
                    <p className="text-xs text-gray-500">{format(task.date, "EEEE, d 'de' MMMM 'às' HH:mm", { locale })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
