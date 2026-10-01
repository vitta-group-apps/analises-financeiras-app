import { useState, useMemo } from 'react'
import type { SavedAnalysis, Property } from '../App'
import { formatCurrency, formatPct } from '../lib/calculations'

interface Props {
  savedAnalyses: SavedAnalysis[]
  properties: Property[]
  onOpenAnalysis: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onSaveProperty: (p: Property) => void
  onDeleteProperty: (id: string) => void
  onNewAnalysis: (propertyId?: string) => void
}

type Tab = 'properties' | 'analyses'
type SortField = 'name' | 'date' | 'irr' | 'npv' | 'capRate' | 'roi' | 'ownCapital'
type SortDir = 'asc' | 'desc'

function badge(irr: number) {
  if (irr >= 18) return { label: 'Excelente', color: '#4A7C59', bg: 'rgba(74,124,89,0.12)' }
  if (irr >= 14) return { label: 'Boa', color: '#C47D0E', bg: 'rgba(196,125,14,0.12)' }
  if (irr >= 10) return { label: 'Adequada', color: '#2563EB', bg: 'rgba(37,99,235,0.12)' }
  return { label: 'Alerta', color: '#C0392B', bg: 'rgba(192,57,43,0.12)' }
}

const BLANK_PROPERTY: Property = {
  id: '',
  name: '',
  status: 'ready',
  city: '',
  area: 0,
  bedrooms: 2,
  suites: 1,
  parkingSpots: 1,
  finishingStandard: 'Alto',
  constructionYear: new Date().getFullYear().toString(),
  monthlyCondo: 0,
  monthlyIPTU: 0,
  needsRenovation: false,
  renovationCosts: 0,
  renovationMonths: 0,
  deliveryMonths: 24,
  inccRate: 6,
  installmentsCount: 0,
  installmentValue: 0,
  createdAt: new Date().toISOString().split('T')[0],
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#6E6B63' }}>{label}</label>
      {children}
    </div>
  )
}

const iS = { background: '#F8F6F1', border: '1px solid #D4CCBE', color: '#1F2A1E', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '13px', width: '100%', outline: 'none' }

const EDIT_PATH = 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
const COPY_PATH = 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
const TRASH_PATH = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'

