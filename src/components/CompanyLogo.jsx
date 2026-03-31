import React from 'react';
import logo from '../assets/logo.jpg';

export const CompanyLogo = ({ className = "w-10 h-10" }) => (
  <div className={`${className} bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm p-0.5`}>
    <img src={logo} alt="Bjerkreim Lyd & Lys Logo" className="w-full h-full object-cover rounded-full" />
  </div>
);
