import React from 'react';
import { Cloud, History, Trash2 } from 'lucide-react';

export default function HistoryTab({ savedMissions, setCurrentMission, setActiveTab, handleDeleteMission }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase mb-8">Oppdrag <Cloud className="inline w-6 h-6 ml-2 text-sky-500" /></h2>
      {savedMissions.length === 0 ? (
        <p className="text-center font-black uppercase text-slate-300">Ingen oppdrag i databasen</p>
      ) : (
        savedMissions.sort((a,b) => b.lastUpdated - a.lastUpdated).map(mission => (
          <div key={mission.id} className="bg-white p-6 rounded-3xl flex justify-between shadow-sm group border border-slate-100 hover:border-black transition-all">
            <div>
              <h3 className="font-black text-xl uppercase">{mission.title}</h3>
              <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase mt-1">
                <span>{mission.client}</span><span>•</span><span>{mission.date}</span>
                <span>•</span><span>{mission.items?.length || 0} kolli</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCurrentMission(mission); setActiveTab('mission'); }} className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all">Åpne</button>
              <button onClick={() => handleDeleteMission(mission.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