function IconBtn({ path, label, fn, danger }: { path: string; label: string; fn: () => void; danger?: boolean }) {
  return (
    <button
      title={label}
      onClick={(e) => { e.stopPropagation(); fn() }}
      className="p-1.5 rounded-lg transition-colors"
      style={{ color: danger ? '#C0392B' : '#52504A' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FEF2F2' : '#F1ECE3')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </button>
  )
}

export default function PropertiesView({ savedAnalyses, properties, onOpenAnalysis, onDelete, onDuplicate, onSaveProperty, onDeleteProperty, onNewAnalysis }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('properties')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Analysis table state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')

  function handleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('desc') }
  }

  function openPropertyForm(p?: Property) {
    setEditingProperty(p ? { ...p } : { ...BLANK_PROPERTY, id: Date.now().toString() })
    setShowForm(true)
  }

  function handleFormSave() {
    if (!editingProperty) return
    if (!editingProperty.name.trim()) return
    onSaveProperty(editingProperty)
    setShowForm(false)
    setEditingProperty(null)
  }

  function updProp<K extends keyof Property>(k: K, v: Property[K]) {
    setEditingProperty(prev => prev ? { ...prev, [k]: v } : null)
  }

  const filteredAnalyses = useMemo(() => {
    let list = savedAnalyses.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
      if (propertyFilter !== 'all' && a.propertyId !== propertyFilter) return false
      return true
    })
    list = [...list].sort((a, b) => {
      const va = sortField === 'name' || sortField === 'date' ? a[sortField] : Number(a[sortField as keyof SavedAnalysis])
      const vb = sortField === 'name' || sortField === 'date' ? b[sortField] : Number(b[sortField as keyof SavedAnalysis])
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [savedAnalyses, search, propertyFilter, sortField, sortDir])

  const avgIRR = filteredAnalyses.length ? filteredAnalyses.reduce((s, a) => s + a.irr, 0) / filteredAnalyses.length : 0
  const totalCapital = filteredAnalyses.reduce((s, a) => s + (a.ownCapital ?? 0), 0)

  function SortTh({ field, children }: { field: SortField; children: React.ReactNode }) {
    const active = sortField === field
    const dir = active ? sortDir : null
    return (
      <th
        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
        style={{ color: active ? '#B85B38' : '#6E6B63' }}
        onClick={() => handleSort(field)}
      >
        {children}
        <span className="ml-1 opacity-60">{dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '↕'}</span>
      </th>
    )
  }

  return (
    <div className="min-h-full" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-0">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#52504A' }}>Carteira</p>
            <h1 className="text-2xl md:text-4xl font-bold" style={{ color: '#1F2A1E' }}>Meus Imóveis</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            {activeTab === 'properties' && (
              <button
                onClick={() => openPropertyForm()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#1F2A1E', color: '#F8F6F1' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Cadastrar Imóvel
              </button>
            )}
            {activeTab === 'analyses' && (
              <button
                onClick={() => onNewAnalysis()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#B85B38', color: '#fff' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nova Análise
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-px" style={{ borderBottom: '1px solid #E6E1D7' }}>
          {([['properties', `Imóveis (${properties.length})`], ['analyses', `Análises (${savedAnalyses.length})`]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-sm font-semibold transition-all"
              style={{
                color: activeTab === tab ? '#B85B38' : '#52504A',
                borderBottom: activeTab === tab ? '2px solid #B85B38' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PROPERTIES TAB ── */}
      {activeTab === 'properties' && (
        <div className="px-4 md:px-8 py-6">
          {properties.length === 0 ? (
            <div className="rounded-2xl py-20 text-center" style={{ background: '#fff', border: '1px solid #E6E1D7' }}>
              <div className="text-5xl mb-4">🏠</div>
              <p className="font-semibold mb-2" style={{ color: '#1F2A1E' }}>Nenhum imóvel cadastrado</p>
              <p className="text-sm mb-6" style={{ color: '#52504A' }}>Cadastre um imóvel para vincular análises a ele.</p>
              <button
                onClick={() => openPropertyForm()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#B85B38', color: '#fff' }}
              >
                Cadastrar Imóvel
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map(p => {
                const linked = savedAnalyses.filter(a => a.propertyId === p.id)
                const bestAnalysis = linked.length ? linked.reduce((best, a) => a.irr > best.irr ? a : best) : null
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl p-5 group relative"
                    style={{ background: '#fff', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}
                  >
                    {/* Status badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: p.status === 'ready' ? 'rgba(74,124,89,0.12)' : 'rgba(196,125,14,0.12)',
                          color: p.status === 'ready' ? '#4A7C59' : '#C47D0E',
                        }}
                      >
                        {p.status === 'ready' ? 'Pronto' : 'Na planta'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 pr-16">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: '#F1ECE3' }}>🏠</div>
                      <div>
                        <h3 className="font-bold" style={{ color: '#1F2A1E' }}>{p.name}</h3>
                        <p className="text-xs" style={{ color: '#6E6B63' }}>{p.city}</p>
                      </div>
                    </div>

                    {/* Property specs */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { l: 'm²', v: p.area },
                        { l: 'Q', v: p.bedrooms },
                        { l: 'S', v: p.suites },
                        { l: 'Vg', v: p.parkingSpots },
                      ].map(({ l, v }) => (
                        <div key={l} className="text-center rounded-lg py-1.5" style={{ background: '#F8F6F1' }}>
                          <div className="text-[10px]" style={{ color: '#6E6B63' }}>{l}</div>
                          <div className="mono font-bold text-sm" style={{ color: '#1F2A1E' }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Fixed costs */}
                    <div className="flex justify-between text-xs mb-4 px-1">
                      <span style={{ color: '#6E6B63' }}>Cond. <span className="mono font-semibold" style={{ color: '#1F2A1E' }}>{formatCurrency(p.monthlyCondo)}</span></span>
                      <span style={{ color: '#6E6B63' }}>IPTU/mês <span className="mono font-semibold" style={{ color: '#1F2A1E' }}>{formatCurrency(p.monthlyIPTU)}</span></span>
                      <span style={{ color: '#6E6B63' }}>{p.finishingStandard}</span>
                    </div>

                    {/* Linked analyses */}
                    {bestAnalysis && (
                      <div className="rounded-lg p-3 mb-4 flex justify-between items-center" style={{ background: '#F1ECE3' }}>
                        <div>
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#6E6B63' }}>Melhor TIR</p>
                          <p className="mono font-bold text-base" style={{ color: badge(bestAnalysis.irr).color }}>{formatPct(bestAnalysis.irr, 1)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase" style={{ color: '#6E6B63' }}>Análises</p>
                          <p className="mono font-bold text-base" style={{ color: '#1F2A1E' }}>{linked.length}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNewAnalysis(p.id)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: '#B85B38', color: '#fff' }}
                      >
                        + Nova análise
                      </button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconBtn path={EDIT_PATH} label="Editar" fn={() => openPropertyForm(p)} />
                        <IconBtn path={TRASH_PATH} label="Excluir" fn={() => onDeleteProperty(p.id)} danger />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYSES TAB ── */}
      {activeTab === 'analyses' && (
        <div className="px-4 md:px-8 py-6">
          {/* KPI strip */}
          {filteredAnalyses.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'TIR Média', value: formatPct(avgIRR, 1), color: '#4A7C59' },
                { label: 'Melhor TIR', value: filteredAnalyses.length ? formatPct(Math.max(...filteredAnalyses.map(a => a.irr)), 1) : '—', color: '#B85B38' },
                { label: 'Capital Total', value: totalCapital >= 1e6 ? `R$ ${(totalCapital / 1e6).toFixed(1)}M` : formatCurrency(totalCapital), color: '#1F2A1E' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E6E1D7' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6E6B63' }}>{label}</p>
                  <p className="mono font-bold text-lg" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#6E6B63' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar análise..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: '#fff', border: '1px solid #E6E1D7', color: '#1F2A1E' }}
              />
            </div>
            <select
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg outline-none"
              style={{ background: '#fff', border: '1px solid #E6E1D7', color: '#1F2A1E' }}
            >
              <option value="all">Todos os imóveis</option>
              <option value="">Standalone</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {filteredAnalyses.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: '#fff', border: '1px solid #E6E1D7' }}>
              <div className="text-4xl mb-3">📊</div>
              <p className="font-semibold mb-1" style={{ color: '#1F2A1E' }}>Nenhuma análise encontrada</p>
              <p className="text-sm" style={{ color: '#52504A' }}>Crie uma análise na aba Viabilidade de Compra.</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ minWidth: 720 }}>
                  <thead style={{ background: '#FAFAF8', borderBottom: '1px solid #E6E1D7' }}>
                    <tr>
                      <SortTh field="name">Nome</SortTh>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6E6B63' }}>Imóvel</th>
                      <SortTh field="date">Data</SortTh>
                      <SortTh field="irr">TIR</SortTh>
                      <SortTh field="npv">VPL</SortTh>
                      <SortTh field="capRate">Cap Rate</SortTh>
                      <SortTh field="roi">ROI</SortTh>
                      <SortTh field="ownCapital">Capital</SortTh>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase" style={{ color: '#6E6B63' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalyses.map((a, i) => {
                      const b = badge(a.irr)
                      const prop = properties.find(p => p.id === a.propertyId)
                      return (
                        <tr
                          key={a.id}
                          className="group cursor-pointer transition-colors"
                          style={{ borderBottom: i < filteredAnalyses.length - 1 ? '1px solid #F4F2EE' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FDFCFA')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => onOpenAnalysis(a.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: '#F1ECE3' }}>📊</div>
                              <span className="font-semibold text-sm" style={{ color: '#1F2A1E' }}>{a.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {prop ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F1ECE3', color: '#52504A' }}>{prop.name}</span>
                            ) : (
                              <span className="text-xs" style={{ color: '#D4CCBE' }}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs mono" style={{ color: '#6E6B63' }}>{new Date(a.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3">
                            <span className="mono font-bold text-sm" style={{ color: b.color }}>{formatPct(a.irr, 1)}</span>
                          </td>
                          <td className="px-4 py-3 mono text-sm" style={{ color: a.npv > 0 ? '#4A7C59' : '#C0392B' }}>
                            {a.npv >= 1e6 ? `R$ ${(a.npv / 1e6).toFixed(1)}M` : `R$ ${Math.round(a.npv / 1000)}k`}
                          </td>
                          <td className="px-4 py-3 mono text-sm" style={{ color: '#1F2A1E' }}>{formatPct(a.capRate ?? 0, 2)}</td>
                          <td className="px-4 py-3 mono text-sm" style={{ color: '#1F2A1E' }}>{formatPct(a.roi ?? 0, 1)}</td>
                          <td className="px-4 py-3 mono text-sm" style={{ color: '#52504A' }}>
                            {(a.ownCapital ?? 0) >= 1e6 ? `R$ ${((a.ownCapital ?? 0) / 1e6).toFixed(1)}M` : `R$ ${Math.round((a.ownCapital ?? 0) / 1000)}k`}
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <IconBtn path={EDIT_PATH} label="Editar" fn={() => onOpenAnalysis(a.id)} />
                              <IconBtn path={COPY_PATH} label="Duplicar" fn={() => onDuplicate(a.id)} />
                              <IconBtn path={TRASH_PATH} label="Excluir" fn={() => onDelete(a.id)} danger />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{ background: '#FAFAF8', borderTop: '2px solid #E6E1D7' }}>
                    <tr>
                      <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#6E6B63' }}>{filteredAnalyses.length} análise{filteredAnalyses.length !== 1 ? 's' : ''}</td>
                      <td /><td />
                      <td className="px-4 py-3 mono text-xs font-bold" style={{ color: '#4A7C59' }}>{formatPct(avgIRR, 1)}</td>
                      <td /><td /><td />
                      <td className="px-4 py-3 mono text-xs font-bold" style={{ color: '#1F2A1E' }}>
                        {totalCapital >= 1e6 ? `R$ ${(totalCapital / 1e6).toFixed(1)}M` : formatCurrency(totalCapital)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROPERTY FORM MODAL ── */}
      {showForm && editingProperty && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
          style={{ background: 'rgba(31,42,30,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #E2DCD2', boxShadow: '0 20px 60px rgba(31,42,30,0.25)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E6E1D7' }}>
              <h2 className="text-lg font-bold" style={{ color: '#1F2A1E' }}>
                {editingProperty.id && properties.find(p => p.id === editingProperty.id) ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg" style={{ color: '#52504A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F1ECE3')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-5">
              {/* Status */}
              <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: '#F1ECE3' }}>
                {[{ v: 'ready', l: 'Pronto / Usado' }, { v: 'under_construction', l: 'Na Planta / Em Obras' }].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => updProp('status', v as Property['status'])}
                    className="flex-1 py-2 rounded-md text-xs font-semibold transition-all"
                    style={{ background: editingProperty.status === v ? '#B85B38' : 'transparent', color: editingProperty.status === v ? '#fff' : '#52504A' }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <InputRow label="Nome do imóvel">
                  <input style={iS} value={editingProperty.name} onChange={e => updProp('name', e.target.value)} placeholder="Apto Pinheiros 2Q" />
                </InputRow>
                <InputRow label="Cidade / Bairro">
                  <input style={iS} value={editingProperty.city} onChange={e => updProp('city', e.target.value)} placeholder="São Paulo, SP" />
                </InputRow>
              </div>

              {/* Physical specs */}
              <div className="grid grid-cols-4 gap-3">
                <InputRow label="Área (m²)">
                  <input style={iS} type="number" value={editingProperty.area || ''} onChange={e => updProp('area', Number(e.target.value))} placeholder="65" />
                </InputRow>
                <InputRow label="Quartos">
                  <input style={iS} type="number" value={editingProperty.bedrooms || ''} onChange={e => updProp('bedrooms', Number(e.target.value))} />
                </InputRow>
                <InputRow label="Suítes">
                  <input style={iS} type="number" value={editingProperty.suites || ''} onChange={e => updProp('suites', Number(e.target.value))} />
                </InputRow>
                <InputRow label="Vagas">
                  <input style={iS} type="number" value={editingProperty.parkingSpots || ''} onChange={e => updProp('parkingSpots', Number(e.target.value))} />
                </InputRow>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InputRow label="Padrão de acabamento">
                  <select style={iS} value={editingProperty.finishingStandard} onChange={e => updProp('finishingStandard', e.target.value)}>
                    {['Econômico', 'Médio', 'Alto', 'Luxo'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </InputRow>
                <InputRow label="Condomínio/mês">
                  <input style={iS} type="number" value={editingProperty.monthlyCondo || ''} onChange={e => updProp('monthlyCondo', Number(e.target.value))} placeholder="600" />
                </InputRow>
                <InputRow label="IPTU mensal">
                  <input style={iS} type="number" value={editingProperty.monthlyIPTU || ''} onChange={e => updProp('monthlyIPTU', Number(e.target.value))} placeholder="200" />
                </InputRow>
              </div>

              {/* Conditional: Pronto */}
              {editingProperty.status === 'ready' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow label="Ano de construção">
                      <input style={iS} value={editingProperty.constructionYear} onChange={e => updProp('constructionYear', e.target.value)} placeholder="2019" />
                    </InputRow>
                    <div className="flex items-end pb-1">
                      <button
                        onClick={() => updProp('needsRenovation', !editingProperty.needsRenovation)}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="w-10 h-5 rounded-full relative" style={{ background: editingProperty.needsRenovation ? '#B85B38' : '#D4CCBE' }}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ background: '#fff', transform: editingProperty.needsRenovation ? 'translateX(20px)' : 'translateX(2px)' }} />
                        </div>
                        <span style={{ color: '#1F2A1E' }}>Necessita reforma</span>
                      </button>
                    </div>
                  </div>
                  {editingProperty.needsRenovation && (
                    <div className="grid grid-cols-2 gap-3">
                      <InputRow label="Custo da reforma">
                        <input style={iS} type="number" value={editingProperty.renovationCosts || ''} onChange={e => updProp('renovationCosts', Number(e.target.value))} placeholder="35000" />
                      </InputRow>
                      <InputRow label="Prazo (meses)">
                        <input style={iS} type="number" value={editingProperty.renovationMonths || ''} onChange={e => updProp('renovationMonths', Number(e.target.value))} placeholder="3" />
                      </InputRow>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional: Na Planta */}
              {editingProperty.status === 'under_construction' && (
                <div className="grid grid-cols-2 gap-3">
                  <InputRow label="Prazo de entrega (meses)">
                    <input style={iS} type="number" value={editingProperty.deliveryMonths || ''} onChange={e => updProp('deliveryMonths', Number(e.target.value))} placeholder="24" />
                  </InputRow>
                  <InputRow label="INCC/CUB % a.a.">
                    <input style={iS} type="number" value={editingProperty.inccRate || ''} onChange={e => updProp('inccRate', Number(e.target.value))} placeholder="6" />
                  </InputRow>
                  <InputRow label="Parcelas na obra">
                    <input style={iS} type="number" value={editingProperty.installmentsCount || ''} onChange={e => updProp('installmentsCount', Number(e.target.value))} placeholder="24" />
                  </InputRow>
                  <InputRow label="Valor da parcela">
                    <input style={iS} type="number" value={editingProperty.installmentValue || ''} onChange={e => updProp('installmentValue', Number(e.target.value))} placeholder="3000" />
                  </InputRow>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid #E6E1D7', background: '#FAFAF8' }}>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ color: '#52504A', border: '1px solid #E6E1D7' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F1ECE3')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Cancelar
              </button>
              <button
                onClick={handleFormSave}
                disabled={!editingProperty.name.trim()}
                className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity"
                style={{ background: '#B85B38', color: '#fff', opacity: editingProperty.name.trim() ? 1 : 0.5 }}
              >
                Salvar Imóvel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
