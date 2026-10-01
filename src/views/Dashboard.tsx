import type { SavedAnalysis, Property } from '../App'
import { formatCurrency, formatPct } from '../lib/calculations'

interface Props {
  savedAnalyses: SavedAnalysis[]
  properties: Property[]
  onNewAnalysis: () => void
  onOpenAnalysis: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

const card = {
  background: '#fff',
  border: '1px solid #E6E1D7',
  boxShadow: '0 1px 3px rgba(52,67,53,0.06)',
  borderRadius: '12px',
}

function KpiCard({ label, value, badge, badgeColor, sub, accent }: {
  label: string; value: string; badge?: string; badgeColor?: string;
  sub?: string; accent?: boolean
}) {
  return (
    <div className="p-5" style={card}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#52504A' }}>{label}</p>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: badgeColor ? `${badgeColor}18` : '#34433518', color: badgeColor || '#1F2A1E' }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className="font-semibold leading-none mono truncate"
        style={{ fontSize: 'clamp(1rem, 3vw, 1.875rem)', color: accent ? '#B85B38' : '#1F2A1E' }}
      >
        {value}
      </div>
      {sub && <p className="text-xs mt-2" style={{ color: '#52504A' }}>{sub}</p>}
    </div>
  )
}

function QuickAction({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={label}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      style={{ color: danger ? '#C0392B' : '#52504A' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FEF2F2' : '#F1ECE3')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    </button>
  )
}

const EDIT_ICON = 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
const COPY_ICON = 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
const TRASH_ICON = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'

const glossary = [
  { term: 'TIR', def: 'Taxa Interna de Retorno — eficiência média anualizada do investimento no período' },
  { term: 'VPL', def: 'Valor Presente Líquido — riqueza criada hoje, descontada pelo custo de oportunidade' },
  { term: 'ROI', def: 'Retorno Sobre Investimento — ganho total / capital próprio investido' },
  { term: 'Cap Rate', def: 'NOI anual / valor total investido — rentabilidade bruta do ativo' },
  { term: 'Yield Líq.', def: 'Fluxo após despesas, financiamento e impostos / capital próprio' },
  { term: 'LTV', def: 'Loan to Value — % do imóvel financiado pelo banco (máx. recomendado: 80%)' },
]

export default function Dashboard({ savedAnalyses, properties, onNewAnalysis, onOpenAnalysis, onDuplicate, onDelete }: Props) {
  const _ = properties // used for future property count KPI
  const avgIRR = savedAnalyses.length > 0
    ? savedAnalyses.reduce((s, a) => s + a.irr, 0) / savedAnalyses.length : 0
  const totalNPV = savedAnalyses.reduce((s, a) => s + a.npv, 0)
  const avgPayback = savedAnalyses.length > 0 ? 9.2 : 0 // placeholder until payback stored

  function irrBadge(irr: number) {
    if (irr >= 18) return { label: 'Excelente', color: '#4A7C59' }
    if (irr >= 14) return { label: 'Boa', color: '#C47D0E' }
    if (irr >= 10) return { label: 'Adequada', color: '#2563EB' }
    return { label: 'Alerta', color: '#C0392B' }
  }

  return (
    <div className="min-h-full p-4 md:p-8" style={{ background: 'var(--color-canvas, #F8F6F1)' }}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#52504A' }}>
            Portfólio pessoal
          </p>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: '#1F2A1E' }}>Visão Geral</h1>
          <p className="text-sm mt-1" style={{ color: '#52504A' }}>
            Indicadores consolidados das suas simulações.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            title="Exportar PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border"
            style={{ background: '#fff', color: '#52504A', borderColor: '#E2DCD2' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F8F6F1')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            PDF
          </button>
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#B85B38', color: '#fff', boxShadow: '0 2px 8px rgba(184,91,56,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A04E2F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#B85B38')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova Análise
          </button>
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <KpiCard
          label="TIR Média"
          value={savedAnalyses.length > 0 ? formatPct(avgIRR, 1) : '—'}
          badge={savedAnalyses.length > 0 ? irrBadge(avgIRR).label : undefined}
          badgeColor={savedAnalyses.length > 0 ? irrBadge(avgIRR).color : undefined}
          sub="vs. TMA de 10% a.a."
          accent
        />
        <KpiCard
          label="VPL Acumulado"
          value={totalNPV > 0 ? formatCurrency(totalNPV) : '—'}
          sub="Riqueza criada pelo portfólio"
        />
        <KpiCard
          label="Imóveis analisados"
          value={String(savedAnalyses.length)}
          badge={savedAnalyses.filter(a => a.irr >= 10).length + ' viáveis'}
          badgeColor="#4A7C59"
          sub="Simulações salvas"
        />
        <KpiCard
          label="Payback médio"
          value={savedAnalyses.length > 0 ? `${avgPayback.toFixed(1)} anos` : '—'}
          sub="Recuperação do capital próprio"
        />
      </div>

      {/* Saved analyses table */}
      <div className="mb-6 md:mb-8 overflow-hidden" style={{ ...card, borderRadius: '16px' }}>
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E6E1D7' }}
        >
          <h2 className="text-lg font-bold" style={{ color: '#1F2A1E' }}>Análises salvas</h2>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#F1ECE3', color: '#52504A' }}
          >
            {savedAnalyses.length} simulações
          </span>
        </div>

        {savedAnalyses.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🏗️</div>
            <p className="text-sm" style={{ color: '#52504A' }}>Nenhuma análise salva ainda.</p>
            <button
              onClick={onNewAnalysis}
              className="mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: '#B85B38', color: '#fff' }}
            >
              Criar primeira análise
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E6E1D7', background: '#FAFAF8' }}>
                  {['Nome', 'Data', 'TIR', 'VPL', 'ROI', 'Cap Rate', 'Capital', 'Ações'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6E6B63' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedAnalyses.map((a, i) => {
                  const badge = irrBadge(a.irr)
                  return (
                    <tr
                      key={a.id}
                      className="group cursor-pointer transition-colors"
                      style={{
                        borderBottom: i < savedAnalyses.length - 1 ? '1px solid #F1ECE3' : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FDFCFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => onOpenAnalysis(a.id)}
                    >
                      <td className="px-5 py-4 font-semibold" style={{ color: '#1F2A1E' }}>{a.name}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#6E6B63' }}>
                        {new Date(a.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="mono font-bold" style={{ color: badge.color }}>{formatPct(a.irr, 1)}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${badge.color}18`, color: badge.color }}>
                            {badge.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4 mono font-medium" style={{ color: '#1F2A1E' }}>{formatCurrency(a.npv)}</td>
                      <td className="px-5 py-4 mono text-xs" style={{ color: '#52504A' }}>{formatPct(a.roi ?? 0, 1)}</td>
                      <td className="px-5 py-4 mono text-xs" style={{ color: '#52504A' }}>{formatPct(a.capRate, 2)}</td>
                      <td className="px-5 py-4 mono text-xs" style={{ color: '#52504A' }}>
                        {(a.ownCapital ?? 0) >= 1000000
                          ? `R$ ${((a.ownCapital ?? 0) / 1000000).toFixed(1)}M`
                          : `R$ ${Math.round((a.ownCapital ?? 0) / 1000)}k`}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <QuickAction icon={EDIT_ICON} label="Editar" onClick={() => onOpenAnalysis(a.id)} />
                          <QuickAction icon={COPY_ICON} label="Duplicar" onClick={() => onDuplicate(a.id)} />
                          <QuickAction icon={TRASH_ICON} label="Excluir" onClick={() => onDelete(a.id)} danger />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Glossary */}
      <div className="overflow-hidden" style={{ ...card, borderRadius: '16px' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #E6E1D7' }}>
          <h3 className="text-lg font-bold" style={{ color: '#1F2A1E' }}>Glossário de indicadores</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
          {glossary.map(({ term, def }, i) => (
            <div key={term} className="p-5" style={{ borderRight: (i + 1) % 3 !== 0 ? '1px solid #F1ECE3' : 'none', borderBottom: i < 3 ? '1px solid #F1ECE3' : 'none' }}>
              <span
                className="mono text-xs font-bold inline-block mb-2 px-2 py-0.5 rounded"
                style={{ background: '#F1ECE3', color: '#B85B38' }}
              >
                {term}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#52504A' }}>{def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
