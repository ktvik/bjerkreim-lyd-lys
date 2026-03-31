import React from 'react';
import { Search, Plus, MapPin, Edit2 } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';

export default function InventoryTab({ 
  filteredInventory, 
  searchQuery, 
  setSearchQuery, 
  categoryFilter, 
  setCategoryFilter, 
  setEditingModal, 
  openAddToListModal,
  normalizeItem
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Søk i utstyr..." className="w-full pl-12 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs font-black text-slate-400 uppercase mr-2">Filter:</span>
           {CATEGORIES.map(cat => (
             <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-black text-white' : 'bg-white border hover:bg-slate-50'}`}>
               {cat}
             </button>
           ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categoryFilter === 'Alle' && searchQuery === '' && (
           <button onClick={() => setEditingModal({ isOpen: true, item: { id: Date.now().toString(), name: '', category: 'Lyd', price: 0, weight: 0, location: '', accessoryGroups: [] } })} className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-black transition-all flex flex-col items-center justify-center min-h-[180px] group">
             <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
               <Plus className="w-8 h-8" />
             </div>
             <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black">Legg til utstyr</span>
           </button>
        )}
        {filteredInventory.map(item => (
          <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-move group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase px-2 py-1 bg-slate-100 rounded-lg">{item.category}</span>
                <h3 className="font-black text-slate-900 text-lg uppercase leading-tight mt-2">{item.name}</h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-bold uppercase mt-1"><MapPin className="w-3 h-3"/> {item.location}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openAddToListModal(item)} className="p-3 bg-slate-50 border text-slate-400 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm block sm:hidden group-hover:block"><Plus className="w-5 h-5"/></button>
                <button onClick={() => setEditingModal({ isOpen: true, item: normalizeItem({ ...item }) })} className="p-3 bg-white border text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Edit2 className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-end border-t pt-4 border-slate-50">
              <div className="text-xs font-bold text-slate-400">Vekt: <span className="text-slate-900 ml-1">{item.weight} kg</span></div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-300 uppercase">Per dag</div>
                <div className="text-xl font-black text-slate-900">{item.price},-</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
