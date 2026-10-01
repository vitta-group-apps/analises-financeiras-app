import React, { useState } from 'react';
import { CurrencyInput } from './ui/CurrencyInput';
import { StickyParameterBar } from './ui/StickyParameterBar';

export const AnalysisForm: React.FC = () => {
  // Estados do Imóvel (Parent)
  const [propertyTitle, setPropertyTitle] = useState('Apto Pinheiros 2Q');
  const [askingPrice, setAskingPrice] = useState(500000);
  const [bedrooms, setBedrooms] = useState(2);
  const [parkingSpots, setParkingSpots] = useState(1);
  const [condoFee, setCondoFee] = useState(650);

  // Estados da Análise/Cenário (Child)
  const [scenarioName, setScenarioName] = useState('Cenário 1: Airbnb PJ');
  const [taxRegime, setTaxRegime] = useState<'PF' | 'PJ'>('PJ');
  const [monthlyRent, setMonthlyRent] = useState(3500);

  // KPIs Simulados para a Sticky Bar
  const mockIRR = 15.4;
  const mockNOI = 2315;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen pb-24 md:pb-12">
      {/* Sticky Bar responsiva ao scroll */}
      <StickyParameterBar
        propertyTitle={propertyTitle}
        price={askingPrice}
        irr={mockIRR}
        noi={mockNOI}
        onEditParameters={scrollToTop}
      />

      {/* DUPLO NÍVEL DE NAVEGAÇÃO */}
      <header className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Nível 1: Seletor de Imóvel */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Imóvel:</span>
            <select
              value={propertyTitle}
              onChange={(e) => setPropertyTitle(e.target.value)}
              className="font-bold text-gray-800 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="Apto Pinheiros 2Q">Apto Pinheiros 2Q</option>
              <option value="Studio Vila Madalena">Studio Vila Madalena</option>
            </select>
          </div>
          <button className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 font-medium">
            + Novo Imóvel
          </button>
        </div>

        {/* Nível 2: Tabs de Cenários */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex gap-2">
            <button className="bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-3 py-1 rounded-lg text-xs">
              Cenário 1: Airbnb PJ
            </button>
            <button className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded-lg text-xs">
              Cenário 2: Tradicional PF
            </button>
          </div>
          <button className="text-blue-600 text-xs font-semibold hover:underline shrink-0">
            + Novo Cenário
          </button>
        </div>
      </header>

      {/* FORMULÁRIO COM GRID DE 12 COLUNAS */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Parâmetros do Imóvel & Finanças</h2>

        <div className="grid grid-cols-12 gap-4">
          {/* Endereço/Título: col-span-12 md:col-span-6 */}
          <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 uppercase">Título do Imóvel</label>
            <input
              type="text"
              value={propertyTitle}
              onChange={(e) => setPropertyTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Valor do Imóvel: col-span-12 md:col-span-4 */}
          <CurrencyInput
            label="Valor Pedido (Asking Price)"
            value={askingPrice}
            onChange={setAskingPrice}
            className="col-span-12 md:col-span-4"
          />

          {/* Vagas: col-span-12 md:col-span-2 */}
          <div className="col-span-12 md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 uppercase">Vagas</label>
            <input
              type="number"
              inputMode="numeric"
              value={parkingSpots}
              onChange={(e) => setParkingSpots(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Condomínio: col-span-12 md:col-span-3 */}
          <CurrencyInput
            label="Condomínio Mensal"
            value={condoFee}
            onChange={setCondoFee}
            className="col-span-12 md:col-span-3"
          />

          {/* Aluguel Estimado: col-span-12 md:col-span-3 */}
          <CurrencyInput
            label="Aluguel Estimado"
            value={monthlyRent}
            onChange={setMonthlyRent}
            className="col-span-12 md:col-span-3"
          />

          {/* Regime Tributário: col-span-12 md:col-span-6 */}
          <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700 uppercase">Regime Tributário</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="taxRegime"
                  value="PJ"
                  checked={taxRegime === 'PJ'}
                  onChange={() => setTaxRegime('PJ')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Pessoa Jurídica (PJ) - Taxa direta s/ Receita Bruta
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="taxRegime"
                  value="PF"
                  checked={taxRegime === 'PF'}
                  onChange={() => setTaxRegime('PF')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Pessoa Física (PF) - Dedução de custos elegíveis
              </label>
            </div>
          </div>
        </div>

        {/* AÇÕES DE SALVAMENTO SEPARADAS */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Salvar Imóvel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 shadow-sm">
            Salvar Análise / Cenário
          </button>
        </div>
      </section>

      {/* FLOATING ACTION BAR (EXCLUSIVA PARA MOBILE) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-3 flex justify-between items-center text-white z-40">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase">TIR Estimada</span>
          <span className="text-base font-bold text-emerald-400">{mockIRR}% a.a.</span>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
          Ver DRE Completa
        </button>
      </div>
    </div>
  );
};
