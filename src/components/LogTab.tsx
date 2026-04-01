import React from 'react';
import { Terminal, Trash2, AlertCircle, Zap, ShieldAlert, Download } from 'lucide-react';
import { AppError } from '../types';

interface LogTabProps {
  errorLogs: AppError[];
  setErrorLogs: React.Dispatch<React.SetStateAction<AppError[]>>;
}

export default function LogTab({ errorLogs, setErrorLogs }: LogTabProps) {
  const clearLogs = () => {
    if (window.confirm("Tøm alle loggmeldinger?")) {
      setErrorLogs([]);
    }
  };

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(errorLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `error_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
             <Terminal className="w-8 h-8 text-rose-500" />
             Systemlogg & Feilmeldinger
          </h2>
          <p className="text-slate-400 font-black text-[10px] uppercase mt-1 tracking-widest leading-none">Overvåk hendelser og feil i sanntid</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={exportLogs}
            className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Eksporter
          </button>
          <button 
            onClick={clearLogs}
            className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[11px] font-black uppercase hover:bg-rose-100 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Tøm logg
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
           <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Live Monitoring Aktiv</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{errorLogs.length} hendelser logget</span>
           </div>
        </div>

        <div className="divide-y divide-slate-50">
          {errorLogs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-slate-50 transition-all group flex gap-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                 log.type === 'promise' ? 'bg-amber-100 text-amber-600' : 
                 log.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                 'bg-rose-100 text-rose-600'
               }`}>
                  {log.type === 'promise' ? <Zap className="w-6 h-6" /> : 
                   log.type === 'warning' ? <ShieldAlert className="w-6 h-6" /> :
                   <AlertCircle className="w-6 h-6" />}
               </div>
               
               <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                     <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        log.type === 'promise' ? 'bg-amber-50 text-amber-700' : 
                        log.type === 'warning' ? 'bg-orange-50 text-orange-700' :
                        'bg-rose-50 text-rose-700'
                     }`}>
                        {log.type === 'promise' ? 'Unhandled Promise' : 
                         log.type === 'warning' ? 'System Warning' :
                         'Runtime Error'}
                     </span>
                     <span className="text-[10px] font-bold text-slate-300 font-mono">
                       {typeof log.timestamp === 'string' ? log.timestamp : 'Just now'}
                     </span>
                  </div>
                  <div className="font-bold text-slate-800 break-words">{log.message}</div>
                  
                  {log.details && (
                    <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                       <div className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-widest border-b border-white/10 pb-2 flex justify-between">
                          <span>Tekniske Detaljer</span>
                          <span className="text-sky-400">{log.source || 'Info'}</span>
                       </div>
                       <pre className="text-[10px] font-mono text-slate-300 leading-relaxed">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                       </pre>
                    </div>
                  )}

                  {log.source && !log.details && (
                    <div className="text-[10px] font-mono text-slate-400 break-all bg-slate-100/50 p-2 rounded-lg mt-2">
                       {log.source}:{log.line}
                    </div>
                  )}
               </div>
            </div>
          ))}

          {errorLogs.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-slate-300 space-y-4">
               <ShieldAlert className="w-16 h-16 opacity-20" />
               <div className="font-black uppercase tracking-widest text-[11px]">Ingen feilmeldinger oppdaget</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative">
         <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
               <Terminal className="w-8 h-8 text-sky-400" />
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-tight">Debug Konsoll</h3>
               <p className="text-slate-400 text-xs font-medium max-w-lg">
                 Denne fanen fanger opp alle kritiske feilmeldinger som skjer i applikasjonen. 
                 Hvis siden slutter å fungere eller viser "white-screen", sjekk denne loggen for detaljer.
               </p>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
}
