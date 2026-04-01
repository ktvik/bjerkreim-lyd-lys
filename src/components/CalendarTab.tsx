import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { Mission } from '../types';

interface CalendarTabProps {
  savedMissions: Mission[];
  setCurrentMission: (m: Mission) => void;
  setActiveTab: (t: string) => void;
}

export default function CalendarTab({ savedMissions, setCurrentMission, setActiveTab }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Januar", "Februar", "Mars", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Desember"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to Monday start

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split('T')[0];

  const missionsByDate = useMemo(() => {
    const map: Record<string, Mission[]> = {};
    savedMissions.filter(m => !m.status?.includes('deleted')).forEach(m => {
      const start = m.startDate;
      const end = m.endDate;
      if (!start) return;

      let curr = new Date(start);
      const last = new Date(end || start);
      
      while (curr <= last) {
        const dateStr = curr.toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(m);
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [savedMissions]);

  const colors = [
    'bg-sky-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'
  ];

  const getMissionColor = (mission: Mission) => {
    const end = mission.endDate;
    if (end < todayStr) return 'bg-slate-400';
    
    const title = mission.title || 'Uten tittel';
    // Hash title to get a consistent color
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
             Kalender <CalendarIcon className="w-8 h-8 text-indigo-500" />
          </h2>
          <p className="text-slate-400 font-black text-[10px] uppercase mt-1 tracking-widest leading-none">Oversikt over alle planlagte oppdrag</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft className="w-5 h-5"/></button>
           <div className="text-sm font-black uppercase min-w-[140px] text-center">{monthNames[month]} {year}</div>
           <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map(d => (
            <div key={d} className="p-4 text-center text-[10px] font-black uppercase text-slate-400">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array(firstDay).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[140px] p-2 border-r border-b border-slate-50 bg-slate-50/30" />
          ))}
          {Array(days).fill(null).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const missions = missionsByDate[dateStr] || [];
            const isToday = todayStr === dateStr;

            return (
              <div key={dayNum} className={`min-h-[140px] p-2 border-r border-b border-slate-50 transition-all hover:bg-slate-50/50 ${isToday ? 'bg-indigo-50/20' : ''}`}>
                <div className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-lg mb-2 ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                   {dayNum}
                </div>
                <div className="space-y-1">
                  {missions.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setCurrentMission(m); setActiveTab('mission'); }}
                      className={`w-full text-left p-1.5 rounded-lg text-[9px] font-bold text-white uppercase truncate shadow-sm hover:scale-[1.02] transition-all flex items-center gap-1.5 ${getMissionColor(m)}`}
                    >
                      <div className="w-1 h-1 bg-white rounded-full shrink-0" />
                      {m.title || 'Uten tittel'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
