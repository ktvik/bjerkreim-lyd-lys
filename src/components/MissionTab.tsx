import React, { useState, useMemo } from 'react';
import { Cloud, Printer, Package, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import InventoryTab from './InventoryTab';
import { Item, Mission, MissionItem, Personnel, AppSettings } from '../types';

interface PlukkListeProps {
  items: MissionItem[];
  isOverStock: (id: string) => boolean;
}

interface AccItem {
  name: string;
  qty: number;
  id: string | null;
}

function PlukkListe({ items, isOverStock }: PlukkListeProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const acc: Record<string, AccItem> = {};

  const add = (key: string, name: string, qty: number, id: string | null) => {
    if (!acc[key]) acc[key] = { name, qty: 0, id };
    acc[key].qty += qty;
  };

  items.forEach((item) => {
    const parentQty = item.quantity || 1;
    add(`main__${item.id}`, item.name, parentQty, item.id);

    if (item.rawSelections && item.rawSelections.length > 0) {
      item.rawSelections.forEach((sel: any) => {
        add(`acc__${sel.id}`, sel.name, (sel.quantity || 1) * parentQty, sel.id);
      });
    } else {
      const parseLabel = (label: string) => {
        const m = label.match(/^(\d+)x\s+(.+)$/);
        return m ? { qty: parseInt(m[1]), name: m[2] } : { qty: 1, name: label };
      };
      const allLabels = [
        ...Object.values(item.selections?.required || {}),
        ...(item.selections?.optional || []),
      ];
      allLabels.forEach((label) => {
        const { qty, name } = parseLabel(label);
        add(`sel__${name}`, name, qty * parentQty, null);
      });
    }
  });

  const rows = Object.entries(acc).map(([key, { name, qty, id }]) => ({ key, name, qty, id }));

  const toggle = (key: string) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const doneCount = rows.filter(r => checked[r.key]).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-slate-400 uppercase">Plukkede linjer</span>
        <span className="text-sm font-black text-slate-900">{doneCount} / {rows.length}</span>
      </div>
      {rows.map((row) => {
        const overStock = row.id && isOverStock(row.id);
        return (
        <button
          key={row.key}
          onClick={() => toggle(row.key)}
          className={`w-full flex items-center gap-5 p-5 rounded-2xl border transition-all text-left ${
            checked[row.key]
              ? 'bg-slate-50 border-slate-200 opacity-40'
              : overStock 
                ? 'bg-red-50 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.05)]'
                : 'bg-white border-slate-100 hover:border-black'
          }`}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            checked[row.key] ? 'bg-black border-black' : overStock ? 'border-red-500' : 'border-slate-300'
          }`}>
            {checked[row.key] && <svg viewBox="0 0 10 8" className="w-3 h-3 fill-white"><path d="M1 4l2.5 2.5L9 1"/></svg>}
          </div>
          <div className="flex-1">
            <div className={`font-black uppercase text-base ${checked[row.key] ? 'line-through text-slate-400' : overStock ? 'text-red-900' : 'text-slate-900'}`}>
              {row.name}
            </div>
            {row.key.startsWith('acc__') && (
              <div className={`text-[10px] font-black uppercase mt-0.5 ${overStock ? 'text-red-500' : 'text-slate-400'}`}>Tilleggsutstyr</div>
            )}
            {overStock && <div className="text-[9px] font-black text-red-600 uppercase mt-1">LAGERMANGEL</div>}
          </div>
          {row.qty > 1 && (
            <div className={`text-lg font-black ${checked[row.key] ? 'text-slate-300' : overStock ? 'text-red-600' : 'text-sky-500'}`}>
              {row.qty}x
            </div>
          )}
        </button>
        );
      })}
      {doneCount === rows.length && rows.length > 0 && (
        <div className="mt-6 p-5 bg-black text-white rounded-2xl text-center text-sm font-black uppercase">
          ✓ Alt utstyr er plukket
        </div>
      )}
    </div>
  );
}

interface MissionTabProps {
  currentMission: Mission;
  setCurrentMission: React.Dispatch<React.SetStateAction<Mission>>;
  inventory: Item[];
  savedMissions: Mission[];
  personnel: Personnel[];
  filteredInventory: Item[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  setEditingModal: (m: { isOpen: boolean; item: Item | null }) => void;
  normalizeItem: (item: any) => Item;
  openAddToListModal: (item: Item) => void;
  handleSaveMissionToArchive: () => void;
  handleDeleteMission: (id: string) => void;
  updateQuantity: (instanceId: string, newQty: number) => void;
  readOnly: boolean;
  settings: AppSettings;
  logError: (message: string, type?: string, source?: string) => void;
}

export default function MissionTab({ 
  currentMission, 
  setCurrentMission, 
  inventory,
  savedMissions,
  personnel,
  filteredInventory, 
  searchQuery,
  setSearchQuery, 
  categoryFilter,
  setCategoryFilter,
  setEditingModal,
  normalizeItem,
  openAddToListModal, 
  handleSaveMissionToArchive,
  handleDeleteMission,
  updateQuantity,
  readOnly,
  settings,
  logError
}: MissionTabProps) {
  const [listTab, setListTab] = useState<'utstyr' | 'plukk'>('utstyr');

  // Calculates total usage across all missions that overlap with current mission dates
  const globalUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    const currentStart = currentMission.startDate;
    const currentEnd = currentMission.endDate;
    
    if (!currentStart || !currentEnd) {
      // If no dates set yet, only count current mission items
      currentMission.items.forEach(item => {
        const qty = item.quantity || 1;
        map[item.id] = (map[item.id] || 0) + qty;
        item.rawSelections?.forEach(sel => {
          map[sel.id] = (map[sel.id] || 0) + (sel.quantity || 1) * qty;
        });
      });
      return map;
    }

    const addUsage = (missionItems: MissionItem[]) => {
      missionItems.forEach(item => {
        const qty = item.quantity || 1;
        map[item.id] = (map[item.id] || 0) + qty;
        item.rawSelections?.forEach(sel => {
          map[sel.id] = (map[sel.id] || 0) + (sel.quantity || 1) * qty;
        });
      });
    };

    // 1. Process all overlapping saved missions (excluding the current one if it exists in archive)
    savedMissions.forEach(m => {
      if (m.id === currentMission.id) return;
      const s = m.startDate;
      const e = m.endDate;
      if (s && e && s <= currentEnd && e >= currentStart) {
        addUsage(m.items || []);
      }
    });

    // 2. Process current mission items
    addUsage(currentMission.items || []);

    return map;
  }, [currentMission, savedMissions]);

  const isOverStock = (itemId: string) => {
    const invItem = inventory.find(i => i.id === itemId);
    if (!invItem) return false;
    const stock = invItem.itemType === 'bulk' ? (invItem.stock || 0) : 1;
    return (globalUsageMap[itemId] || 0) > stock;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-2xl font-black text-black uppercase">Prosjektdetaljer</h2>
            <div className="flex gap-2">
              <button onClick={handleSaveMissionToArchive} disabled={readOnly} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"><Cloud className="w-4 h-4"/> Arkiver</button>
              <button onClick={() => !readOnly && setCurrentMission({ id: Date.now().toString(), title: '', client: '', startDate: '', endDate: '', location: '', items: [] })} disabled={readOnly} className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase disabled:opacity-30">Nytt</button>
              {savedMissions.some(m => m.id === currentMission.id) && !readOnly && (
                <button onClick={() => handleDeleteMission(currentMission.id)} className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase">Slett oppdrag</button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <input type="text" placeholder="Navn på prosjekt" readOnly={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.title} onChange={(e) => setCurrentMission({...currentMission, title: e.target.value})} />
            <input type="text" placeholder="Oppdragsgiver" readOnly={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.client} onChange={(e) => setCurrentMission({...currentMission, client: e.target.value})} />
            <input type="text" placeholder="Lokasjon" readOnly={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.location} onChange={(e) => setCurrentMission({...currentMission, location: e.target.value})} />
            
            <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Fra dato</label>
               <input type="date" readOnly={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 border-2 border-transparent focus:border-black transition-all" value={currentMission.startDate || ''} onChange={(e) => setCurrentMission({...currentMission, startDate: e.target.value})} />
            </div>
            
            <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Til dato</label>
               <input type="date" readOnly={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-900 border-2 border-transparent focus:border-black transition-all" value={currentMission.endDate || ''} onChange={(e) => setCurrentMission({...currentMission, endDate: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ansvarlig</label>
               <select 
                 disabled={readOnly}
                 className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-sm appearance-none"
                 value={currentMission.responsibleId || ''} 
                 onChange={(e) => setCurrentMission({...currentMission, responsibleId: e.target.value})}
               >
                 <option value="">Velg ansvarlig</option>
                 {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
               </select>
            </div>
          </div>
        </div>

        <div onDragOver={(e) => !readOnly && e.preventDefault()} onDrop={(e) => { if (readOnly) return; e.preventDefault(); const itemData = e.dataTransfer.getData('item'); if (itemData) openAddToListModal(JSON.parse(itemData)); }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px]">
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setListTab('utstyr')}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${listTab === 'utstyr' ? 'bg-black text-white shadow' : 'text-slate-400 hover:text-slate-700'}`}
              >Utstyrsliste</button>
              <button
                onClick={() => setListTab('plukk')}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${listTab === 'plukk' ? 'bg-black text-white shadow' : 'text-slate-400 hover:text-slate-700'}`}
              >Plukkliste</button>
            </div>
            <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-black hover:text-white transition-all"><Printer className="w-6 h-6" /></button>
          </div>

          {currentMission.items.length === 0 ? (
            <div className="h-96 border-4 border-dashed border-slate-50 flex justify-center items-center"><Package className="w-24 h-24 mb-4 opacity-10" /></div>
          ) : listTab === 'plukk' ? (
            <PlukkListe items={currentMission.items} isOverStock={isOverStock} />
          ) : (
            <div className="space-y-4">
              {currentMission.items.map((item) => {
                const overStock = isOverStock(item.id);
                return (
                <div key={item.instanceId} className={`flex justify-between p-6 rounded-3xl border transition-all ${overStock ? 'bg-red-50 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white border-slate-100 hover:border-black'}`}>
                  <div className="flex-1">
                    <div className={`font-black uppercase text-lg flex items-center gap-2 ${overStock ? 'text-red-900' : 'text-slate-900'}`}>
                       {item.itemType === 'bulk' && <span className={overStock ? 'text-red-600' : 'text-sky-500'}>{item.quantity || 1}x</span>}
                       {item.name} 
                       <span className={`text-[10px] px-2 py-1 rounded ml-2 ${overStock ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>{(item.basePrice || 0) * (item.quantity || 1)},-</span>
                       {overStock && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">LAGERMANGEL</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">{[...Object.values(item.selections.required || {}), ...(item.selections.optional || [])].map((v, i) => <div key={i} className="text-[9px] font-black flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase"><CheckCircle2 className="w-3 h-3 text-green-500" /> {v}</div>)}</div>
                    
                    {item.itemType === 'bulk' && (
                       <div className="flex items-center justify-between mt-4 p-1.5 bg-slate-50 rounded-xl border border-slate-200 max-w-[120px]">
                          <button onClick={() => updateQuantity(item.instanceId, (item.quantity || 1) - 1)} disabled={readOnly || (item.quantity || 1) <= 1} className="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-600 font-black hover:bg-slate-100 transition-all flex justify-center items-center disabled:opacity-30">-</button>
                          <span className="text-sm font-black">{item.quantity || 1}</span>
                          <button onClick={() => updateQuantity(item.instanceId, (item.quantity || 1) + 1)} disabled={readOnly} className="w-8 h-8 rounded-lg bg-white shadow-sm text-slate-600 font-black hover:bg-slate-100 transition-all flex justify-center items-center disabled:opacity-30">+</button>
                       </div>
                    )}
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right"><div className="text-[10px] font-black text-slate-300 uppercase mb-1">Vekt</div><div className="text-sm font-black text-slate-900">{((item.baseWeight || 0) * (item.quantity || 1)).toFixed(1)} kg</div></div>
                    <button disabled={readOnly} onClick={() => setCurrentMission(p => ({...p, items: p.items.filter(i => i.instanceId !== item.instanceId)}))} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-20"><Trash2 className="w-6 h-6" /></button>
                  </div>
                </div>
                );
              })}
              <div className="mt-12 pt-12 border-t-8 border-black flex justify-between items-end">
                <div className="space-y-3 text-[10px] font-black text-slate-400 uppercase">
                   <div>Enheter: <span className="text-slate-900 ml-4">{currentMission.items.reduce((a, i) => a + (i.quantity || 1), 0)}</span></div>
                   <div>Vekt: <span className="text-slate-900 ml-4">{currentMission.items.reduce((a, i) => a + ((i.baseWeight || 0) * (i.quantity || 1)), 0).toFixed(1)} kg</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase font-black text-slate-300 mb-1">TOTAL LEIESUM</div>
                  <div className="text-6xl font-black text-black leading-none">{currentMission.items.reduce((a, i) => a + ((i.basePrice || 0) * (i.quantity || 1)), 0)},-</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden xl:block">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-28 h-[calc(100vh-140px)] overflow-hidden flex flex-col pb-4">
            <InventoryTab 
              filteredInventory={filteredInventory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              setEditingModal={setEditingModal}
              openAddToListModal={openAddToListModal}
              normalizeItem={normalizeItem}
              forcedViewMode="list"
              isSidebar={true}
              readOnly={readOnly}
              globalUsageMap={globalUsageMap}
              settings={settings}
              logError={logError}
            />
        </div>
      </div>
    </div>
  );
}
