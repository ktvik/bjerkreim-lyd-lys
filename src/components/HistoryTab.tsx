import React, { useState, useMemo } from 'react';
import { Cloud, History, Trash2, Calendar, User, Clock } from 'lucide-react';
import { Mission, Personnel } from '../types';

interface HistoryTabProps {
  savedMissions: Mission[];
  setCurrentMission: (m: Mission) => void;
  setActiveTab: (t: string) => void;
  handleDeleteMission: (id: string) => void;
  personnel: Personnel[];
  readOnly: boolean;
  logError: (message: string, type?: string, source?: string) => void;
}

export default function HistoryTab({ 
  savedMissions, 
  setCurrentMission, 
  setActiveTab, 
  handleDeleteMission, 
  personnel, 
  readOnly,
  logError
}: HistoryTabProps) {
  const [filter, setFilter] = useState('active'); // active, ongoing, future, completed, all

  const filteredMissions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return savedMissions.filter(m => {
      const start = m.startDate;
      const end = m.endDate;
      
      // @ts-ignore - markedForDeletion might be added dynamically or from firestore
      if (filter === 'deleted') return m.markedForDeletion;
      // @ts-ignore
      if (m.markedForDeletion) return false;

      if (filter === 'active') return (end >= today || !end);
      if (filter === 'ongoing') return start <= today && end >= today;
      if (filter === 'future') return start > today;
      if (filter === 'completed') return end < today && end !== '';
      return true;
    }).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [savedMissions, filter]);

  const getResponsibleName = (id?: string) => personnel.find(p => p.id === id)?.name || 'Ikke oppført';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
             Arkiv <Cloud className="w-8 h-8 text-sky-500" />
          </h2>
          <p className="text-slate-400 font-black text-[10px] uppercase mt-1 tracking-widest leading-none">Oversikt over alle lagrede oppdrag</p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto custom-scrollbar">
          {[
            { id: 'active', label: 'Aktive' },
            { id: 'ongoing', label: 'Pågående' },
            { id: 'future', label: 'Fremtidige' },
            { id: 'completed', label: 'Gjennomførte' },
            { id: 'deleted', label: 'Sletting' },
            { id: 'all', label: 'Alle' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id)} 
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap ${filter === f.id ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
           <History className="w-16 h-16 mx-auto text-slate-100 mb-4" />
           <p className="font-black uppercase text-slate-300 tracking-widest text-sm">Ingen oppdrag funnet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMissions.map(mission => (
            <div key={mission.id} className="bg-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm group border border-slate-100 hover:border-black transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <h3 className="font-black text-2xl uppercase tracking-tight">{mission.title}</h3>
                   {/* @ts-ignore */}
                   {mission.markedForDeletion && (
                     <span className="text-[9px] font-black bg-red-600 text-white px-2 py-1 rounded-lg uppercase">Slettet</span>
                   )}
                   {mission.endDate < new Date().toISOString().split('T')[0] && (
                     <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded-lg uppercase">Fullført</span>
                   )}
                </div>
                <div className="flex flex-wrap gap-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-500">
                     <Calendar className="w-3.5 h-3.5" /> 
                     {mission.startDate && mission.endDate ? `${mission.startDate} – ${mission.endDate}` : mission.startDate}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-500 text-black">
                     <User className="w-3.5 h-3.5" /> 
                     {getResponsibleName(mission.responsibleId)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                     <Clock className="w-3.5 h-3.5" /> 
                     {mission.items?.length || 0} kolli
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                     {mission.client || 'Ingen kunde'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setCurrentMission(mission); setActiveTab('mission'); }} 
                  className="px-8 py-3.5 bg-black text-white rounded-2xl text-[11px] font-black uppercase hover:bg-slate-800 shadow-lg shadow-black/10 transition-all flex items-center gap-2"
                >Åpne</button>
                {!readOnly && (
                  <button onClick={() => handleDeleteMission(mission.id)} className="p-3.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
