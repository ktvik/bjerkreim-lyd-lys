import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

export default function SelectionModal({ 
  selectionModal, 
  setSelectionModal, 
  modalSelections, 
  setModalSelections, 
  confirmAddToList, 
  findItemById 
}) {
  if (!selectionModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="bg-black p-12 text-white shrink-0">
          <div className="flex items-center gap-6">
            <CompanyLogo className="w-20 h-20" />
            <div>
              <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-slate-500 mb-2">Lager / Konfigurasjon</h2>
              <h3 className="text-4xl font-black uppercase leading-none">{selectionModal.item.name}</h3>
            </div>
          </div>
        </div>
        <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          {selectionModal.item.accessoryGroups?.map(group => (
            <div key={group.id} className="space-y-6">
              <label className="text-[12px] font-black text-slate-500 flex items-center gap-3 tracking-[0.3em] uppercase">
                {group.type === 'required' ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-sky-500" />}
                {group.label} {group.type === 'optional' && <span className="opacity-50">(Valgfritt)</span>}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {group.options.map(optObj => {
                  const opt = findItemById(optObj.itemId);
                  if(!opt) return null;
                  const isSelected = group.type === 'required' ? modalSelections.required[group.id] === opt.id : modalSelections.optional.includes(opt.id);
                  const amt = optObj.amount || 1;

                  return (
                    <button key={opt.id} onClick={() => {
                        if (group.type === 'required') {
                           setModalSelections({ ...modalSelections, required: { ...modalSelections.required, [group.id]: opt.id } });
                        } else {
                           const isOptSelected = modalSelections.optional.includes(opt.id);
                           setModalSelections({ ...modalSelections, optional: isOptSelected ? modalSelections.optional.filter(i => i !== opt.id) : [...modalSelections.optional, opt.id] });
                        }
                    }} className={`text-left px-8 py-5 rounded-[2rem] border-4 transition-all flex justify-between items-center relative overflow-hidden bg-white shadow-sm hover:border-slate-300 ${isSelected ? 'border-black text-black ring-8 ring-slate-200/50' : 'border-slate-100 text-slate-400'}`}>
                      <div className="flex items-center gap-4">
                         {group.type === 'optional' && <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${isSelected ? 'border-black bg-black' : 'border-slate-300'}`}>{isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}</div>}
                         {group.type === 'required' && <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-black' : 'border-slate-300'}`}>{isSelected && <div className="w-3 h-3 bg-black rounded-full" />}</div>}
                         <div>
                           <div className="text-lg font-black uppercase text-slate-900">{amt > 1 ? `${amt}x ` : ''}{opt.name}</div>
                           {optObj.recommended && group.type === 'required' && !isSelected && <div className="text-[9px] text-sky-500 font-black tracking-widest uppercase mt-1 flex items-center gap-1">Foretrukket / Anbefalt</div>}
                         </div>
                      </div>
                      <span className="text-[10px] uppercase font-black px-3 py-1 bg-slate-100 rounded-full border border-slate-200">+{opt.price * amt},-</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-12 bg-white flex gap-6 shrink-0 border-t border-slate-200">
          <button onClick={() => setSelectionModal({ isOpen: false, item: null })} className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-200 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Avbryt</button>
          <button onClick={confirmAddToList} className="flex-[2] px-8 py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-slate-800 flex justify-center items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Bekreft Utstyr</button>
        </div>
      </div>
    </div>
  );
}
