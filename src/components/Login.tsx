import React from 'react';
import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '../services/authService';
import { CompanyLogo } from './CompanyLogo';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert("Kunne ikke logge inn med Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="mb-8 flex justify-center">
          <CompanyLogo className="w-24 h-24" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-black uppercase mb-2">
          Bjerkreim Lyd & Lys AS
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">
          Lager- og oppdragsstyring
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <LogIn className="w-5 h-5" />
          Logg inn med Google
        </button>

        <p className="mt-8 text-slate-300 text-[10px] font-black uppercase tracking-widest">
          System Versjon v1.2.0
        </p>
      </div>
    </div>
  );
}
