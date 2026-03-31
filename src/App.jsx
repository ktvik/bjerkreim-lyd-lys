import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Save, FileText, Settings, Box, Calendar, User, MapPin, Download, Upload, ChevronRight, Info, CheckCircle2, AlertCircle, Printer, Edit2, Package, X, History, Database, Cloud
} from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import './App.css';

const CATEGORIES = ['Alle', 'Lyd', 'Lys', 'Kabel', 'Tilbehør', 'Video', 'Scene', 'Annet'];

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [savedMissions, setSavedMissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  
  const [currentMission, setCurrentMission] = useState({ id: Date.now().toString(), title: '', client: '', date: '', location: '', items: [] });
  const [selectionModal, setSelectionModal] = useState({ isOpen: false, item: null });
  const [modalSelections, setModalSelections] = useState({ required: {}, optional: [] });
  const [editingModal, setEditingModal] = useState({ isOpen: false, item: null });

  useEffect(() => {
    const unsubInv = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventory(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    const unsubMis = onSnapshot(collection(db, 'missions'), (snapshot) => {
      setSavedMissions(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubInv(); unsubMis(); };
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'Alle' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const findItemById = (id) => inventory.find(i => i.id === id);

  const normalizeItem = (rawItem) => {
    let item = { ...rawItem };
    let groups = item.accessoryGroups || [];
    if (groups.length === 0) {
       if (item.requiredGroups?.length > 0) {
          item.requiredGroups.forEach(rg => {
             groups.push({ id: rg.id, label: rg.label, type: 'required', options: rg.options.map((optId, idx) => ({ itemId: optId, recommended: idx === 0 })) });
          });
       }
       if (item.optionalItems?.length > 0) {
          groups.push({ id: 'opt_old', label: 'Valgfritt tilbehør', type: 'optional', options: item.optionalItems.map(optId => ({ itemId: optId, recommended: false })) });
       }
    }
    item.accessoryGroups = groups;
    return item;
  };

  const handleSaveItem = async () => {
    if (!editingModal.item?.name) return;
    const item = normalizeItem(editingModal.item);
    if (!item.id) item.id = Date.now().toString();
    try {
      await setDoc(doc(db, 'inventory', item.id), item);
      setEditingModal({ isOpen: false, item: null });
    } catch (e) { alert("Feil under lagring."); }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Slett enhet permanent?")) {
      await deleteDoc(doc(db, 'inventory', id));
      setEditingModal({ isOpen: false, item: null });
    }
  };

  const handleSaveMissionToArchive = async () => {
    if (!currentMission.title) return alert("Gi oppdraget et navn først.");
    const m = { ...currentMission, lastUpdated: Date.now() };
    await setDoc(doc(db, 'missions', m.id), m);
    alert("Oppdrag arkivert!");
  };

  const handleDeleteMission = async (id) => {
    if (window.confirm("Slett oppdrag?")) await deleteDoc(doc(db, 'missions', id));
  };

  const openAddToListModal = (rawItem) => {
    const item = normalizeItem(rawItem);
    if (item.accessoryGroups.length === 0) {
      setCurrentMission(p => ({ ...p, items: [...p.items, { instanceId: Date.now().toString(), id: item.id, name: item.name, price: item.price, weight: item.weight, selections: { required: {}, optional: [] } }] }));
      return;
    }
    setSelectionModal({ isOpen: true, item });
    const initialReq = {};
    const initialOpt = [];
    item.accessoryGroups.forEach(group => {
       if (group.type === 'required') {
          const rec = group.options.find(o => o.recommended) || group.options[0];
          if (rec) initialReq[group.id] = rec.itemId;
       } else if (group.type === 'optional') {
          group.options.filter(o => o.recommended).forEach(o => initialOpt.push(o.itemId));
       }
    });
    setModalSelections({ required: initialReq, optional: initialOpt });
  };

  const confirmAddToList = () => {
    const { item } = selectionModal;
    let totalWeight = item.weight || 0;
    let totalPrice = item.price || 0;
    const reqDetails = {};
    
    Object.entries(modalSelections.required).forEach(([groupId, itemId]) => {
      const sub = findItemById(itemId);
      if (sub) { totalWeight += sub.weight || 0; totalPrice += sub.price || 0; reqDetails[groupId] = sub.name; }
    });

    const optDetails = [];
    modalSelections.optional.forEach(itemId => {
      const sub = findItemById(itemId);
      if (sub) { totalWeight += sub.weight || 0; totalPrice += sub.price || 0; optDetails.push(sub.name); }
    });

    setCurrentMission(p => ({ ...p, items: [...p.items, { instanceId: Date.now().toString(), id: item.id, name: item.name, price: totalPrice, weight: parseFloat(totalWeight.toFixed(2)), selections: { required: reqDetails, optional: optDetails } }] }));
    setSelectionModal({ isOpen: false, item: null });
  };

  const CompanyLogo = ({ className = "w-10 h-10" }) => (
    <div className={`${className} bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm`}><div className="font-black text-slate-800 tracking-tighter w-full h-full flex items-center justify-center bg-slate-50">BLL</div></div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4"><CompanyLogo className="w-14 h-14" /><div><h1 className="text-xl font-black tracking-tight text-black uppercase">Bjerkreim Lyd & Lys AS</h1><p className="text-[10px] flex items-center gap-1.5 uppercase font-bold text-sky-500 tracking-[0.2em] mt-1.5"><Cloud className="w-3 h-3" /> Firebase Skylagring</p></div></div>
          <nav className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {['inventory', 'mission', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab === 'inventory' && <Package className="w-4 h-4"/>} {tab === 'mission' && <FileText className="w-4 h-4"/>} {tab === 'history' && <History className="w-4 h-4"/>} {tab === 'inventory' ? 'Lager' : tab === 'mission' ? 'Oppdrag' : 'Arkiv'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 print:p-0">
        {activeTab === 'inventory' && (
           <div className="flex flex-col h-full">
           <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder="Søk i utstyr..." className="w-full pl-12 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
             <div className="flex items-center gap-2"><span className="text-xs font-black text-slate-400 uppercase mr-2">Filter:</span>{CATEGORIES.map(cat => (<button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-black text-white' : 'bg-white border hover:bg-slate-50'}`}>{cat}</button>))}</div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {categoryFilter === 'Alle' && searchQuery === '' && (
                <button onClick={() => setEditingModal({ isOpen: true, item: { id: Date.now().toString(), name: '', category: 'Lyd', price: 0, weight: 0, location: '', accessoryGroups: [] } })} className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-black transition-all flex flex-col items-center justify-center min-h-[180px] group"><div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm"><Plus className="w-8 h-8" /></div><span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black">Legg til utstyr</span></button>
             )}
             {filteredInventory.map(item => (
               <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all cursor-move group relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4"><div className="space-y-1"><span className="text-[10px] font-black text-slate-400 uppercase px-2 py-1 bg-slate-100 rounded-lg">{item.category}</span><h3 className="font-black text-slate-900 text-lg uppercase leading-tight mt-2">{item.name}</h3><p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-bold uppercase mt-1"><MapPin className="w-3 h-3"/> {item.location}</p></div><div className="flex gap-2"><button onClick={() => openAddToListModal(item)} className="p-3 bg-slate-50 border text-slate-400 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm block sm:hidden group-hover:block"><Plus className="w-5 h-5"/></button><button onClick={() => setEditingModal({ isOpen: true, item: normalizeItem({ ...item }) })} className="p-3 bg-white border text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Edit2 className="w-5 h-5"/></button></div></div>
                 <div className="mt-6 flex justify-between items-end border-t pt-4 border-slate-50"><div className="text-xs font-bold text-slate-400">Vekt: <span className="text-slate-900 ml-1">{item.weight} kg</span></div><div className="text-right"><div className="text-[10px] font-black text-slate-300 uppercase">Per dag</div><div className="text-xl font-black text-slate-900">{item.price},-</div></div></div>
               </div>
             ))}
           </div>
         </div>
        )}

        {/* ... Mission and History ... */}
        {activeTab === 'mission' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8"><h2 className="text-2xl font-black text-black uppercase">Prosjektdetaljer</h2><div className="flex gap-2"><button onClick={handleSaveMissionToArchive} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><Cloud className="w-4 h-4"/> Arkiver</button><button onClick={() => setCurrentMission({ id: Date.now().toString(), title: '', client: '', date: '', location: '', items: [] })} className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase">Tøm</button></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><input type="text" placeholder="Navn på prosjekt" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.title} onChange={(e) => setCurrentMission({...currentMission, title: e.target.value})} /><input type="text" placeholder="Oppdragsgiver" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.client} onChange={(e) => setCurrentMission({...currentMission, client: e.target.value})} /><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-slate-500" value={currentMission.date} onChange={(e) => setCurrentMission({...currentMission, date: e.target.value})} /><input type="text" placeholder="Lokasjon" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={currentMission.location} onChange={(e) => setCurrentMission({...currentMission, location: e.target.value})} /></div>
              </div>
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const itemData = e.dataTransfer.getData('item'); if (itemData) openAddToListModal(JSON.parse(itemData)); }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px]">
                <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-black text-black uppercase">Utstyrsliste</h2><button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-black hover:text-white transition-all"><Printer className="w-6 h-6" /></button></div>
                {currentMission.items.length === 0 ? (
                  <div className="h-96 border-4 border-dashed border-slate-50 flex justify-center items-center"><Package className="w-24 h-24 mb-4 opacity-10" /></div>
                ) : (
                  <div className="space-y-4">
                    {currentMission.items.map((item) => (
                      <div key={item.instanceId} className="flex justify-between p-6 bg-white rounded-3xl border border-slate-100 hover:border-black transition-all">
                        <div className="flex-1"><div className="font-black text-slate-900 uppercase text-lg">{item.name} <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded">{item.price},-</span></div><div className="flex flex-wrap gap-2 mt-4">{[...Object.values(item.selections.required || {}), ...(item.selections.optional || [])].map((v, i) => <div key={i} className="text-[9px] font-black flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase"><CheckCircle2 className="w-3 h-3 text-green-500" /> {v}</div>)}</div></div>
                        <div className="flex items-center gap-8"><div className="text-right"><div className="text-[10px] font-black text-slate-300 uppercase mb-1">Vekt</div><div className="text-sm font-black text-slate-900">{item.weight} kg</div></div><button onClick={() => setCurrentMission(p => ({...p, items: p.items.filter(i => i.instanceId !== item.instanceId)}))} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button></div>
                      </div>
                    ))}
                    <div className="mt-12 pt-12 border-t-8 border-black flex justify-between items-end"><div className="space-y-3 text-[10px] font-black text-slate-400 uppercase"><div>Enheter: <span className="text-slate-900 ml-4">{currentMission.items.length}</span></div><div>Vekt: <span className="text-slate-900 ml-4">{currentMission.items.reduce((a, i) => a + i.weight, 0).toFixed(1)} kg</span></div></div><div className="text-right"><div className="text-[11px] uppercase font-black text-slate-300 mb-1">TOTAL LEIESUM</div><div className="text-6xl font-black text-black leading-none">{currentMission.items.reduce((a, i) => a + i.price, 0)},-</div></div></div>
                  </div>
                )}
              </div>
            </div>
            <div className="hidden xl:block"><div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-28"><h2 className="text-lg font-black text-white mb-8 uppercase flex items-center gap-3"><Box className="w-6 h-6" /> Hurtigvalg</h2><div className="relative mb-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" /><input type="text" placeholder="Søk i lager..." className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl text-sm text-white" onChange={(e) => setSearchQuery(e.target.value)} /></div><div className="space-y-3 max-h-[550px] overflow-y-auto pr-3 custom-scrollbar">{filteredInventory.map(item => (<div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="p-5 bg-white/5 rounded-3xl flex items-center justify-between cursor-move hover:bg-white/10 group"><div><div className="text-xs font-black text-white uppercase">{item.name}</div><div className="text-[9px] text-white/30 font-black uppercase mt-1.5">{item.category} • {item.weight}kg</div></div><button onClick={() => openAddToListModal(item)} className="p-2.5 bg-white text-black hover:bg-slate-200 rounded-xl"><Plus className="w-4 h-4"/></button></div>))}</div></div></div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-black uppercase mb-8">Oppdrag <Cloud className="inline w-6 h-6 ml-2 text-sky-500" /></h2>
            {savedMissions.length === 0 ? <p className="text-center font-black uppercase text-slate-300">Ingen oppdrag i databasen</p> : savedMissions.sort((a,b) => b.lastUpdated - a.lastUpdated).map(mission => (
              <div key={mission.id} className="bg-white p-6 rounded-3xl flex justify-between shadow-sm group">
                <div><h3 className="font-black text-xl uppercase">{mission.title}</h3><div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase mt-1"><span>{mission.client}</span><span>•</span><span>{mission.date}</span></div></div>
                <div className="flex gap-2"><button onClick={() => { setCurrentMission(mission); setActiveTab('mission'); }} className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800">Åpne</button><button onClick={() => handleDeleteMission(mission.id)} className="p-2.5 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button></div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor Modal */}
      {editingModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
             <div className="bg-black p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6"><CompanyLogo className="w-14 h-14" /><div><h2 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Cloud className="w-3 h-3 text-sky-400" /> Firebase</h2><h3 className="text-2xl font-black uppercase mt-1">{inventory.some(i => i.id === editingModal.item?.id) ? 'Rediger enhet' : 'Ny enhet'}</h3></div></div>
                <button onClick={() => setEditingModal({isOpen: false, item: null})} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-6 h-6" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[#FAFAFC]">
                {/* Grunnleggende Info */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest border-b border-slate-200 pb-3">Grunnleggende Info</h4>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Produktnavn</label><input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-base" value={editingModal.item?.name || ''} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, name: e.target.value}})} /></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Kategori</label><select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={editingModal.item?.category || 'Lyd'} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, category: e.target.value}})}>{CATEGORIES.filter(c => c !== 'Alle').map(c => <option key={c}>{c}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4"><div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Pris / Dag</label><input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={editingModal.item?.price || 0} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, price: Number(e.target.value)}})} /></div><div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Vekt (kg)</label><input type="number" step="0.1" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={editingModal.item?.weight || 0} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, weight: parseFloat(e.target.value)}})} /></div></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400">Lagerplassering</label><input type="text" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black" value={editingModal.item?.location || ''} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, location: e.target.value}})} /></div>
                </div>

                {/* Tilbehørsgrupper (NYTT) */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-black uppercase tracking-widest">Tilbehørsgrupper</h4>
                    <button onClick={() => {
                       const g = { id: 'grp_' + Date.now().toString(), label: '', type: 'optional', options: [] };
                       setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: [...(editingModal.item?.accessoryGroups || []), g] } });
                    }} className="text-[9px] font-black uppercase bg-black text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all">+ Legg til</button>
                  </div>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
                    {(editingModal.item?.accessoryGroups || []).length === 0 && <p className="text-[10px] font-black uppercase text-slate-400 text-center py-6">Ingen tilbehørsgrupper opprettet.</p>}
                    
                    {(editingModal.item?.accessoryGroups || []).map((group, grpIdx) => (
                      <div key={group.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm relative">
                        <button onClick={() => {
                          const grps = [...editingModal.item.accessoryGroups]; grps.splice(grpIdx, 1);
                          setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps }});
                        }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        
                        <div className="flex gap-2 pr-6 mb-4">
                          <input type="text" className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold" placeholder="Eks: Strømkabel / Ekstrautstyr" value={group.label} onChange={(e) => {
                             const grps = [...editingModal.item.accessoryGroups]; grps[grpIdx].label = e.target.value;
                             setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps } });
                          }} />
                          <select className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold w-24" value={group.type} onChange={(e) => {
                             const grps = [...editingModal.item.accessoryGroups]; grps[grpIdx].type = e.target.value;
                             setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps }});
                          }}>
                             <option value="optional">Valgfri</option>
                             <option value="required">Påkrevd</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                           <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-1">Inkludert utstyr (Kryss for anbefalt)</div>
                           {group.options.map((opt, optIdx) => {
                              const itm = findItemById(opt.itemId);
                              if(!itm) return null;
                              return (
                                <div key={opt.itemId} className={`flex items-center justify-between p-2.5 rounded-xl border ${opt.recommended ? 'bg-black text-white border-black' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className="text-[11px] font-bold w-32 truncate">{itm.name}</div>
                                  <div className="flex items-center gap-3">
                                     <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" className="hidden" checked={opt.recommended} onChange={(e) => {
                                           const grps = [...editingModal.item.accessoryGroups];
                                           if (grps[grpIdx].type === 'required' && e.target.checked) grps[grpIdx].options.forEach(o => o.recommended = false);
                                           grps[grpIdx].options[optIdx].recommended = e.target.checked;
                                           setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps }});
                                        }} />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${opt.recommended ? 'bg-sky-500 border-sky-500' : 'bg-white border-slate-300'}`}>{opt.recommended && <CheckCircle2 className="w-3 h-3 text-white"/>}</div>
                                        <span className={`text-[9px] uppercase font-black ${opt.recommended ? 'text-sky-300' : 'text-slate-400'}`}>Foretrukket</span>
                                     </label>
                                     <button onClick={() => {
                                        const grps = [...editingModal.item.accessoryGroups]; grps[grpIdx].options.splice(optIdx, 1);
                                        setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps }});
                                     }} className={opt.recommended ? 'text-white/50 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}><X className="w-4 h-4"/></button>
                                  </div>
                                </div>
                              );
                           })}
                           <select className="w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500" value="" onChange={(e) => {
                               if(!e.target.value) return;
                               const grps = [...editingModal.item.accessoryGroups];
                               if(!grps[grpIdx].options.find(o => o.itemId === e.target.value)) {
                                  grps[grpIdx].options.push({ itemId: e.target.value, recommended: grps[grpIdx].options.length === 0 });
                                  setEditingModal({ ...editingModal, item: { ...editingModal.item, accessoryGroups: grps }});
                               }
                           }}>
                             <option value="">+ Legg til utstyr i gruppen</option>
                             {inventory.filter(i => i.id !== editingModal.item?.id && !group.options.some(o => o.itemId === i.id)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                           </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="p-6 border-t border-slate-200 flex justify-between shrink-0 bg-white">
               {editingModal.item?.id && <button onClick={() => handleDeleteItem(editingModal.item.id)} className="px-6 py-4 border-2 border-red-100 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Slett Enhet</button>}
               <div className="flex gap-4 ml-auto">
                 <button onClick={() => setEditingModal({isOpen: false, item: null})} className="px-8 py-3 bg-white border-2 border-slate-200 font-black uppercase text-[11px] rounded-2xl hover:bg-slate-50">Avbryt</button>
                 <button onClick={handleSaveItem} className="px-8 py-3 bg-black text-white font-black uppercase text-[11px] rounded-2xl flex items-center gap-2 hover:bg-slate-800"><Save className="w-4 h-4"/> Lagre Enhet</button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {selectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="bg-black p-12 text-white shrink-0"><div className="flex items-center gap-6"><CompanyLogo className="w-20 h-20" /><div><h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-slate-500 mb-2">Lager / Konfigurasjon</h2><h3 className="text-4xl font-black uppercase leading-none">{selectionModal.item.name}</h3></div></div></div>
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
                             <div><div className="text-lg font-black uppercase text-slate-900">{opt.name}</div>{optObj.recommended && group.type === 'required' && !isSelected && <div className="text-[9px] text-sky-500 font-black tracking-widest uppercase mt-1 flex items-center gap-1">Foretrukket / Anbefalt</div>}</div>
                          </div>
                          <span className="text-[10px] uppercase font-black px-3 py-1 bg-slate-100 rounded-full border border-slate-200">+{opt.price},-</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-12 bg-white flex gap-6 shrink-0 border-t border-slate-200">
              <button onClick={() => setSelectionModal({ isOpen: false, item: null })} className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-200 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest">Avbryt</button>
              <button onClick={confirmAddToList} className="flex-[2] px-8 py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-xl hover:bg-slate-800 flex justify-center items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Bekreft Utstyr</button>
            </div>
          </div>
        </div>
      )}

      {/* Print View */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-16 text-black font-sans uppercase">
        {/* Same minimal printable view */}
        <div className="flex justify-between items-start border-b-2 border-black pb-8"><h1 className="text-4xl font-black">Pakkseddel // BLL</h1><h2 className="text-2xl font-bold">{currentMission.title}</h2></div>
        <table className="w-full text-left mt-8">
           <thead><tr className="border-b"><th className="py-2">Utstyr</th><th>Vekt</th></tr></thead>
           <tbody>
             {currentMission.items.map(item => (
                <tr key={item.instanceId} className="border-b border-slate-200">
                   <td className="py-4">
                      <div className="font-bold text-xl">{item.name}</div>
                      <div className="text-sm text-slate-500">
                         {[...Object.values(item.selections.required || {}), ...(item.selections.optional || [])].map((v, i) => <span key={i} className="mr-3">+ {v}</span>)}
                      </div>
                   </td>
                   <td className="py-4 font-bold">{item.weight} kg</td>
                </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
