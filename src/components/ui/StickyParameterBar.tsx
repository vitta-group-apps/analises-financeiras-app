import React, { useState, useEffect } from 'react';

interface StickyParameterBarProps {
  propertyTitle: string;
  price: number;
  irr: number;
  noi: number;
  onEditParameters: () => void;
}

export const StickyParameterBar: React.FC<StickyParameterBarProps> = ({
  propertyTitle,
  price,
  irr,
  noi,
  onEditParameters,
}) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 220);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isSticky) return null;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 py-2.5 px-4 shadow-xl border-b border-slate-700 flex justify-between items-center text-xs md:text-sm animate-fade-in">
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto whitespace-nowrap">
        <span className="font-bold text-blue-400">{propertyTitle || 'Imóvel sem título'}</span>
        <span className="text-slate-600">·</span>
        <span>{formatBRL(price)}</span>
        <span className="text-slate-600">·</span>
        <span className="text-emerald-400 font-bold">TIR: {irr.toFixed(1)}%</span>
        <span className="text-slate-600">·</span>
        <span>NOI: {formatBRL(noi)}/mês</span>
      </div>
      <button
        onClick={onEditParameters}
        className="ml-3 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md text-xs transition-colors shrink-0"
      >
        Editar Parâmetros
      </button>
    </div>
  );
};
