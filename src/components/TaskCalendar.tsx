import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, MapPin, Users } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  nextContactDate?: string;
  scheduledVisitDate?: string;
  scheduledMeetingDate?: string;
}

interface Task {
  id: string;
  leadId: string;
  leadName: string;
  date: Date;
  type: 'contact' | 'visit' | 'meeting';
}

interface TaskCalendarProps {
  leads: Lead[];
}

type ViewMode = 'month' | 'week' | 'day';

export default function TaskCalendar({ leads }: TaskCalendarProps) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const locale = i18n.language.startsWith('pt') ? ptBR : enUS;

  const tasks = useMemo(() => {
    const allTasks: Task[] = [];
    leads.forEach(lead => {
      if (lead.nextContactDate) {
        allTasks.push({
          id: `${lead.id}-contact`,
          leadId: lead.id,
          leadName: lead.name,
          date: new Date(lead.nextContactDate),
          type: 'contact'
        });
      }
      if (lead.scheduledVisitDate) {
        allTasks.push({
          id: `${lead.id}-visit`,
          leadId: lead.id,
          leadName: lead.name,
          date: new Date(lead.scheduledVisitDate),
          type: 'visit'
        });
      }
      if (lead.scheduledMeetingDate) {
        allTasks.push({
          id: `${lead.id}-meeting`,
          leadId: lead.id,
          leadName: lead.name,
          date: new Date(lead.scheduledMeetingDate),
          type: 'meeting'
        });
      }
    });
    return allTasks.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [leads]);

  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'contact': return <Phone size={14} className="text-blue-600" />;
      case 'visit': return <MapPin size={14} className="text-green-600" />;
      case 'meeting': return <Users size={14} className="text-purple-600" />;
      default: return <CalendarIcon size={14} />;
    }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'contact': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'visit': return 'bg-green-50 border-green-200 text-green-800';
      case 'meeting': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTaskTitle = (task: Task) => {
    switch (task.type) {
      case 'contact': return `${t('admin.calendar.task_contact')} ${task.leadName}`;
      case 'visit': return `${t('admin.calendar.task_visit')} ${task.leadName}`;
      case 'meeting': return `${t('admin.calendar.task_meeting')} ${task.leadName}`;
      default: return task.leadName;
    }
  };

  const renderHeader = () => {
    let title = '';
    if (viewMode === 'month') {
      title = format(currentDate, 'MMMM yyyy', { locale });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale });
      const end = endOfWeek(currentDate, { locale });
      title = `${format(start, 'MMM d', { locale })} - ${format(end, 'MMM d, yyyy', { locale })}`;
    } else {
      title = format(currentDate, 'MMMM d, yyyy', { locale });
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 capitalize">{title}</h2>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={prev} className="p-1 hover:bg-white rounded-md transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={goToToday} className="px-3 py-1 text-sm font-medium hover:bg-white rounded-md transition-colors">{t('admin.calendar.today')}</button>
            <button onClick={next} className="p-1 hover:bg-white rounded-md transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('month')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('admin.calendar.month')}
          </button>
          <button 
            onClick={() => setViewMode('week')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('admin.calendar.week')}
          </button>
          <button 
            onClick={() => setViewMode('day')} 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('admin.calendar.day')}
          </button>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale });
    const endDate = endOfWeek(monthEnd, { locale });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map(day => (
            <div key={day.toString()} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {format(day, 'EEE', { locale })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            const dayTasks = tasks.filter(task => isSameDay(task.date, day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <div 
                key={day.toString()} 
                className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : ''} ${i % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div className={`text-right text-sm mb-2 ${isToday(day) ? 'font-bold text-[#1b3a4b]' : ''}`}>
                  <span className={isToday(day) ? 'bg-[#1b3a4b] text-white w-7 h-7 inline-flex items-center justify-center rounded-full' : ''}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`text-xs p-1.5 rounded border ${getTaskColor(task.type)} truncate flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${format(task.date, 'HH:mm')} - ${getTaskTitle(task)}`}
                    >
                      {getTaskIcon(task.type)}
                      <span className="truncate">{format(task.date, 'HH:mm')} {task.leadName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { locale });
    const endDate = endOfWeek(startDate, { locale });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {days.map(day => (
            <div key={day.toString()} className={`py-3 text-center border-r border-gray-200 last:border-r-0 ${isToday(day) ? 'bg-blue-50' : ''}`}>
              <div className="text-xs font-semibold text-gray-500 uppercase">{format(day, 'EEE', { locale })}</div>
              <div className={`text-lg ${isToday(day) ? 'font-bold text-[#1b3a4b]' : 'text-gray-900'}`}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {days.map(day => {
            const dayTasks = tasks.filter(task => isSameDay(task.date, day));
            return (
              <div key={day.toString()} className={`p-2 border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`text-xs p-2 rounded-lg border ${getTaskColor(task.type)} flex flex-col gap-1`}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        {getTaskIcon(task.type)}
                        <span>{format(task.date, 'HH:mm')}</span>
                      </div>
                      <span className="font-semibold truncate">{task.leadName}</span>
                      <span className="opacity-80 truncate">{getTaskTitle(task)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = tasks.filter(task => isSameDay(task.date, currentDate));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-250px)] flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d', { locale })}
          </div>
          <div className="text-sm text-gray-500">
            {dayTasks.length} {t('admin.upcoming_tasks').toLowerCase()}
          </div>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {dayTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <CalendarIcon size={48} className="mb-4 opacity-20" />
              <p>{t('admin.calendar.no_tasks')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
              {dayTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-xl border ${getTaskColor(task.type)} flex items-start gap-4`}
                >
                  <div className="mt-1 bg-white p-2 rounded-full shadow-sm">
                    {getTaskIcon(task.type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold mb-1">{format(task.date, 'HH:mm')}</div>
                    <div className="font-semibold text-lg mb-1">{task.leadName}</div>
                    <div className="opacity-90">{getTaskTitle(task)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
