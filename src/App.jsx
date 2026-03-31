import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Save, FileText, Settings, Box, Calendar, User, MapPin, Download, Upload, ChevronRight, Info, CheckCircle2, AlertCircle, Printer, Edit2, Package, X, History, Database
} from 'lucide-react';
import './App.css';

// --- INITIAL DATA (Brukt hvis LocalStorage er tom) ---
const INITIAL_INVENTORY = [
  { id: '1', name: 'QSC K12.2 Aktiv Høyttaler', category: 'Lyd', location: 'Hylle A1', price: 450, weight: 17.7, requiredGroups: [{ id: 'req_1', label: 'Strømkabel', options: ['k_1', 'k_2'] }], optionalItems: ['t_1'] },
  { id: 'k_1', name: 'Apparatkabel 2m', category: 'Kabel', location: 'Kabelkasse 1', price: 10, weight: 0.2 },
  { id: 'k_2', name: 'Apparatkabel 5m', category: 'Kabel', location: 'Kabelkasse 1', price: 15, weight: 0.4 },
  { id: 't_1', name: 'Høyttalerstativ', category: 'Tilbehør', location: 'Stativ-rack', price: 50, weight: 4.5 }
];

const CATEGORIES = ['Alle', 'Lyd', 'Lys', 'Kabel', 'Tilbehør', 'Video', 'Scene', 'Annet'];

