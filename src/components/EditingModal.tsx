import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { Cloud, X, Trash2, CheckCircle2, Save, Copy } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { Item, AccessoryGroup } from '../types';

interface EditingModalProps {
  editingModal: { isOpen: boolean; item: Item | null };
  setEditingModal: (m: { isOpen: boolean; item: Item | null }) => void;
  handleSaveItem: () => void;
  handleDeleteItem: (id: string) => void;
  inventory: Item[];
  findItemById: (id: string) => Item | undefined;
}

export default function EditingModal({ 
  editingModal, 
  setEditingModal, 
  handleSaveItem, 
  handleDeleteItem, 
  inventory, 
  findItemById 
}: EditingModalProps) {

  if (!editingModal.isOpen || !editingModal.item) return null;

  const item = editingModal.item;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
         <div className="bg-black p-8 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-6">
              <CompanyLogo className="w-14 h-14" />
              <div>
                <h2 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <Cloud className="w-3 h-3 text-sky-400" /> Firebase
                </h2>
                <h3 className="text-2xl font-black uppercase mt-1">
                  {inventory.some(i => i.id === item.id) ? 'Rediger enhet' : 'Ny enhet'}
                </h3>
              </div>
            </div>
            <button onClick={() => setEditingModal({isOpen: false, item: null})} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-6 h-6" /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[#FAFAFC] custom-scrollbar">
            {/* Grunnleggende Info */}
            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest border-b border-slate-200 pb-3">Grunnleggende Info</h4>
              <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Produktnavn</label><input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-base" value={item.name || ''} onChange={(e) => setEditingModal({...editingModal, item: {...item, name: e.target.value}})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Kategori</label><select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={item.category || 'Lyd'} onChange={(e) => setEditingModal({...editingModal, item: {...item, category: e.target.value}})}>{CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c}>{c}</option>)}</select></div>
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Registrering</label><select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black outline-none" value={item.itemType || 'unique'} onChange={(e) => setEditingModal({...editingModal, item: {...item, itemType: e.target.value as any}})}><option value="unique">Unik Enhet</option><option value="bulk">Bulkvare</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Pris / Dag</label><input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={item.price || 0} onChange={(e) => setEditingModal({...editingModal, item: {...item, price: Number(e.target.value)}})} /></div>
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Vekt (kg)</label><input type="number" step="0.1" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={item.weight || 0} onChange={(e) => setEditingModal({...editingModal, item: {...item, weight: parseFloat(e.target.value)}})} /></div>
              </div>
              {item.itemType === 'bulk' && (
                 <div className="space-y-3 border-t border-slate-100 pt-4"><label className="text-[10px] font-black uppercase text-sky-500">Antall på lager (Bulk)</label><input type="number" min="0" className="w-full p-4 bg-sky-50 border border-sky-100 rounded-2xl font-black text-sky-900" value={item.stock || 0} onChange={(e) => setEditingModal({...editingModal, item: {...item, stock: parseInt(e.target.value)}})} /></div>
              )}
            </div>

            {/* Tilbehørsgrupper */}
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black uppercase tracking-widest">Tilbehørsgrupper</h4>
                <button onClick={() => {
                   const g: AccessoryGroup = { id: 'grp_' + Date.now().toString(), label: 'Alle', type: 'optional', options: [] };
                   setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: [...(item.accessoryGroups || []), g] } });
                }} className="text-[9px] font-black uppercase bg-black text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all">+ Legg til</button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
                {(item.accessoryGroups || []).length === 0 && <p className="text-[10px] font-black uppercase text-slate-400 text-center py-6">Ingen tilbehørsgrupper opprettet.</p>}
                
                {(item.accessoryGroups || []).map((group, grpIdx) => {
                  const currentFilter = CATEGORIES.includes(group.label) ? group.label : 'Alle';

                  return (
                  <div key={group.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm relative">
                    <button onClick={() => {
                      const grps = [...(item.accessoryGroups || [])]; grps.splice(grpIdx, 1);
                      setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                    }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    
                    <div className="flex gap-2 pr-6 mb-4">
                      <select className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200" value={currentFilter} onChange={(e) => {
                         const grps = [...(item.accessoryGroups || [])]; grps[grpIdx].label = e.target.value;
                         setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                      }}>
                         <option value="Alle">Kategori: Vis alt utstyr</option>
                         {CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c} value={c}>Kategori: {c}</option>)}
                      </select>
                      <select className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold w-24 outline-none" value={group.type} onChange={(e) => {
                         const grps = [...(item.accessoryGroups || [])]; grps[grpIdx].type = e.target.value as any;
                         setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                      }}>
                         <option value="optional">Valgfri</option>
                         <option value="required">Påkrevd</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-1">Valgt Utstyr (Kryss for anbefalt)</div>
                       {group.options.map((opt, optIdx) => {
                          const itm = findItemById(opt.itemId);
                          if(!itm) return null;
                          return (
                            <div key={opt.itemId} className={`flex items-center justify-between p-2.5 rounded-xl border ${opt.recommended ? 'bg-black text-white border-black' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="text-[11px] font-bold flex-1 truncate flex items-center gap-2">
                                <input type="number" min="1" className="w-12 p-1 text-center border border-slate-200 rounded-lg text-xs" value={opt.amount || 1} onChange={(e) => {
                                      const grps = [...(item.accessoryGroups || [])];
                                      grps[grpIdx].options[optIdx].amount = parseInt(e.target.value) || 1;
                                      setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                                }} />
                                <span>x {itm.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" className="hidden" checked={opt.recommended} onChange={(e) => {
                                       const grps = [...(item.accessoryGroups || [])];
                                       if (grps[grpIdx].type === 'required' && e.target.checked) grps[grpIdx].options.forEach(o => o.recommended = false);
                                       grps[grpIdx].options[optIdx].recommended = e.target.checked;
                                       setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                                    }} />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${opt.recommended ? 'bg-sky-500 border-sky-500' : 'bg-white border-slate-300'}`}>{opt.recommended && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                                    <span className={`text-[9px] uppercase font-black ${opt.recommended ? 'text-sky-300' : 'text-slate-400'}`}>Foretrukket</span>
                                 </label>
                                 <button onClick={() => {
                                    const grps = [...(item.accessoryGroups || [])]; grps[grpIdx].options.splice(optIdx, 1);
                                    setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                                 }} className={opt.recommended ? 'text-white/50 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}><X className="w-4 h-4"/></button>
                              </div>
                            </div>
                          );
                       })}

                       <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 outline-none" value="" onChange={(e) => {
                              if(!e.target.value) return;
                              const grps = [...(item.accessoryGroups || [])];
                              if(!grps[grpIdx].options.find(o => o.itemId === e.target.value)) {
                                 grps[grpIdx].options.push({ itemId: e.target.value, recommended: grps[grpIdx].options.length === 0, amount: 1 });
                                 setEditingModal({ ...editingModal, item: { ...item, accessoryGroups: grps }});
                              }
                          }}>
                            <option value="">+ Legg til tilbehør i gruppen ({currentFilter === 'Alle' ? 'Alle kategorier' : currentFilter})</option>
                            {inventory
                              .filter(i => i.id !== item.id && !group.options.some(o => o.itemId === i.id))
                              .filter(i => currentFilter === 'Alle' || i.category === currentFilter)
                              .map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                       </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
         </div>

         <div className="p-6 border-t border-slate-200 flex justify-between shrink-0 bg-white">
           <div className="flex gap-4 items-center">
             {item.id && (
               <button onClick={() => handleDeleteItem(item.id)} className="px-6 py-4 border-2 border-red-100 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Slett Enhet</button>
             )}
             {item.id && (
               <button 
                onClick={() => setEditingModal({...editingModal, item: {...item, id: '', name: item.name + ' (Kopi)'}})} 
                className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
               >
                 <Copy className="w-4 h-4"/> Dupliser
               </button>
             )}
           </div>
           <div className="flex gap-4 ml-auto">
             <button onClick={() => setEditingModal({isOpen: false, item: null})} className="px-8 py-3 bg-white border-2 border-slate-200 font-black uppercase text-[11px] rounded-2xl hover:bg-slate-50">Avbryt</button>
             <button onClick={handleSaveItem} className="px-8 py-3 bg-black text-white font-black uppercase text-[11px] rounded-2xl flex items-center gap-2 hover:bg-slate-800"><Save className="w-4 h-4"/> Lagre Enhet</button>
           </div>
         </div>
      </div>
    </div>
  );
}
