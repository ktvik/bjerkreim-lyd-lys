import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import './App.css';

import Header from './components/Header';
import InventoryTab from './components/InventoryTab';
import MissionTab from './components/MissionTab';
import HistoryTab from './components/HistoryTab';
import EditingModal from './components/EditingModal';
import SelectionModal from './components/SelectionModal';
import PrintView from './components/PrintView';

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
      const group = item.accessoryGroups?.find(g => g.id === groupId);
      const opt = group?.options.find(o => o.itemId === itemId);
      const amt = opt?.amount || 1;
      if (sub) { totalWeight += (sub.weight || 0) * amt; totalPrice += (sub.price || 0) * amt; reqDetails[groupId] = `${amt > 1 ? amt + 'x ' : ''}${sub.name}`; }
    });

    const optDetails = [];
    modalSelections.optional.forEach(itemId => {
      const sub = findItemById(itemId);
      const group = item.accessoryGroups?.find(g => g.options.some(o => o.itemId === itemId));
      const opt = group?.options.find(o => o.itemId === itemId);
      const amt = opt?.amount || 1;
      if (sub) { totalWeight += (sub.weight || 0) * amt; totalPrice += (sub.price || 0) * amt; optDetails.push(`${amt > 1 ? amt + 'x ' : ''}${sub.name}`); }
    });

    setCurrentMission(p => ({ ...p, items: [...p.items, { instanceId: Date.now().toString(), id: item.id, name: item.name, price: totalPrice, weight: parseFloat(totalWeight.toFixed(2)), selections: { required: reqDetails, optional: optDetails } }] }));
    setSelectionModal({ isOpen: false, item: null });
  };

  const exportFullBackup = () => {
    const data = { inventory, missions: savedMissions, exportDate: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bjerkreim_firestore_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        exportFullBackup={exportFullBackup} 
      />
      
      <main className="max-w-[1600px] mx-auto p-8 print:p-0">
        {activeTab === 'inventory' && (
          <InventoryTab 
            filteredInventory={filteredInventory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            setEditingModal={setEditingModal}
            openAddToListModal={openAddToListModal}
            normalizeItem={normalizeItem}
          />
        )}
        
        {activeTab === 'mission' && (
          <MissionTab 
            currentMission={currentMission}
            setCurrentMission={setCurrentMission}
            filteredInventory={filteredInventory}
            setSearchQuery={setSearchQuery}
            openAddToListModal={openAddToListModal}
            handleSaveMissionToArchive={handleSaveMissionToArchive}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab 
            savedMissions={savedMissions}
            setCurrentMission={setCurrentMission}
            setActiveTab={setActiveTab}
            handleDeleteMission={handleDeleteMission}
          />
        )}
      </main>

      <EditingModal 
         editingModal={editingModal}
         setEditingModal={setEditingModal}
         handleSaveItem={handleSaveItem}
         handleDeleteItem={handleDeleteItem}
         inventory={inventory}
         findItemById={findItemById}
      />

      <SelectionModal 
         selectionModal={selectionModal}
         setSelectionModal={setSelectionModal}
         modalSelections={modalSelections}
         setModalSelections={setModalSelections}
         confirmAddToList={confirmAddToList}
         findItemById={findItemById}
      />

      <PrintView currentMission={currentMission} inventory={inventory} />
    </div>
  );
}
