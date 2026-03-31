import React from 'react';
import { CompanyLogo } from './CompanyLogo';

export default function PrintView({ currentMission, inventory }) {
  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-16 text-black font-sans uppercase overflow-visible h-auto min-h-screen relative">
      <div className="flex justify-between items-start border-b-[12px] border-black pb-16 mb-16">
        <div className="flex items-center gap-10">
           <CompanyLogo className="w-32 h-32" />
           <div><h1 className="text-6xl font-black mb-4 tracking-tighter">Bjerkreim Lyd & Lys AS</h1><p className="text-lg font-black text-slate-400 tracking-[0.4em]">Plukkliste & Pakkseddel</p></div>
        </div>
        <div className="text-right">
           <div className="text-8xl font-black text-slate-100 tracking-tighter mb-4 opacity-50">LISTE</div>
           <p className="text-3xl font-black text-black tracking-widest">{currentMission.title || 'Uten navn'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-20 mb-20 bg-slate-50 p-12 rounded-[3rem]">
         <div><p className="text-[11px] font-black text-slate-300 tracking-[0.3em] mb-4">Prosjekt / Kunde</p><p className="text-3xl font-black">{currentMission.client || '---'}</p></div>
         <div className="text-right"><p className="text-[11px] font-black text-slate-300 tracking-[0.3em] mb-4">Dato & Sted</p><p className="text-2xl font-black">{currentMission.location || 'Lager'}</p><p className="text-xl font-bold text-slate-400 mt-2">{currentMission.date}</p></div>
      </div>
      
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-4 border-black">
            <th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 uppercase">Utstyr & Detaljer</th>
            <th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-center uppercase">Lager</th>
            <th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-right uppercase">Vekt</th>
            <th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-center w-32 uppercase">OK</th>
          </tr>
        </thead>
        <tbody>
          {currentMission.items.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="py-10">
                 <div className="font-black text-3xl tracking-tight uppercase">{item.name}</div>
                 <div className="text-[11px] font-black text-slate-400 mt-5 flex flex-wrap gap-4 uppercase">
                    {[...Object.values(item.selections.required || {}), ...(item.selections.optional || [])].map((s, i) => (<span key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">● {s}</span>))}
                 </div>
              </td>
              <td className="py-10 text-center font-black text-2xl tracking-tight uppercase tracking-tighter">{inventory.find(i => i.id === item.id)?.location || '--'}</td>
              <td className="py-10 text-right font-black text-2xl tracking-tight uppercase tracking-tighter">{item.weight} kg</td>
              <td className="py-10 text-center"><div className="w-14 h-14 border-8 border-slate-100 rounded-[1.5rem] mx-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-24 flex justify-between border-t-[12px] border-black pt-16 uppercase">
         <div className="space-y-12">
            <div><p className="text-[12px] font-black text-slate-300 tracking-[0.4em] mb-6">Ansvarlig Utlevering</p><div className="w-96 h-1 bg-slate-100" /></div>
            <p className="text-[11px] text-slate-300 font-black italic">Sjekk kabelbrudd ved retur.</p>
         </div>
         <div className="text-right">
            <div className="text-xl font-black text-slate-300 tracking-[0.3em] mb-4">Enheter: <span className="text-black ml-6">{currentMission.items.length}</span></div>
            <div className="text-xl font-black text-slate-300 tracking-[0.3em] mb-4">Vekt: <span className="text-black ml-6">{currentMission.items.reduce((acc, i) => acc + (i.weight || 0), 0).toFixed(1)} kg</span></div>
            <div className="text-8xl font-black mt-16 tracking-tighter text-black leading-none uppercase tracking-tighter">SUM: {currentMission.items.reduce((acc, i) => acc + (i.price || 0), 0)},-</div>
         </div>
      </div>
    </div>
  );
}
