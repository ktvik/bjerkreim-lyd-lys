import React from 'react';
// @ts-ignore
import logo from '../assets/logo.jpg';

interface CompanyLogoProps {
  className?: string;
}

export const CompanyLogo = ({ className = "w-10 h-10" }: CompanyLogoProps) => (
  <div className={`${className} bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm p-0.5`}>
    <img src={logo} alt="Bjerkreim Lyd & Lys Logo" className="w-full h-full object-cover rounded-full" />
  </div>
);
