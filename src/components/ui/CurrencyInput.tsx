import React from 'react';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const numericValue = Number(digitsOnly) / 100;
    onChange(numericValue);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={formatCurrency(value)}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
      />
    </div>
  );
};
