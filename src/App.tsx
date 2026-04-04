import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import './App.css';

import Header from './components/Header';
import Login from './components/Login';
import InventoryTab from './components/InventoryTab';
import MissionTab from './components/MissionTab';
import HistoryTab from './components/HistoryTab';
import CalendarTab from './components/CalendarTab';
import SettingsTab from './components/SettingsTab';
import LogTab from './components/LogTab';
import EditingModal from './components/EditingModal';
import SelectionModal from './components/SelectionModal';
import PrintView from './components/PrintView';
import { logAppError } from './services/logService';
import { 
  Item, Mission, Personnel, Group, 
  AppError, AppSettings, Permission, AccessoryGroup 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('activeTab') || 'mission');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [savedMissions, setSavedMissions] = useState<Mission[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Alle');
  
  const [currentMission, setCurrentMission] = useState<Mission>({ 
    id: Date.now().toString(), title: '', client: '', startDate: '', endDate: '', location: '', items: [] 
  });
  const [selectionModal, setSelectionModal] = useState<{ isOpen: boolean; item: Item | null }>({ isOpen: false, item: null });
  const [modalSelections, setModalSelections] = useState<{ required: Record<string, string>; optional: string[] }>({ required: {}, optional: [] });
  const [editingModal, setEditingModal] = useState<{ isOpen: boolean; item: Item | null }>({ isOpen: false, item: null });
  
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]); 
  const [errorLogs, setErrorLogs] = useState<AppError[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ stockThreshold: 20 });
  const [currentUser, setCurrentUser] = useState<Personnel | null>(null); 
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const DEFAULT_PERMISSIONS: Permission = { 
    inventory: 'full', mission: 'full', calendar: 'full', history: 'full', personnel: 'full', isAdmin: false 
  };
  
  const logError = (message: string, type: string = 'error', source: string = 'Manual') => {
    logAppError(source, { message, type });
  };

  const userRole = useMemo(() => {
    const HIDDEN_PERMISSIONS: Permission = {
      inventory: 'skjult',
      mission: 'skjult',
      calendar: 'skjult',
      history: 'skjult',
      personnel: 'skjult',
      isAdmin: false
    };

    if (!firebaseUser || !currentUser) return HIDDEN_PERMISSIONS;

    if (!currentUser.groupId) return { ...DEFAULT_PERMISSIONS, isAdmin: true };
    const group = groups.find(g => g.id === currentUser.groupId);
    return (group ? { ...DEFAULT_PERMISSIONS, ...group.permissions, isAdmin: group.isAdmin } : { 
      inventory: 'les', 
      mission: 'les', 
      calendar: 'les', 
      history: 'les', 
      personnel: 'skjult', 
      isAdmin: false 
    }) as Permission;
  }, [firebaseUser, currentUser, groups]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser && personnel.length > 0) {
      const match = personnel.find(p => p.email?.toLowerCase() === firebaseUser.email?.toLowerCase());
      if (match) {
        setCurrentUser(match);
      } else {
        setCurrentUser(null);
      }
    } else if (!firebaseUser) {
      setCurrentUser(null);
    }
  }, [firebaseUser, personnel]);

  useEffect(() => {
    const handleGlobalError = (message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) => {
      logAppError('Runtime Error', { message: message.toString(), source, line: lineno, type: 'error', stack: error?.stack });
    };
    const handlePromiseError = (event: PromiseRejectionEvent) => {
      logAppError('Unhandled Promise', { message: event.reason?.message || 'Rejection', type: 'promise' });
    };
    window.onerror = handleGlobalError;
    window.onunhandledrejection = handlePromiseError;

    const unsubLogs = onSnapshot(collection(db, 'system_logs'), (snapshot) => {
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString('no-NO') : new Date().toLocaleTimeString('no-NO')
        } as AppError;
      });
      setErrorLogs(logs.slice(0, 50));
    });

    const unsubInv = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventory(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Item)));
    });
    const unsubMis = onSnapshot(collection(db, 'missions'), (snapshot) => {
      setSavedMissions(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Mission)));
    });
    const unsubPers = onSnapshot(collection(db, 'personnel'), (snapshot) => {
      setPersonnel(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Personnel)));
    });
    const unsubGrp = onSnapshot(collection(db, 'groups'), (snapshot) => {
      setGroups(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Group)));
    });
    const unsubVeh = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      setVehicles(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)));
    });
    const unsubSet = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as AppSettings);
    });
    return () => { unsubInv(); unsubMis(); unsubPers(); unsubGrp(); unsubVeh(); unsubSet(); unsubLogs(); };
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'Alle' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const findItemById = (id: string) => inventory.find(i => i.id === id);

  const normalizeItem = (rawItem: any): Item => {
    let item = { ...rawItem };
    let accessoryGroups: AccessoryGroup[] = item.accessoryGroups || [];
    if (accessoryGroups.length === 0) {
       if (item.requiredGroups?.length > 0) {
          item.requiredGroups.forEach((rg: any) => {
             accessoryGroups.push({ id: rg.id, label: rg.label, type: 'required', options: rg.options.map((optId: string, idx: number) => ({ itemId: optId, recommended: idx === 0 })) });
          });
       }
       if (item.optionalItems?.length > 0) {
          accessoryGroups.push({ id: 'opt_old', label: 'Valgfritt tilbehør', type: 'optional', options: item.optionalItems.map((optId: string) => ({ itemId: optId, recommended: false })) });
       }
    }
    item.accessoryGroups = accessoryGroups;
    return item as Item;
  };

  const handleSaveItem = async () => {
    if (!editingModal.item?.name) return;
    const item = normalizeItem(editingModal.item);
    if (!item.id) item.id = Date.now().toString();
    try {
      await setDoc(doc(db, 'inventory', item.id), item);
      setEditingModal({ isOpen: false, item: null });
    } catch (e: any) { 
      logError(`Feil under lagring av enhet: ${item.name}`, 'error', 'Inventory');
      alert("Feil under lagring."); 
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Slett enhet permanent?")) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        setEditingModal({ isOpen: false, item: null });
      } catch (e: any) {
        logError(`Feil ved sletting av enhet: ${id}`, 'error', 'Inventory');
      }
    }
  };

  const handleSaveMissionToArchive = async () => {
    if (!currentMission.title) return alert("Gi oppdraget et navn først.");
    const m = { ...currentMission, lastUpdated: Date.now() };
    try {
      await setDoc(doc(db, 'missions', m.id), m);
      alert("Oppdrag arkivert!");
    } catch (e: any) {
      logError(`Feil ved arkivering av oppdrag: ${m.title}`, 'error', 'Mission');
      alert("Kunne ikke arkivere oppdrag.");
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (window.confirm("Slett oppdrag?")) {
      try {
        await deleteDoc(doc(db, 'missions', id));
      } catch (e: any) {
        logError(`Feil ved sletting av oppdrag: ${id}`, 'error', 'History');
      }
    }
  };

  const openAddToListModal = (rawItem: Item) => {
    const item = normalizeItem(rawItem);
    if (!item.accessoryGroups || item.accessoryGroups.length === 0) {
      setCurrentMission(p => ({ ...p, items: [...p.items, { instanceId: Date.now().toString(), id: item.id, name: item.name, basePrice: item.price || 0, baseWeight: typeof item.weight === 'number' ? item.weight : 0, quantity: 1, itemType: item.itemType || 'unique', selections: { required: {}, optional: [] } }] }));
      return;
    }
    setSelectionModal({ isOpen: true, item });
    const initialReq: Record<string, string> = {};
    const initialOpt: string[] = [];
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
    const item = selectionModal.item;
    if (!item) return;

    let totalWeight = item.weight || 0;
    let totalPrice = item.price || 0;
    const reqDetails: Record<string, string> = {};
    
    const rawSelections: any[] = [];
    Object.entries(modalSelections.required).forEach(([groupId, itemId]) => {
      const sub = findItemById(itemId);
      const group = item.accessoryGroups?.find(g => g.id === groupId);
      const opt = group?.options.find(o => o.itemId === itemId);
      const amt = opt?.amount || 1;
      if (sub) { 
         totalWeight += (sub.weight || 0) * amt; 
         totalPrice += (sub.price || 0) * amt; 
         reqDetails[groupId] = `${amt > 1 ? amt + 'x ' : ''}${sub.name}`;
         rawSelections.push({ id: sub.id, name: sub.name, quantity: amt, location: sub.location });
      }
    });

    const optDetails: string[] = [];
    modalSelections.optional.forEach(itemId => {
      const sub = findItemById(itemId);
      const group = item.accessoryGroups?.find(g => g.options.some(o => o.itemId === itemId));
      const opt = group?.options.find(o => o.itemId === itemId);
      const amt = opt?.amount || 1;
      if (sub) { 
         totalWeight += (sub.weight || 0) * amt; 
         totalPrice += (sub.price || 0) * amt; 
         optDetails.push(`${amt > 1 ? amt + 'x ' : ''}${sub.name}`); 
         rawSelections.push({ id: sub.id, name: sub.name, quantity: amt, location: sub.location });
      }
    });

    setCurrentMission(p => ({ ...p, items: [...p.items, { instanceId: Date.now().toString(), id: item.id, name: item.name, basePrice: totalPrice, baseWeight: parseFloat(totalWeight.toFixed(2)), quantity: 1, itemType: item.itemType || 'unique', selections: { required: reqDetails, optional: optDetails }, rawSelections }] }));
    setSelectionModal({ isOpen: false, item: null });
  };

  const updateQuantity = (instanceId: string, qty: number) => {
    setCurrentMission(p => ({
      ...p,
      items: p.items.map(i => i.instanceId === instanceId ? { ...i, quantity: qty } : i)
    }));
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Header 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); localStorage.setItem('activeTab', tab); }} 
        exportFullBackup={exportFullBackup} 
        userRole={userRole}
        personnel={personnel}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
      
      <main className="max-w-[1600px] mx-auto p-8 print:p-0">
        {activeTab === 'inventory' && userRole.inventory !== 'skjult' && (
          <InventoryTab 
            filteredInventory={filteredInventory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            setEditingModal={setEditingModal}
            openAddToListModal={openAddToListModal}
            normalizeItem={normalizeItem}
            readOnly={userRole.inventory === 'les'}
            settings={settings}
            logError={logError}
          />
        )}
        
        {activeTab === 'mission' && userRole.mission !== 'skjult' && (
          <MissionTab 
            currentMission={currentMission}
            setCurrentMission={setCurrentMission}
            inventory={inventory}
            savedMissions={savedMissions}
            personnel={personnel}
            filteredInventory={filteredInventory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            setEditingModal={setEditingModal}
            normalizeItem={normalizeItem}
            openAddToListModal={openAddToListModal}
            handleSaveMissionToArchive={handleSaveMissionToArchive}
            handleDeleteMission={handleDeleteMission}
            updateQuantity={updateQuantity}
            readOnly={userRole.mission === 'les'}
            settings={settings}
            logError={logError}
          />
        )}

        {activeTab === 'calendar' && userRole.calendar !== 'skjult' && (
          <CalendarTab 
            savedMissions={savedMissions}
            setCurrentMission={setCurrentMission}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'history' && userRole.history !== 'skjult' && (
          <HistoryTab 
            savedMissions={savedMissions}
            setCurrentMission={setCurrentMission}
            setActiveTab={setActiveTab}
            handleDeleteMission={handleDeleteMission}
            personnel={personnel}
            readOnly={userRole.history === 'les'}
            logError={logError}
          />
        )}

        {activeTab === 'logs' && (
          <LogTab 
            errorLogs={errorLogs}
            setErrorLogs={setErrorLogs}
          />
        )}

        {activeTab === 'settings' && userRole.isAdmin && (
          <SettingsTab 
            settings={settings}
            personnel={personnel}
            groups={groups}
            vehicles={vehicles}
            logError={logError}
          />
        )}
      </main>

      <footer className="max-w-[1600px] mx-auto px-6 py-12 border-t border-slate-100 mt-20 flex justify-between items-center text-slate-400">
         <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
            <span>&copy; 2026 Bjerkreim Lyd & Lys AS</span>
            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            <span>System Versjon v1.2.0</span>
         </div>
         <div className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="opacity-40">Build Timestamp:</span> 
            <span className="text-slate-800">{new Date().toLocaleString('no-NO')}</span>
         </div>
      </footer>

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
