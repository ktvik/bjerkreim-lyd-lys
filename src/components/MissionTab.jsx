import React from 'react';
import { Cloud, Printer, Package, CheckCircle2, Plus, Trash2, Box, Search } from 'lucide-react';

export default function MissionTab({ 
  currentMission, 
  setCurrentMission, 
  filteredInventory, 
  setSearchQuery, 
  openAddToListModal, 
  handleSaveMissionToArchive 
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-black text-black uppercase">Prosjektdetaljer</h2>
            <div className="flex gap-2">
              <button onClick={handleSaveMissionToArchive} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Cloud className="w-4 h-4"/> Arkiver</button>
              <button onClick={() => setCurrentMission({ id: Date.now().toString(), title: '', client: '', date: '', location: '', items: [] })} className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">Tøm</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" placeholder="Navn på prosjekt" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.title} onChange={(e) => setCurrentMission({...currentMission, title: e.target.value})} />
            <input type="text" placeholder="Oppdragsgiver" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.client} onChange={(e) => setCurrentMission({...currentMission, client: e.target.value})} />
            <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-500" value={currentMission.date} onChange={(e) => setCurrentMission({...currentMission, date: e.target.value})} />
            <input type="text" placeholder="Lokasjon" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.location} onChange={(e) => setCurrentMission({...currentMission, location: e.target.value})} />
          </div>
        </div>

        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const itemData = e.dataTransfer.getData('item'); if (itemData) openAddToListModal(JSON.parse(itemData)); }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px]">
          <div className="flex justify-between items-center mb-10">
             <h2 className="text-2xl font-black text-black uppercase">Utstyrsliste</h2>
             <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-black hover:text-white transition-all"><Printer className="w-6 h-6" /></button>
          </div>

          {currentMission.items.length === 0 ? (
            <div className="h-96 border-4 border-dashed border-slate-50 flex justify-center items-center"><Package className="w-24 h-24 mb-4 opacity-10" /></div>
          ) : (
            <div className="space-y-4">
              {currentMission.items.map((item) => (
                <div key={item.instanceId} className="flex justify-between p-6 bg-white rounded-3xl border border-slate-100 hover:border-black transition-all">
                  <div className="flex-1">
                    <div className="font-black text-slate-900 uppercase text-lg">{item.name} <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded">{item.price},-</span></div>
                    <div className="flex flex-wrap gap-2 mt-4">{[...Object.values(item.selections.required || {}), ...(item.selections.optional || [])].map((v, i) => <div key={i} className="text-[9px] font-black flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase"><CheckCircle2 className="w-3 h-3 text-green-500" /> {v}</div>)}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right"><div className="text-[10px] font-black text-slate-300 uppercase mb-1">Vekt</div><div className="text-sm font-black text-slate-900">{item.weight} kg</div></div>
                    <button onClick={() => setCurrentMission(p => ({...p, items: p.items.filter(i => i.instanceId !== item.instanceId)}))} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>
                  </div>
                </div>
              ))}
              <div className="mt-12 pt-12 border-t-8 border-black flex justify-between items-end">
                <div className="space-y-3 text-[10px] font-black text-slate-400 uppercase">
                   <div>Enheter: <span className="text-slate-900 ml-4">{currentMission.items.length}</span></div>
                   <div>Vekt: <span className="text-slate-900 ml-4">{currentMission.items.reduce((a, i) => a + i.weight, 0).toFixed(1)} kg</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase font-black text-slate-300 mb-1">TOTAL LEIESUM</div>
                  <div className="text-6xl font-black text-black leading-none">{currentMission.items.reduce((a, i) => a + i.price, 0)},-</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden xl:block">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-28">
          <h2 className="text-lg font-black text-white mb-8 uppercase flex items-center gap-3"><Box className="w-6 h-6" /> Hurtigvalg</h2>
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
            <input type="text" placeholder="Søk i lager..." className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl text-sm text-white" onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-3 custom-scrollbar">
            {filteredInventory.map(item => (
              <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="p-5 bg-white/5 rounded-3xl flex items-center justify-between cursor-move hover:bg-white/10 group">
                <div><div className="text-xs font-black text-white uppercase">{item.name}</div><div className="text-[9px] text-white/30 font-black uppercase mt-1.5">{item.category} • {item.weight}kg</div></div>
                <button onClick={() => openAddToListModal(item)} className="p-2.5 bg-white text-black hover:bg-slate-200 rounded-xl"><Plus className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
