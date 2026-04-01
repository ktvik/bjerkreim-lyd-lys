import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Database, Settings2, Info, Users, ShieldCheck, Trash2, 
  Car, ChevronRight, Key, RefreshCw, Truck, Shield, Save
} from 'lucide-react';
import { fetchVehicleData } from '../services/vehicleService';
import { encryptData } from '../services/encryptionService';
import { AppSettings, Personnel, Group, Vehicle, Permission } from '../types';

interface SettingsTabProps {
  settings: AppSettings;
  personnel: Personnel[];
  groups: Group[];
  vehicles: Vehicle[];
  logError: (message: string, type?: string, source?: string) => void;
}

export default function SettingsTab({ 
  settings, personnel, groups, vehicles, logError 
}: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState('inventory');
  const [svvKeyInput, setSvvKeyInput] = useState('');
  
  // States for sub-forms
  const [editingPerson, setEditingPerson] = useState<Partial<Personnel>>({ name: '', groupId: '' });
  const [editingGroup, setEditingGroup] = useState<Partial<Group>>({ 
    name: '', isAdmin: false,
    permissions: { 
      inventory: 'full', mission: 'full', calendar: 'full', history: 'full', personnel: 'full', isAdmin: false 
    } as Permission 
  });
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle>>({ 
    type: 'Personbil', regnr: '', weight: 0, payload: 0, length: 0, height: 0 
  });
  const [isFetching, setIsFetching] = useState(false);

  // --- Handlers ---
  const updateSetting = async (key: keyof AppSettings, value: any) => {
    let finalValue = value;
    if (key === 'svvApiKey' && value) {
      finalValue = encryptData(value);
    }
    try {
      await setDoc(doc(db, 'settings', 'global'), { ...settings, [key]: finalValue });
    } catch (e: any) {
      logError(`Kunne ikke oppdatere innstilling: ${key}`, 'error', 'SettingsTab');
    }
  };

  const savePerson = async () => {
    if (!editingPerson.name) return;
    const id = editingPerson.id || Date.now().toString();
    try {
      await setDoc(doc(db, 'personnel', id), { ...editingPerson, id });
      setEditingPerson({ name: '', groupId: '' });
    } catch (e: any) {
      logError(`Feil ved lagring av ansatt: ${editingPerson.name}`, 'error', 'SettingsTab');
    }
  };

  const saveGroup = async () => {
    if (!editingGroup.name) return;
    const id = editingGroup.id || Date.now().toString();
    try {
      await setDoc(doc(db, 'groups', id), { ...editingGroup, id });
      setEditingGroup({ 
        name: '', 
        isAdmin: false, 
        permissions: { 
          inventory: 'full', mission: 'full', calendar: 'full', history: 'full', personnel: 'full', isAdmin: false 
        } as Permission 
      });
    } catch (e: any) {
      logError(`Feil ved lagring av gruppe: ${editingGroup.name}`, 'error', 'SettingsTab');
    }
  };

  const saveVehicle = async () => {
    if (!editingVehicle.regnr) return;
    const id = editingVehicle.id || Date.now().toString();
    try {
      await setDoc(doc(db, 'vehicles', id), { ...editingVehicle, id, regnr: editingVehicle.regnr.toUpperCase() });
      setEditingVehicle({ type: 'Personbil', regnr: '', weight: 0, payload: 0, length: 0, height: 0 });
    } catch (e: any) {
      logError(`Feil ved lagring av kjøretøy: ${editingVehicle.regnr}`, 'error', 'SettingsTab');
    }
  };

  const lookupVehicle = async () => {
    if (!editingVehicle.regnr) return;
    setIsFetching(true);
    try {
      const data = await fetchVehicleData(editingVehicle.regnr);
      const td = data.tekniskeData;
      if (td) {
        const typeStr = td.karosseri?.type || '';
        let vehicleType = 'Personbil';
        if (typeStr.includes('lastebil')) vehicleType = 'Lastebil';
        else if (typeStr.includes('varebil')) vehicleType = 'Varebil';
        else if (typeStr.includes('tilhenger')) vehicleType = 'Tilhenger';

        setEditingVehicle({
          ...editingVehicle,
          weight: td.vekt?.egenvektKg || td.vekt?.egenvekt || 0,
          payload: (td.vekt?.tillattTotalvektKg || 0) - (td.vekt?.egenvektKg || 0),
          length: Math.round((td.karosseri?.lengdeMm || 0) / 10),
          height: Math.round((td.karosseri?.høydeMm || 0) / 10),
          type: vehicleType
        });
      }
    } catch (e: any) {
      logError(`Feil ved oppslag av kjøretøy: ${editingVehicle.regnr}`, 'error', 'SVV API');
      alert("Feil ved henting av data. Sjekk loggen for detaljer.");
    } finally {
      setIsFetching(false);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    if (window.confirm('Er du sikker?')) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (e: any) {
        logError(`Feil ved sletting fra ${col}: ${id}`, 'error', 'SettingsTab');
      }
    }
  };

  const menuItems = [
    { id: 'inventory', label: 'Varebeholdning', icon: Database },
    { id: 'vehicles', label: 'Kjøretøyregister', icon: Truck },
    { id: 'personnel', label: 'Ansatte', icon: Users },
    { id: 'groups', label: 'Brukergrupper', icon: ShieldCheck },
    { id: 'system', label: 'Systeminnstillinger', icon: Settings2 }
  ];

  return (
    <div className="max-w-[1600px] mx-auto flex gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <aside className="w-80 shrink-0 space-y-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
             Oppsett <Settings2 className="w-8 h-8 text-rose-500" />
          </h2>
          <p className="text-slate-400 font-black text-[10px] uppercase mt-1 tracking-widest leading-none">Administrasjonssenter</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeSection === item.id 
                ? 'bg-black text-white shadow-xl shadow-black/10' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-rose-500' : 'text-slate-300'}`} />
                <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === item.id ? 'translate-x-1' : 'opacity-0'}`} />
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-white rounded-[3rem] shadow-sm border border-slate-100 p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10 blur-3xl"></div>
        
        {activeSection === 'inventory' && (
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Lager-terskel</h3>
              <p className="text-slate-400 text-xs font-bold mt-2">Definer nivået for varsling av lav beholdning</p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-50">
               <div className="max-w-sm space-y-4">
                  <p className="text-slate-600 text-[13px] font-medium leading-relaxed">
                     Når tilgjengelig antall av en vare faller under denne prosentandelen, blir teksten automatisk farget orange.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl border border-sky-100">
                     <Info className="w-4 h-4 text-sky-500 shrink-0" />
                     <p className="text-[10px] font-black text-sky-700 uppercase">
                        Gjelder nå for alle typer utstyr (Bulk og stykk)
                     </p>
                  </div>
               </div>

               <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 min-w-[280px] shadow-sm">
                  <div className="text-7xl font-black text-black leading-none">{settings.stockThreshold}%</div>
                  <input 
                    type="range" min="1" max="100" step="1"
                    className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    value={settings.stockThreshold}
                    onChange={(e) => updateSetting('stockThreshold', Number(e.target.value))}
                  />
                  <div className="flex justify-between w-full text-[9px] font-black uppercase text-slate-300">
                     <span>Min</span>
                     <span>50%</span>
                     <span>Maks</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'vehicles' && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Kjøretøyregister</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2">Oversikt over bilparken</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 overflow-hidden relative">
              <div className="space-y-4">
                <input 
                   placeholder="REGNR (f.eks AB12345)" 
                   className="w-full p-4 rounded-xl border border-slate-200 uppercase font-black tracking-widest text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                   value={editingVehicle.regnr || ''}
                   onChange={(e) => setEditingVehicle({...editingVehicle, regnr: e.target.value.toUpperCase()})}
                />
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type</label>
                      <select 
                        className="w-full p-4 rounded-xl border border-slate-200 font-bold text-xs appearance-none bg-white"
                        value={editingVehicle.type}
                        onChange={(e) => setEditingVehicle({...editingVehicle, type: e.target.value})}
                      >
                        <option>Personbil</option>
                        <option>Varebil</option>
                        <option>Lastebil</option>
                        <option>Tilhenger</option>
                      </select>
                   </div>
                   <button 
                     onClick={lookupVehicle}
                     disabled={isFetching}
                     className="mt-5 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                   >
                     {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
                     Hent data
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Egenvekt" className="p-4 rounded-xl border border-slate-200 font-bold text-xs" value={editingVehicle.weight || ''} onChange={e => setEditingVehicle({...editingVehicle, weight: Number(e.target.value)})} />
                <input type="number" placeholder="Lastevekt" className="p-4 rounded-xl border border-slate-200 font-bold text-xs" value={editingVehicle.payload || ''} onChange={e => setEditingVehicle({...editingVehicle, payload: Number(e.target.value)})} />
                <input type="number" placeholder="Lengde (cm)" className="p-4 rounded-xl border border-slate-200 font-bold text-xs" value={editingVehicle.length || ''} onChange={e => setEditingVehicle({...editingVehicle, length: Number(e.target.value)})} />
                <input type="number" placeholder="Høyde (cm)" className="p-4 rounded-xl border border-slate-200 font-bold text-xs" value={editingVehicle.height || ''} onChange={e => setEditingVehicle({...editingVehicle, height: Number(e.target.value)})} />
              </div>
              <button 
                onClick={saveVehicle}
                className="col-span-2 p-4 bg-sky-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
              >
                Lagre kjøretøy
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {vehicles.map(v => (
                 <div key={v.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                          <Car className="w-6 h-6 text-slate-400" />
                       </div>
                       <div>
                          <div className="text-sm font-black border-2 border-black px-2 py-0.5 rounded-md inline-block uppercase tracking-widest">{v.regnr}</div>
                          <div className="text-[10px] font-black uppercase text-slate-400 mt-1">{v.type} • {v.weight}kg + {v.payload}kg</div>
                       </div>
                    </div>
                    <button onClick={() => deleteItem('vehicles', v.id)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeSection === 'personnel' && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Ansatte</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2">Administrer teamet</p>
               </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex gap-4">
              <input 
                 placeholder="Navn..." 
                 className="flex-1 p-4 rounded-xl border border-slate-200 font-bold text-xs"
                 value={editingPerson.name || ''}
                 onChange={(e) => setEditingPerson({...editingPerson, name: e.target.value})}
              />
              <select 
                 className="p-4 rounded-xl border border-slate-200 font-bold text-xs bg-white"
                 value={editingPerson.groupId || ''}
                 onChange={(e) => setEditingPerson({...editingPerson, groupId: e.target.value})}
              >
                <option value="">Ingen gruppe</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button 
                onClick={savePerson}
                className="px-8 bg-sky-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
              >
                Legg til
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {personnel.map(p => (
                 <div key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                          {p.name.charAt(0)}
                       </div>
                       <div>
                          <div className="text-xs font-black uppercase">{p.name}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {groups.find(g => g.id === p.groupId)?.name || 'Ingen gruppe'}
                          </div>
                       </div>
                    </div>
                    <button onClick={() => deleteItem('personnel', p.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeSection === 'groups' && (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Brukergrupper</h3>
                  <p className="text-slate-400 text-xs font-bold mt-2">Definer roller og rettigheter</p>
               </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-8">
               <div className="flex items-center justify-between gap-6 border-b border-slate-200 pb-8">
                  <div className="flex-1 space-y-4">
                    <input 
                       placeholder="Gruppenavn (f.eks Admin, Lager, Salg)..." 
                       className="w-full p-4 rounded-xl border border-slate-200 font-bold text-xs"
                       value={editingGroup.name || ''}
                       onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})}
                    />
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" className="w-5 h-5 rounded-md accent-rose-500"
                        checked={editingGroup.isAdmin || false}
                        onChange={(e) => setEditingGroup({...editingGroup, isAdmin: e.target.checked})}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-rose-500" /> Administrator (Full tilgang)
                      </span>
                    </label>
                  </div>
                  <button onClick={saveGroup} className="h-14 px-12 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-500 transition-all shadow-xl shadow-black/10">
                    Lagre Gruppe
                  </button>
               </div>

               {!editingGroup.isAdmin && editingGroup.permissions && (
                 <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    {['inventory', 'mission', 'calendar', 'history'].map(tabId => (
                      <div key={tabId} className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-200">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tabId}</span>
                         <select 
                           className="bg-transparent text-[10px] font-black uppercase outline-none"
                           value={(editingGroup.permissions as any)[tabId]}
                           onChange={(e) => setEditingGroup({
                             ...editingGroup, 
                             permissions: { ...editingGroup.permissions, [tabId]: e.target.value } as Permission
                           })}
                         >
                           <option value="full">Full</option>
                           <option value="les">Les</option>
                           <option value="skjult">Skjult</option>
                         </select>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               {groups.map(g => (
                 <div key={g.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] relative group hover:border-black/10 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${g.isAdmin ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                          {g.isAdmin ? <Shield className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                       </div>
                       <h4 className="text-xs font-black uppercase truncate pr-8">{g.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 opacity-60">
                       {Object.entries(g.permissions).map(([id, perm]) => id !== 'isAdmin' && (
                         <span key={id} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${perm === 'skjult' ? 'border-rose-100 text-rose-400' : 'border-slate-100'}`}>
                            {id}: {perm}
                         </span>
                       ))}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-1">
                      <button onClick={() => setEditingGroup(g)} className="p-1.5 text-slate-200 hover:text-sky-500 transition-all"><Settings2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteItem('groups', g.id)} className="p-1.5 text-slate-200 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {activeSection === 'system' && (
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Systeminnstillinger</h3>
              <p className="text-slate-400 text-xs font-bold mt-2">Kritiske konfigurasjoner for applikasjonen</p>
            </div>

            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                       <Key className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                       <h4 className="text-lg font-black uppercase tracking-tight">Statens Vegvesen API-Nøkkel</h4>
                       <p className="text-slate-400 text-xs font-medium max-w-sm">Oppdater nøkkelen her hvis den utløper. Lagres i Firestore og brukes øyeblikkelig.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Current API Key</label>
                    <div className="flex gap-4">
                       <input 
                         type="password"
                         className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-rose-500 outline-none text-white/80"
                         placeholder="Lim inn ny nøkkel her..."
                         value={svvKeyInput}
                         onChange={(e) => setSvvKeyInput(e.target.value)}
                       />
                       <button 
                         onClick={() => {
                           updateSetting('svvApiKey', svvKeyInput);
                           setSvvKeyInput('');
                           alert("Nøkkelen er kryptert og lagret!");
                         }}
                         className="bg-white text-black px-8 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                       >
                          Lagre
                       </button>
                    </div>
                  </div>
               </div>
               
               <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3"></div>
            </div>
            
            <div className="flex items-center gap-4 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
               <Info className="w-6 h-6 text-amber-500 shrink-0" />
               <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                 Merk: API-nøkkelen lagres nå i databasen for å tillate live-oppdateringer. 
                 Hvis feltet over er tomt, vil systemet falle tilbake på standardnøkkelen fra `.env`-fila.
               </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
