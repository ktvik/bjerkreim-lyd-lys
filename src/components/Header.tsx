import React from 'react';
import { Package, FileText, History, Database, Cloud, User, Calendar, Terminal, LucideIcon } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { Personnel, Permission } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exportFullBackup: () => void;
  userRole: Permission;
  personnel: Personnel[];
  currentUser: Personnel | null;
  setCurrentUser: (user: Personnel | null) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function Header({ 
  activeTab, 
  setActiveTab, 
  exportFullBackup, 
  userRole, 
  personnel, 
  currentUser, 
  setCurrentUser 
}: HeaderProps) {
  const tabs: TabItem[] = [
    { id: 'inventory', label: 'Lager', icon: Package },
    { id: 'mission', label: 'Oppdrag', icon: FileText },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'history', label: 'Arkiv', icon: History },
    { id: 'settings', label: 'Oppsett', icon: Database },
    { id: 'logs', label: 'Logg', icon: Terminal }
  ];

  const visibleTabs = tabs.filter(t => {
    if (t.id === 'settings') return userRole.isAdmin;
    if (t.id === 'logs') return true; 
    const roleKey = t.id as keyof Permission;
    return userRole[roleKey] !== 'skjult';
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CompanyLogo className="w-14 h-14" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-black uppercase">Bjerkreim Lyd & Lys AS</h1>
            <p className="text-[10px] flex items-center gap-1.5 uppercase font-bold text-sky-500 tracking-[0.2em] mt-1.5"><Cloud className="w-3 h-3" /> Firebase Skylagring</p>
          </div>
        </div>
        
        <nav className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <User className="w-4 h-4 text-slate-300" />
              <select 
                className="bg-transparent text-[11px] font-black uppercase outline-none appearance-none cursor-pointer text-slate-600"
                value={currentUser?.id || ''} 
                onChange={(e) => setCurrentUser(personnel.find(p => p.id === e.target.value) || null)}
              >
                <option value="">Se som Admin (Alt)</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
           </div>
           <button onClick={exportFullBackup} title="Last ned backup" className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-black hover:text-white transition-all">
              <Database className="w-5 h-5" />
           </button>
        </div>
      </div>
    </header>
  );
}
