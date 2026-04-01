import React, { useState } from 'react';
import { Search, Plus, MapPin, Edit2, Grid, List, Copy } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { Item, AppSettings } from '../types';

interface InventoryTabProps {
  filteredInventory: Item[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  setEditingModal: (state: { isOpen: boolean; item: Item | null }) => void;
  openAddToListModal: (item: Item) => void;
  normalizeItem: (item: any) => Item;
  forcedViewMode?: 'grid' | 'list';
  isSidebar?: boolean;
  readOnly?: boolean;
  globalUsageMap?: Record<string, number>;
  settings: AppSettings;
  logError: (message: string, type?: string, source?: string) => void;
}

export default function InventoryTab({ 
  filteredInventory, 
  searchQuery, 
  setSearchQuery, 
  categoryFilter, 
  setCategoryFilter, 
  setEditingModal, 
  openAddToListModal,
  normalizeItem,
  forcedViewMode,
  isSidebar,
  readOnly,
  globalUsageMap,
  settings,
  logError
}: InventoryTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(forcedViewMode || 'grid');
  const activeView = forcedViewMode || viewMode;

  return (
    <div className={`flex flex-col h-full ${isSidebar ? 'p-2' : ''}`}>
      <div className={`flex flex-wrap items-center bg-white shadow-sm border border-slate-200 ${isSidebar ? 'p-4 rounded-[2rem] mb-4 gap-3 bg-[#FAFAFC]' : 'p-5 rounded-2xl mb-8 gap-4'}`}>
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Søk i utstyr..." className="w-full pl-10 pr-4 py-3 border border-slate-100 bg-white rounded-xl font-medium text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        
        {!isSidebar && (
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${activeView === 'grid' ? 'bg-white shadow-sm text-black' : 'text-slate-400 hover:text-slate-600'}`}><Grid className="w-4 h-4"/></button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${activeView === 'list' ? 'bg-white shadow-sm text-black' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4"/></button>
          </div>
        )}

        <div className={`flex flex-wrap items-center gap-2 ${isSidebar ? 'w-full' : 'ml-4'}`}>
           {!isSidebar && <span className="text-xs font-black text-slate-400 uppercase mr-2 ml-4">Filter:</span>}
           {CATEGORIES.map(cat => (
             <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${categoryFilter === cat ? 'bg-black text-white shadow-sm border-black' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
               {cat}
             </button>
           ))}
        </div>
      </div>

      <div className={`custom-scrollbar flex-1 overflow-y-auto ${activeView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1 pb-4" : "flex flex-col gap-4 px-1 pb-4"}`}>
        {categoryFilter === 'Alle' && searchQuery === '' && !readOnly && (
           <button onClick={() => setEditingModal({ isOpen: true, item: { id: Date.now().toString(), name: '', category: 'Lyd', price: 0, weight: 0, location: '', accessoryGroups: [], itemType: 'unique' } as Item })} className={`bg-white shadow-sm border-2 border-dashed border-slate-200 hover:border-black transition-all group shrink-0 ${activeView === 'grid' ? 'p-5 rounded-[2rem] flex flex-col items-center justify-center min-h-[180px]' : 'p-4 rounded-[1.5rem] flex items-center justify-center gap-4 min-h-[70px]'}`}>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
               <Plus className="w-5 h-5" />
             </div>
             <span className={`text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black ${activeView === 'grid' ? 'mt-4' : ''}`}>Legg til utstyr</span>
           </button>
        )}
        
        {filteredInventory.map(item => (
          <div key={item.id} draggable={!readOnly} onDragStart={(e) => !readOnly && e.dataTransfer.setData('item', JSON.stringify(item))} className={`bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-300 transition-all ${readOnly ? 'cursor-default' : 'cursor-move'} group relative overflow-hidden shrink-0 ${activeView === 'grid' ? 'p-6' : `p-4 flex items-center justify-between gap-4 ${isSidebar ? 'px-5' : 'px-8'}`}`}>
            <div className={`flex ${activeView === 'grid' ? 'justify-between items-start mb-4' : 'items-center gap-4 flex-1 overflow-hidden'}`}>
              <div className={activeView === 'list' ? 'flex flex-col md:flex-row md:items-center md:gap-6 flex-1 overflow-hidden' : 'space-y-1'}>
                <div className="flex items-center shrink-0 mb-1.5 md:mb-0">
                   <span className="text-[9px] font-black text-slate-500 uppercase px-2.5 py-1 bg-slate-100/80 rounded-lg whitespace-nowrap">{item.category}</span>
                   {item.itemType === 'bulk' && <span className="text-[9px] font-black text-sky-600 uppercase px-2.5 py-1 bg-sky-50 rounded-lg ml-2 whitespace-nowrap">{item.stock || 1} STK</span>}
                </div>
                <h3 className={`font-black text-slate-900 uppercase leading-tight truncate ${activeView === 'grid' ? 'text-lg mt-2' : `text-sm sm:text-base ${isSidebar ? 'max-w-[200px]' : 'max-w-[300px]'}`}`}>{item.name}</h3>
                {globalUsageMap && (() => {
                   const total = (item.itemType === 'bulk' ? (item.stock || 0) : 1);
                   const available = Math.max(0, total - (globalUsageMap[item.id] || 0));
                   const thresholdPercent = settings?.stockThreshold || 20;
                   const threshold = Math.ceil(total * (thresholdPercent / 100));
                   let colorClass = 'text-sky-500';
                   if (available === 0) colorClass = 'text-red-500';
                   else if (available <= threshold) colorClass = 'text-amber-500';
                   
                   return (
                     <div className={`text-[9px] font-black uppercase mt-0.5 ${colorClass}`}>
                        Tilgjengelig: {available}
                     </div>
                   );
                })()}
                {!isSidebar && <p className={`text-[10px] text-slate-400 flex items-center gap-1.5 font-bold uppercase shrink-0 ${activeView === 'grid' ? 'mt-1' : ''}`}><MapPin className="w-3 h-3"/> {item.location}</p>}
              </div>

              <div className={`flex gap-2 shrink-0 ${activeView === 'list' && !isSidebar ? 'opacity-0 group-hover:opacity-100 transition-all' : ''}`}>
                {isSidebar && (
                  <button onClick={() => openAddToListModal(item)} disabled={readOnly} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-20"><Plus className="w-5 h-5"/></button>
                )}
                {!isSidebar && !readOnly && (
                  <>
                    <button onClick={() => setEditingModal({ isOpen: true, item: normalizeItem({ ...item, id: null, name: item.name + ' (Kopi)' }) })} title="Dupliser" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-black hover:text-white transition-all shadow-lg hidden sm:flex"><Copy className="w-4 h-4"/></button>
                    <button onClick={() => setEditingModal({ isOpen: true, item: normalizeItem({ ...item }) })} title="Rediger" className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-lg hidden sm:flex"><Edit2 className="w-5 h-5"/></button>
                  </>
                )}
              </div>
            </div>

            {!isSidebar && (
              <div className={`flex ${activeView === 'grid' ? 'mt-6 justify-between items-end border-t pt-4 border-slate-50' : 'items-center gap-8 w-48 justify-end shrink-0'}`}>
                <div className="text-[10px] sm:text-xs font-bold text-slate-400">Vekt: <span className="text-slate-900 ml-1">{item.weight} kg</span></div>
                <div className="text-right">
                  <div className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase">Per dag</div>
                  <div className="text-lg sm:text-xl font-black text-slate-900">{item.price},-</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
