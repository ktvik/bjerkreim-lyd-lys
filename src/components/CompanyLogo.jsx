import React from 'react';

export const CompanyLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm`}>
    <div className="font-black text-slate-800 tracking-tighter w-full h-full flex items-center justify-center bg-slate-50">BLL</div>
  </div>
);