export default function App() {
  // App state
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [savedMissions, setSavedMissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  
  const [currentMission, setCurrentMission] = useState({
    id: Date.now().toString(),
    title: '',
    client: '',
    date: '',
    location: '',
    items: []
  });

  const [selectionModal, setSelectionModal] = useState({ isOpen: false, item: null });
  const [modalSelections, setModalSelections] = useState({ required: {}, optional: [] });
  const [editingModal, setEditingModal] = useState({ isOpen: false, item: null });

  // 1. Last inn data fra LocalStorage ved oppstart
  useEffect(() => {
    const savedInv = localStorage.getItem('bjerkreim_inventory');
    const savedMis = localStorage.getItem('bjerkreim_missions');

    if (savedInv) {
      setInventory(JSON.parse(savedInv));
    } else {
      setInventory(INITIAL_INVENTORY);
      localStorage.setItem('bjerkreim_inventory', JSON.stringify(INITIAL_INVENTORY));
    }

    if (savedMis) {
      setSavedMissions(JSON.parse(savedMis));
    }
  }, []);

  // 2. Lagre til LocalStorage når state endres
  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem('bjerkreim_inventory', JSON.stringify(inventory));
    }
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('bjerkreim_missions', JSON.stringify(savedMissions));
  }, [savedMissions]);

  // --- DERIVED STATE ---
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'Alle' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const findItemById = (id) => inventory.find(i => i.id === id);

  // --- ACTIONS ---
  const handleSaveItem = () => {
    if (!editingModal.item?.name) return;
    const item = editingModal.item;
    const exists = inventory.find(i => i.id === item.id);
    
    if (exists) {
      setInventory(inventory.map(i => i.id === item.id ? item : i));
    } else {
      setInventory([...inventory, item]);
    }
    setEditingModal({ isOpen: false, item: null });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm("Er du sikker på at du vil slette dette utstyret permanent?")) {
      setInventory(inventory.filter(i => i.id !== id));
      setEditingModal({ isOpen: false, item: null });
    }
  };

  const handleSaveMissionToArchive = () => {
    if (!currentMission.title) {
      alert("Gi oppdraget et navn først.");
      return;
    }
    const updatedMission = { ...currentMission, lastUpdated: Date.now() };
    const exists = savedMissions.find(m => m.id === currentMission.id);
    
    if (exists) {
      setSavedMissions(savedMissions.map(m => m.id === currentMission.id ? updatedMission : m));
    } else {
      setSavedMissions([updatedMission, ...savedMissions]);
    }
    alert("Oppdrag arkivert lokalt.");
  };

  const handleDeleteMission = (id) => {
    if (window.confirm("Slette oppdrag fra arkiv?")) {
      setSavedMissions(savedMissions.filter(m => m.id !== id));
    }
  };

  const openAddToListModal = (item) => {
    if (!item.requiredGroups?.length && !item.optionalItems?.length) {
      const simpleItem = {
        instanceId: Date.now().toString(),
        id: item.id,
        name: item.name,
        price: item.price,
        weight: item.weight,
        selections: { required: {}, optional: [] }
      };
      setCurrentMission(prev => ({ ...prev, items: [...prev.items, simpleItem] }));
      return;
    }
    setSelectionModal({ isOpen: true, item });
    const initialReq = {};
    item.requiredGroups?.forEach(group => {
      initialReq[group.id] = group.options[0];
    });
    setModalSelections({ required: initialReq, optional: [] });
  };

  const confirmAddToList = () => {
    const { item } = selectionModal;
    let totalWeight = item.weight || 0;
    let totalPrice = item.price || 0;
    const requiredItemsDetails = {};
    
    Object.entries(modalSelections.required).forEach(([groupId, itemId]) => {
      const subItem = findItemById(itemId);
      if (subItem) {
        totalWeight += subItem.weight || 0;
        totalPrice += subItem.price || 0;
        requiredItemsDetails[groupId] = subItem.name;
      }
    });

    const optionalItemsNames = [];
    modalSelections.optional.forEach(itemId => {
      const subItem = findItemById(itemId);
      if (subItem) {
        totalWeight += subItem.weight || 0;
        totalPrice += subItem.price || 0;
        optionalItemsNames.push(subItem.name);
      }
    });

    const newItem = {
      instanceId: Date.now().toString(),
      id: item.id,
      name: item.name,
      price: totalPrice,
      weight: parseFloat(totalWeight.toFixed(2)),
      selections: { required: requiredItemsDetails, optional: optionalItemsNames }
    };
    setCurrentMission(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectionModal({ isOpen: false, item: null });
  };

  const exportFullBackup = () => {
    const data = {
      inventory,
      missions: savedMissions,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bjerkreim_total_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- UI COMPONENTS ---
  const CompanyLogo = ({ className = "w-10 h-10" }) => (
    <div className={`${className} bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200`}>
      <div className="font-black text-black tracking-tighter w-full h-full flex items-center justify-center bg-slate-100">BLL</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CompanyLogo className="w-14 h-14" />
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-black uppercase">Bjerkreim Lyd & Lys AS</h1>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mt-1.5">Lokal Lagring (Browser)</p>
            </div>
          </div>
          
          <nav className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'inventory' ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              <Package className="w-4 h-4"/> Lager
            </button>
            <button onClick={() => setActiveTab('mission')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'mission' ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              <FileText className="w-4 h-4"/> Oppdrag
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              <History className="w-4 h-4"/> Arkiv
            </button>
          </nav>

          <div className="flex items-center gap-3">
             <button onClick={exportFullBackup} title="Full Backup" className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-black hover:text-white transition-all">
                <Database className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-8 print:p-0">
        {activeTab === 'inventory' && (
           <div className="flex flex-col h-full">
           <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="relative flex-1 min-w-[250px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
               <input type="text" placeholder="Søk i utstyr..." className="w-full pl-12 pr-4 py-3 border border-slate-100 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase mr-2">Filter:</span>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-black text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {cat}
                  </button>
                ))}
             </div>
           </div>
     
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {categoryFilter === 'Alle' && searchQuery === '' && (
                <button onClick={() => setEditingModal({ isOpen: true, item: { id: Date.now().toString(), name: '', category: 'Lyd', price: 0, weight: 0, location: '', requiredGroups: [], optionalItems: [] } })} className="bg-white p-5 rounded-[2rem] shadow-sm border-2 border-dashed border-slate-200 hover:border-black hover:bg-slate-50 transition-all flex flex-col items-center justify-center min-h-[180px] group">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-black">Legg til utstyr</span>
                </button>
             )}

             {filteredInventory.map(item => (
               <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-300 transition-all cursor-move group relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                   <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg">{item.category}</span>
                     <h3 className="font-black text-slate-900 text-lg uppercase leading-tight mt-2">{item.name}</h3>
                     <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-bold uppercase tracking-tighter mt-1"><MapPin className="w-3 h-3 text-slate-400"/> {item.location}</p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => openAddToListModal(item)} className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm block sm:hidden group-hover:block"><Plus className="w-5 h-5"/></button>
                     <button onClick={() => setEditingModal({ isOpen: true, item: { ...item } })} className="p-3 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Edit2 className="w-5 h-5"/></button>
                   </div>
                 </div>
                 <div className="mt-6 flex justify-between items-end border-t pt-4 border-slate-50">
                   <div className="text-xs font-bold text-slate-400">Vekt: <span className="text-slate-900 ml-1">{item.weight} kg</span></div>
                   <div className="text-right">
                     <div className="text-[10px] font-black text-slate-300 uppercase">Per dag</div>
                     <div className="text-xl font-black text-slate-900 tracking-tighter">{item.price},-</div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
        )}

        {activeTab === 'mission' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight">Prosjektdetaljer</h2>
                  <div className="flex gap-2">
                    <button onClick={handleSaveMissionToArchive} className="px-4 py-2.5 bg-black text-white rounded-xl hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all">
                      <Save className="w-4 h-4"/> Arkiver Lokalt
                    </button>
                    <button onClick={() => setCurrentMission({ id: Date.now().toString(), title: '', client: '', date: '', location: '', items: [] })} className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest transition-all">
                      Tøm Skjema
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-medium">
                  <input type="text" placeholder="Navn på prosjekt" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200" value={currentMission.title} onChange={(e) => setCurrentMission({...currentMission, title: e.target.value})} />
                  <input type="text" placeholder="Oppdragsgiver" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200" value={currentMission.client} onChange={(e) => setCurrentMission({...currentMission, client: e.target.value})} />
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200 text-slate-500" value={currentMission.date} onChange={(e) => setCurrentMission({...currentMission, date: e.target.value})} />
                  <input type="text" placeholder="Lokasjon" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-slate-200" value={currentMission.location} onChange={(e) => setCurrentMission({...currentMission, location: e.target.value})} />
                </div>
              </div>
      
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const itemData = e.dataTransfer.getData('item'); if (itemData) openAddToListModal(JSON.parse(itemData)); }} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[600px]">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-black uppercase tracking-tight">Utstyrsliste</h2>
                   <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm"><Printer className="w-6 h-6" /></button>
                </div>
      
                {currentMission.items.length === 0 ? (
                  <div className="h-96 border-4 border-dashed border-slate-50 rounded-[2rem] flex flex-col items-center justify-center text-slate-200 bg-slate-50/20">
                    <Package className="w-24 h-24 mb-4 opacity-5" />
                    <p className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-300">Slipp utstyr her for å pakke</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentMission.items.map((item) => (
                      <div key={item.instanceId} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 group hover:border-black transition-all shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 font-black text-slate-900 uppercase tracking-tight text-lg">{item.name} <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded uppercase">{item.price},-</span></div>
                          <div className="flex flex-wrap gap-2 mt-4">
                            {Object.entries(item.selections.required).map(([key, val]) => (
                              <div key={key} className="text-[9px] font-black flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3 text-green-500" /> {val}</div>
                            ))}
                            {item.selections.optional.map((opt) => (
                              <div key={opt} className="text-[9px] font-black flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-widest"><Plus className="w-3 h-3 text-slate-400" /> {opt}</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Vekt</div>
                            <div className="text-sm font-black text-slate-900">{item.weight} kg</div>
                          </div>
                          <button onClick={() => setCurrentMission(prev => ({...prev, items: prev.items.filter(i => i.instanceId !== item.instanceId)}))} className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-12 pt-12 border-t-8 border-black flex justify-between items-end">
                      <div className="space-y-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                         <div>Enheter: <span className="text-slate-900 ml-4">{currentMission.items.length}</span></div>
                         <div>Vekt: <span className="text-slate-900 ml-4">{currentMission.items.reduce((acc, i) => acc + i.weight, 0).toFixed(1)} kg</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase font-black text-slate-300 tracking-[0.4em] mb-1">TOTAL LEIESUM</div>
                        <div className="text-6xl font-black text-black tracking-tighter leading-none">{currentMission.items.reduce((acc, i) => acc + i.price, 0)},-</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
      
            <div className="space-y-6 hidden xl:block">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl sticky top-28 border border-white/5">
                <h2 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3"><Box className="w-6 h-6 text-slate-400" /> Hurtigvalg</h2>
                <div className="relative mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                  <input type="text" placeholder="Søk i lager..." className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white outline-none focus:bg-white/10 transition-all font-bold placeholder:text-white/10" onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-3 custom-scrollbar">
                  {filteredInventory.map(item => (
                    <div key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData('item', JSON.stringify(item))} className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between cursor-move hover:bg-white/10 hover:border-white/20 transition-all group">
                      <div><div className="text-xs font-black text-white uppercase tracking-tight">{item.name}</div><div className="text-[9px] text-white/30 font-black uppercase mt-1.5">{item.category} • {item.weight}kg</div></div>
                      <button onClick={() => openAddToListModal(item)} className="p-2.5 bg-white text-black hover:bg-slate-200 rounded-xl shadow-lg transition-all scale-90 group-hover:scale-100"><Plus className="w-4 h-4"/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Arkiverte Oppdrag</h2>
            {savedMissions.length === 0 ? (
              <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100">
                <History className="w-16 h-16 mx-auto mb-4 text-slate-100" />
                <p className="font-black uppercase text-slate-300 tracking-widest">Ingen arkiverte oppdrag i denne nettleseren</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {savedMissions.sort((a,b) => b.lastUpdated - a.lastUpdated).map(mission => (
                  <div key={mission.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-black transition-all flex items-center justify-between shadow-sm group">
                    <div>
                      <h3 className="font-black text-xl uppercase">{mission.title}</h3>
                      <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase mt-1">
                        <span>{mission.client}</span>
                        <span>•</span>
                        <span>{mission.date}</span>
                        <span>•</span>
                        <span>{mission.items.length} kolli</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentMission(mission); setActiveTab('mission'); }} className="px-6 py-2.5 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all">Åpne</button>
                      <button onClick={() => handleDeleteMission(mission.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {editingModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="bg-black p-10 text-white flex justify-between items-center">
                <div className="flex items-center gap-6"><CompanyLogo className="w-16 h-16 ring-4 ring-white/10" /><div><h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-500">Lager Editor</h2><h3 className="text-3xl font-black uppercase mt-1 tracking-tight">{inventory.find(i => i.id === editingModal.item?.id) ? 'Rediger enhet' : 'Ny enhet'}</h3></div></div>
                <button onClick={() => setEditingModal({isOpen: false, item: null})} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X className="w-8 h-8" /></button>
             </div>
             <div className="p-12 grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Produktnavn</label><input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black focus:ring-8 focus:ring-slate-100 text-lg" value={editingModal.item?.name} placeholder="Navn" onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, name: e.target.value}})} /></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Kategori</label><select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black text-slate-600" value={editingModal.item?.category} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, category: e.target.value}})}>{CATEGORIES.filter(c => c !== 'Alle').map(cat => <option key={cat}>{cat}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pris</label><input type="number" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black" value={editingModal.item?.price} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, price: Number(e.target.value)}})} /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vekt</label><input type="number" step="0.1" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black" value={editingModal.item?.weight} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, weight: parseFloat(e.target.value)}})} /></div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lagerplassering</label><input type="text" placeholder="Hylle/Rack" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-black" value={editingModal.item?.location} onChange={(e) => setEditingModal({...editingModal, item: {...editingModal.item, location: e.target.value}})} /></div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                    <p className="text-black font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> Lokal Lagring</p>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Siden du ikke bruker Firestore, lagres alle endringer kun i denne nettleseren. Husk å ta backup (Database-ikonet) med jevne mellomrom.</p>
                    <button onClick={() => handleDeleteItem(editingModal.item.id)} className="mt-10 w-full p-4 border-2 border-red-100 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Slett fra lager</button>
                  </div>
                </div>
             </div>
             <div className="p-12 bg-slate-50 flex gap-6">
                <button onClick={() => setEditingModal({isOpen: false, item: null})} className="flex-1 px-10 py-6 bg-white border-2 border-slate-200 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">Avbryt</button>
                <button onClick={handleSaveItem} className="flex-[2] px-10 py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-1">Lagre Lokalt</button>
             </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {selectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-black p-12 text-white"><div className="flex items-center gap-6"><CompanyLogo className="w-20 h-20" /><div><h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-slate-500 mb-2">Konfigurasjon</h2><h3 className="text-4xl font-black uppercase leading-none">{selectionModal.item.name}</h3></div></div></div>
            <div className="p-12 space-y-12 max-h-[60vh] overflow-y-auto custom-scrollbar font-black uppercase">
              {selectionModal.item.requiredGroups?.map(group => (
                <div key={group.id} className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 flex items-center gap-3 tracking-[0.3em]"><AlertCircle className="w-5 h-5 text-amber-500" />{group.label}</label>
                  <div className="grid grid-cols-1 gap-3">
                    {group.options.map(optionId => {
                      const opt = findItemById(optionId);
                      return (
                        <button key={optionId} onClick={() => setModalSelections({ ...modalSelections, required: { ...modalSelections.required, [group.id]: optionId } })} className={`text-left px-8 py-5 rounded-[2rem] border-4 transition-all flex justify-between items-center ${modalSelections.required[group.id] === optionId ? 'border-black bg-slate-50 text-black ring-8 ring-slate-100' : 'border-slate-50 text-slate-300'}`}>
                          <span className="text-lg">{opt?.name || optionId}</span><span className="text-[10px] px-3 py-1 bg-white rounded-full border border-slate-200">+{opt?.price},-</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectionModal.item.optionalItems?.length > 0 && (
                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 tracking-[0.3em]">Tillegg</label>
                  <div className="grid grid-cols-1 gap-3">
                    {selectionModal.item.optionalItems.map(optionId => {
                      const opt = findItemById(optionId);
                      const isSelected = modalSelections.optional.includes(optionId);
                      return (
                        <button key={optionId} onClick={() => setModalSelections({ ...modalSelections, optional: isSelected ? modalSelections.optional.filter(i => i !== optionId) : [...modalSelections.optional, optionId] })} className={`text-left px-8 py-5 rounded-[2rem] border-4 transition-all flex justify-between items-center ${isSelected ? 'bg-black border-black text-white shadow-2xl scale-105' : 'bg-white border-slate-50 text-slate-300'}`}>
                          <span className="flex items-center gap-4 text-lg">{isSelected ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6" />}{opt?.name || optionId}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-12 bg-slate-50 flex gap-6">
              <button onClick={() => setSelectionModal({ isOpen: false, item: null })} className="flex-1 px-8 py-6 bg-white border-2 border-slate-200 text-slate-400 rounded-3xl font-black uppercase text-xs tracking-widest">Avbryt</button>
              <button onClick={confirmAddToList} className="flex-[2] px-8 py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-slate-800 transition-all">Bekreft</button>
            </div>
          </div>
        </div>
      )}

      {/* Print View */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-16 text-black font-sans uppercase">
        <div className="flex justify-between items-start border-b-[12px] border-black pb-16 mb-16">
          <div className="flex items-center gap-10"><CompanyLogo className="w-32 h-32" /><div><h1 className="text-6xl font-black mb-4 tracking-tighter">Bjerkreim Lyd & Lys AS</h1><p className="text-lg font-black text-slate-400 tracking-[0.4em]">Plukkliste & Pakkseddel</p></div></div>
          <div className="text-right"><div className="text-8xl font-black text-slate-100 tracking-tighter mb-4 opacity-50 uppercase tracking-tighter">LISTE</div><p className="text-3xl font-black text-black tracking-widest">{currentMission.title || 'Uten navn'}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-20 mb-20 bg-slate-50 p-12 rounded-[3rem]">
           <div><p className="text-[11px] font-black text-slate-300 tracking-[0.3em] mb-4">Prosjekt / Kunde</p><p className="text-3xl font-black">{currentMission.client || '---'}</p></div>
           <div className="text-right"><p className="text-[11px] font-black text-slate-300 tracking-[0.3em] mb-4">Dato & Sted</p><p className="text-2xl font-black">{currentMission.location || 'Lager'}</p><p className="text-xl font-bold text-slate-400 mt-2">{currentMission.date}</p></div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b-4 border-black"><th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 uppercase">Utstyr & Detaljer</th><th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-center uppercase">Lager</th><th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-right uppercase">Vekt</th><th className="py-8 font-black text-[12px] tracking-[0.3em] text-slate-300 text-center w-32 uppercase">OK</th></tr></thead>
          <tbody>
            {currentMission.items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-10"><div className="font-black text-3xl tracking-tight uppercase">{item.name}</div><div className="text-[11px] font-black text-slate-400 mt-5 flex flex-wrap gap-4 uppercase">{[...Object.values(item.selections.required), ...item.selections.optional].map((s, i) => (<span key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">● {s}</span>))}</div></td>
                <td className="py-10 text-center font-black text-2xl tracking-tight uppercase font-black uppercase tracking-tighter">{inventory.find(i => i.id === item.id)?.location || '--'}</td>
                <td className="py-10 text-right font-black text-2xl tracking-tight uppercase font-black uppercase tracking-tighter">{item.weight} kg</td>
                <td className="py-10 text-center"><div className="w-14 h-14 border-8 border-slate-100 rounded-[1.5rem] mx-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-24 flex justify-between border-t-[12px] border-black pt-16 uppercase">
           <div className="space-y-12"><div><p className="text-[12px] font-black text-slate-300 tracking-[0.4em] mb-6">Ansvarlig Utlevering</p><div className="w-96 h-1 bg-slate-100" /></div><p className="text-[11px] text-slate-300 font-black italic">Sjekk kabelbrudd ved retur.</p></div>
           <div className="text-right">
              <div className="text-xl font-black text-slate-300 tracking-[0.3em] mb-4">Enheter: <span className="text-black ml-6">{currentMission.items.length}</span></div>
              <div className="text-xl font-black text-slate-300 tracking-[0.3em] mb-4">Vekt: <span className="text-black ml-6">{currentMission.items.reduce((acc, i) => acc + i.weight, 0).toFixed(1)} kg</span></div>
              <div className="text-8xl font-black mt-16 tracking-tighter text-black leading-none uppercase font-black uppercase tracking-tighter">SUM: {currentMission.items.reduce((acc, i) => acc + i.price, 0)},-</div>
           </div>
        </div>
      </div>
    </div>
  );
}
