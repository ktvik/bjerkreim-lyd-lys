import React from 'react';
import { Package, FileText, History, Database, Cloud } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

export default function Header({ activeTab, setActiveTab, exportFullBackup }) {
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
          {['inventory', 'mission', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab === 'inventory' && <Package className="w-4 h-4"/>} 
              {tab === 'mission' && <FileText className="w-4 h-4"/>} 
              {tab === 'history' && <History className="w-4 h-4"/>} 
              {tab === 'inventory' ? 'Lager' : tab === 'mission' ? 'Oppdrag' : 'Arkiv'}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
           <button onClick={exportFullBackup} title="Last ned backup" className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-black hover:text-white transition-all">
              <Database className="w-5 h-5" />
           </button>
        </div>
      </div>
    </header>
  );
}
