import { useState, useMemo, useEffect } from 'react'
import {
  runAnalysis, defaultInput, formatCurrency, formatPct,
  type AnalysisInput, type AnalysisResults,
} from '../lib/calculations'
import ResultsPanel from '../components/ResultsPanel'
import type { SavedAnalysis, Property } from '../App'

interface Props {
  analysisId: string | null
  selectedProperty: Property | null
  properties: Property[]
  onSave: (a: SavedAnalysis) => void
  onSelectProperty: (id: string | null) => void
}

type Block = 1 | 2 | 3 | 4 | 5 | 6

const blocks = [
  { id: 1, label: 'Imóvel', icon: '🏠' },
  { id: 2, label: 'Compra', icon: '💰' },
  { id: 3, label: 'Financiamento', icon: '🏦' },
  { id: 4, label: 'Renda', icon: '🏘️' },
  { id: 5, label: 'Valorização', icon: '📈' },
  { id: 6, label: 'Investidor', icon: '💼' },
]

function Field({ label, hint, children, span2 }: { label: string; hint?: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: '#6E6B63' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: '#6E6B63' }}>{hint}</p>}
    </div>
  )
}

const inputStyle = { background: '#F8F6F1', border: '1px solid #D4CCBE', color: '#1F2A1E' }
const baseCls = 'w-full rounded-lg text-sm mono font-medium outline-none transition-all focus:ring-1 focus:ring-[#B85B38] px-3 py-2.5'
const inputCls = baseCls

function parseBRL(raw: string): number {
  if (!raw || raw.trim() === '') return 0
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

function NumInput({ value, onChange, prefix, suffix }: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  function handleFocus() {
    setFocused(true)
    setRaw(value === 0 ? '' : String(value).replace('.', ','))
  }

  function handleBlur() {
    setFocused(false)
    const n = parseBRL(raw)
    onChange(n)
    setRaw('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (/^[0-9.,]*$/.test(val)) setRaw(val)
  }

  const displayValue = focused
    ? raw
    : value === 0 ? '' : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

  const pl = prefix ? '3rem' : '0.75rem'
  const pr = suffix ? `${suffix.length * 0.6 + 1.5}rem` : '0.75rem'

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-xs font-semibold pointer-events-none z-10 select-none" style={{ color: '#6E6B63', whiteSpace: 'nowrap' }}>
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder="0"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={baseCls}
        style={{ ...inputStyle, paddingLeft: pl, paddingRight: pr }}
      />
      {suffix && (
        <span className="absolute right-3 text-xs font-semibold pointer-events-none select-none" style={{ color: '#6E6B63', whiteSpace: 'nowrap' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#F8F6F1' }}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-3 text-sm py-1">
      <div className="w-10 h-5 rounded-full relative transition-colors shrink-0" style={{ background: value ? '#B85B38' : '#D4CCBE' }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform" style={{ background: '#fff', transform: value ? 'translateX(20px)' : 'translateX(2px)' }} />
      </div>
      <span style={{ color: '#1F2A1E' }}>{label}</span>
    </button>
  )
}

function SegmentedControl({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: '#F1ECE3' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex-1 py-2 rounded-md text-xs font-semibold transition-all"
          style={{
            background: value === opt.value ? '#B85B38' : 'transparent',
            color: value === opt.value ? '#fff' : '#52504A',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function AnalysisView({ analysisId: _id, selectedProperty, properties, onSave, onSelectProperty }: Props) {
  const [inp, setInp] = useState<AnalysisInput>(defaultInput)
  const [activeBlock, setActiveBlock] = useState<Block>(1)
  const [analysisName, setAnalysisName] = useState('Análise sem título')
  const [panelOpen, setPanelOpen] = useState(true)

  // When a property is selected, sync its physical fields into inp
  useEffect(() => {
    if (selectedProperty) {
      setInp(prev => ({
        ...prev,
        propertyStatus: selectedProperty.status,
        city: selectedProperty.city,
        propertyType: prev.propertyType, // keep existing
        area: selectedProperty.area,
        bedrooms: selectedProperty.bedrooms,
        suites: selectedProperty.suites,
        parkingSpots: selectedProperty.parkingSpots,
        finishingStandard: selectedProperty.finishingStandard,
        constructionYear: selectedProperty.constructionYear,
        monthlyCondo: selectedProperty.monthlyCondo,
        monthlyIPTU: selectedProperty.monthlyIPTU,
        needsRenovation: selectedProperty.needsRenovation,
        renovationCosts: selectedProperty.renovationCosts,
        renovationMonths: selectedProperty.renovationMonths,
        deliveryMonths: selectedProperty.deliveryMonths,
        inccRate: selectedProperty.inccRate,
        installmentsCount: selectedProperty.installmentsCount,
        installmentValue: selectedProperty.installmentValue,
      }))
      setAnalysisName(`Análise — ${selectedProperty.name}`)
    }
  }, [selectedProperty?.id])

  function upd<K extends keyof AnalysisInput>(key: K, value: AnalysisInput[K]) {
    setInp((prev) => ({ ...prev, [key]: value }))
  }

  const results: AnalysisResults = useMemo(() => {
    try { return runAnalysis(inp) } catch { return runAnalysis(defaultInput) }
  }, [inp])

  function handleSave() {
    const id = Date.now().toString()
    onSave({
      id,
      propertyId: selectedProperty?.id ?? null,
      name: analysisName,
      date: new Date().toISOString().split('T')[0],
      irr: results.irr,
      npv: results.npv,
      capRate: results.capRate,
      roi: results.roi,
      ownCapital: results.ownCapital,
    })
  }

  const isReady = inp.propertyStatus === 'ready'

  // Summary chips shown when panel is collapsed
  const summaryCls = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mono'
  const summaryChips = (
    <div className="flex items-center gap-1.5 flex-wrap ml-2">
      <span className={summaryCls} style={{ background: '#F1ECE3', color: '#52504A' }}>
        {inp.propertyType} · {inp.bedrooms}Q · {inp.area}m²
      </span>
      <span className={summaryCls} style={{ background: '#F1ECE3', color: '#B85B38' }}>
        {formatCurrency(inp.propertyValue)}
      </span>
      <span className={summaryCls} style={{ background: isReady ? 'rgba(74,124,89,0.12)' : 'rgba(196,125,14,0.12)', color: isReady ? '#4A7C59' : '#C47D0E' }}>
        {isReady ? 'Pronto' : 'Na planta'}
      </span>
      {results.irr > 0 && results.irr < 100 && (
        <span className={summaryCls} style={{ background: 'rgba(184,91,56,0.1)', color: '#B85B38' }}>
          TIR {formatPct(results.irr, 1)}
        </span>
      )}
    </div>
  )

  const blockContent = (
    <div className="overflow-y-auto" style={{ maxHeight: panelOpen ? 'min(50vh, 400px)' : '0', transition: 'max-height 0.25s ease' }}>
      <div className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* BLOCK 1 */}
          {activeBlock === 1 && (
            <>
              <Field label="Status do imóvel" span2>
                <SegmentedControl
                  value={inp.propertyStatus}
                  onChange={(v) => upd('propertyStatus', v as 'ready' | 'under_construction')}
                  options={[
                    { value: 'ready', label: 'Pronto / Usado' },
                    { value: 'under_construction', label: 'Na Planta / Em Obras' },
                  ]}
                />
              </Field>
              <Field label="Cidade e bairro" span2>
                <input value={inp.city} onChange={(e) => upd('city', e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="São Paulo, SP — Pinheiros" />
              </Field>
              <Field label="Tipo de imóvel" span2>
                <Select value={inp.propertyType} onChange={(v) => upd('propertyType', v)} options={[
                  { value: 'Apartamento', label: 'Apartamento' },
                  { value: 'Casa', label: 'Casa' },
                  { value: 'Studio', label: 'Studio / Kitnet' },
                  { value: 'Cobertura', label: 'Cobertura' },
                  { value: 'Comercial', label: 'Comercial' },
                ]} />
              </Field>
              <Field label="Área útil">
                <NumInput value={inp.area} onChange={(v) => upd('area', v)} suffix="m²" />
              </Field>
              <Field label="Padrão">
                <Select value={inp.finishingStandard} onChange={(v) => upd('finishingStandard', v)} options={[
                  { value: 'Econômico', label: 'Econômico' },
                  { value: 'Médio', label: 'Médio' },
                  { value: 'Alto', label: 'Alto' },
                  { value: 'Luxo', label: 'Luxo / Premium' },
                ]} />
              </Field>
              <Field label="Quartos">
                <NumInput value={inp.bedrooms} onChange={(v) => upd('bedrooms', v)} />
              </Field>
              <Field label="Suítes">
                <NumInput value={inp.suites} onChange={(v) => upd('suites', v)} />
              </Field>
              <Field label="Vagas">
                <NumInput value={inp.parkingSpots} onChange={(v) => upd('parkingSpots', v)} />
              </Field>
              <Field label="Condomínio/mês">
                <NumInput value={inp.monthlyCondo} onChange={(v) => upd('monthlyCondo', v)} prefix="R$" />
              </Field>
              <Field label="IPTU mensal">
                <NumInput value={inp.monthlyIPTU} onChange={(v) => upd('monthlyIPTU', v)} prefix="R$" />
              </Field>

              {/* Conditional: Pronto / Usado */}
              {isReady && (
                <>
                  <Field label="Ano de construção">
                    <input value={inp.constructionYear} onChange={(e) => upd('constructionYear', e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="2018" />
                  </Field>
                  <div className="col-span-1 flex items-end pb-1">
                    <Toggle value={inp.needsRenovation} onChange={(v) => upd('needsRenovation', v)} label="Necessita reforma" />
                  </div>
                  {inp.needsRenovation && (
                    <>
                      <Field label="Valor reforma/enxoval" span2>
                        <NumInput value={inp.renovationCosts} onChange={(v) => upd('renovationCosts', v)} prefix="R$" />
                      </Field>
                      <Field label="Prazo da reforma">
                        <NumInput value={inp.renovationMonths} onChange={(v) => upd('renovationMonths', v)} suffix="meses" />
                      </Field>
                    </>
                  )}
                </>
              )}

              {/* Conditional: Na Planta / Em Obras */}
              {!isReady && (
                <>
                  <Field label="Prazo de entrega">
                    <NumInput value={inp.deliveryMonths} onChange={(v) => upd('deliveryMonths', v)} suffix="meses" />
                  </Field>
                  <Field label="Índice INCC/CUB" hint="% a.a.">
                    <NumInput value={inp.inccRate} onChange={(v) => upd('inccRate', v)} suffix="% a.a." />
                  </Field>
                  <Field label="Parcelas na obra">
                    <NumInput value={inp.installmentsCount} onChange={(v) => upd('installmentsCount', v)} />
                  </Field>
                  <Field label="Valor da parcela">
                    <NumInput value={inp.installmentValue} onChange={(v) => upd('installmentValue', v)} prefix="R$" />
                  </Field>
                </>
              )}
            </>
          )}

          {/* BLOCK 2 */}
          {activeBlock === 2 && (
            <>
              <Field label="Valor do imóvel" span2>
                <NumInput value={inp.propertyValue} onChange={(v) => upd('propertyValue', v)} prefix="R$" />
              </Field>
              <Field label="Entrada" span2>
                <div className="flex flex-col gap-2">
                  <SegmentedControl
                    value={inp.downPaymentPct ? '%' : 'R$'}
                    onChange={(v) => upd('downPaymentPct', v === '%')}
                    options={[{ value: 'R$', label: 'R$' }, { value: '%', label: '%' }]}
                  />
                  <NumInput
                    value={inp.downPayment}
                    onChange={(v) => upd('downPayment', v)}
                    prefix={inp.downPaymentPct ? undefined : 'R$'}
                    suffix={inp.downPaymentPct ? '%' : undefined}
                  />
                </div>
                {inp.downPaymentPct && (
                  <p className="text-xs mt-1" style={{ color: '#B85B38' }}>
                    = {formatCurrency(inp.propertyValue * inp.downPayment / 100)}
                  </p>
                )}
              </Field>
              <Field label="ITBI + Cartório" span2>
                <NumInput value={inp.acquisitionCosts} onChange={(v) => upd('acquisitionCosts', v)} prefix="R$" />
              </Field>
              <Field label="Reforma / decoração" span2>
                <NumInput value={inp.renovationCosts} onChange={(v) => upd('renovationCosts', v)} prefix="R$" />
              </Field>
              {/* Under construction: obra installments */}
              {!isReady && (
                <>
                  <Field label="Parcelas na obra">
                    <NumInput value={inp.installmentsCount} onChange={(v) => upd('installmentsCount', v)} />
                  </Field>
                  <Field label="Valor da parcela">
                    <NumInput value={inp.installmentValue} onChange={(v) => upd('installmentValue', v)} prefix="R$" />
                  </Field>
                  <Field label="INCC/CUB a.a." span2>
                    <NumInput value={inp.inccRate} onChange={(v) => upd('inccRate', v)} suffix="% a.a." />
                  </Field>
                  {results.inccCorrection > 0 && (
                    <div className="col-span-2 rounded-lg p-3 text-xs" style={{ background: 'rgba(184,91,56,0.06)', border: '1px solid rgba(184,91,56,0.2)' }}>
                      <span style={{ color: '#C47D0E' }}>Correção INCC acumulada: <span className="mono font-bold">{formatCurrency(results.inccCorrection)}</span></span>
                    </div>
                  )}
                </>
              )}
              <div className="col-span-2 rounded-lg p-4 space-y-2 text-xs" style={{ background: '#F1ECE3', border: '1px solid #D4CCBE' }}>
                <div className="flex justify-between">
                  <span style={{ color: '#52504A' }}>Capital próprio total</span>
                  <span className="mono font-bold" style={{ color: '#B85B38' }}>{formatCurrency(results.ownCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#52504A' }}>Custo total de aquisição</span>
                  <span className="mono font-semibold" style={{ color: '#1F2A1E' }}>{formatCurrency(results.totalAcquisitionCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#52504A' }}>LTV</span>
                  <span className="mono font-semibold" style={{ color: results.ltv > 80 ? '#C47D0E' : '#1F2A1E' }}>{formatPct(results.ltv, 0)}</span>
                </div>
              </div>
            </>
          )}

          {/* BLOCK 3 */}
          {activeBlock === 3 && (
            <>
              <Field label="Tipo de aquisição" span2>
                <SegmentedControl
                  value={inp.acquisitionType}
                  onChange={(v) => upd('acquisitionType', v as AnalysisInput['acquisitionType'])}
                  options={[
                    { value: 'financiamento', label: 'Financiamento' },
                    { value: 'consorcio', label: 'Consórcio' },
                    { value: 'avista', label: 'À vista' },
                  ]}
                />
              </Field>

              {inp.acquisitionType === 'financiamento' && (
                <>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6E6B63' }}>Financiado (LTV)</label>
                      <span className="mono text-sm font-bold" style={{ color: '#B85B38' }}>
                        {formatPct(results.ltv, 0)} · {formatCurrency(inp.financedValue)}
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={90} step={1}
                      value={Math.round((inp.financedValue / Math.max(inp.propertyValue, 1)) * 100)}
                      onChange={(e) => upd('financedValue', Math.round(inp.propertyValue * Number(e.target.value) / 100))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #B85B38 0%, #B85B38 ${Math.round((inp.financedValue / Math.max(inp.propertyValue, 1)) * 100)}%, #D4CCBE ${Math.round((inp.financedValue / Math.max(inp.propertyValue, 1)) * 100)}%, #D4CCBE 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] mt-1" style={{ color: '#6E6B63' }}>
                      <span>0%</span>
                      <span style={{ color: results.ltv > 80 ? '#C47D0E' : '#6E6B63' }}>
                        {results.ltv > 80 ? '⚠ acima de 80%' : 'máx. recomendado: 80%'}
                      </span>
                      <span>90%</span>
                    </div>
                    <div className="mt-3">
                      <NumInput value={inp.financedValue} onChange={(v) => upd('financedValue', v)} prefix="R$" />
                    </div>
                  </div>
                  <Field label="Sistema de amortização" span2>
                    <SegmentedControl
                      value={inp.amortizationType}
                      onChange={(v) => upd('amortizationType', v as 'SAC' | 'PRICE')}
                      options={[{ value: 'SAC', label: 'SAC' }, { value: 'PRICE', label: 'PRICE' }]}
                    />
                  </Field>
                  <Field label="Juros anuais">
                    <NumInput value={inp.annualInterestRate} onChange={(v) => upd('annualInterestRate', v)} suffix="% a.a." />
                  </Field>
                  <Field label="Correção (IPCA)">
                    <NumInput value={inp.correctionRate} onChange={(v) => upd('correctionRate', v)} suffix="%" />
                  </Field>
                  <Field label="Seguro + admin">
                    <NumInput value={inp.insuranceAdminRate} onChange={(v) => upd('insuranceAdminRate', v)} suffix="%" />
                  </Field>
                  <Field label="Prazo">
                    <NumInput value={inp.financingTermMonths} onChange={(v) => upd('financingTermMonths', v)} suffix="meses" />
                  </Field>
                  {results.financingSchedule.length > 0 && (
                    <div className="col-span-2 rounded-lg p-4 text-xs space-y-2" style={{ background: '#F1ECE3', border: '1px solid #D4CCBE' }}>
                      <div className="flex justify-between">
                        <span style={{ color: '#52504A' }}>1ª parcela ({inp.amortizationType})</span>
                        <span className="mono font-bold" style={{ color: '#C0392B' }}>{formatCurrency(results.financingSchedule[0].payment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#52504A' }}>Última parcela</span>
                        <span className="mono font-semibold" style={{ color: '#1F2A1E' }}>{formatCurrency(results.financingSchedule[results.financingSchedule.length - 1].payment)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {inp.acquisitionType === 'consorcio' && (
                <>
                  <Field label="Carta de crédito" span2>
                    <NumInput value={inp.creditLetterValue || 0} onChange={(v) => upd('creditLetterValue', v)} prefix="R$" />
                  </Field>
                  <Field label="Taxa de administração">
                    <NumInput value={inp.adminFeeRate || 0} onChange={(v) => upd('adminFeeRate', v)} suffix="%" />
                  </Field>
                  <Field label="Fundo de reserva">
                    <NumInput value={inp.reserveFundRate || 0} onChange={(v) => upd('reserveFundRate', v)} suffix="%" />
                  </Field>
                  <Field label="Prazo (meses)">
                    <NumInput value={inp.consortiumTermMonths || 0} onChange={(v) => upd('consortiumTermMonths', v)} suffix="meses" />
                  </Field>
                  <Field label="Lance ofertado">
                    <NumInput value={inp.bid || 0} onChange={(v) => upd('bid', v)} prefix="R$" />
                  </Field>
                </>
              )}

              {inp.acquisitionType === 'avista' && (
                <div className="col-span-2 rounded-lg p-4 text-sm" style={{ background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.3)' }}>
                  <span style={{ color: '#4A7C59' }}>✓ Aquisição à vista — sem custos de financiamento.</span>
                </div>
              )}
            </>
          )}

          {/* BLOCK 4 */}
          {activeBlock === 4 && (
            <>
              <Field label="Modelo de locação" span2>
                <SegmentedControl
                  value={inp.rentalType}
                  onChange={(v) => upd('rentalType', v as AnalysisInput['rentalType'])}
                  options={[
                    { value: 'tradicional', label: 'Tradicional' },
                    { value: 'airbnb', label: 'Airbnb / Short Stay' },
                    { value: 'misto', label: 'Misto' },
                  ]}
                />
              </Field>

              {(inp.rentalType === 'tradicional' || inp.rentalType === 'misto') && (
                <>
                  <div className="col-span-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#B85B38' }}>
                    Locação Tradicional
                  </div>
                  <Field label="Aluguel bruto mensal" span2>
                    <NumInput value={inp.monthlyRent} onChange={(v) => upd('monthlyRent', v)} prefix="R$" />
                  </Field>
                  <Field label="Contrato médio">
                    <NumInput value={inp.avgContractMonths} onChange={(v) => upd('avgContractMonths', v)} suffix="meses" />
                  </Field>
                  <Field label="Vacância">
                    <NumInput value={inp.vacancyMonths} onChange={(v) => upd('vacancyMonths', v)} suffix="meses" />
                  </Field>
                  <Field label="Manutenção anual">
                    <NumInput value={inp.maintenancePct} onChange={(v) => upd('maintenancePct', v)} suffix="%" />
                  </Field>
                  <Field label="Taxa de administração">
                    <NumInput value={inp.adminPct} onChange={(v) => upd('adminPct', v)} suffix="%" />
                  </Field>
                  <div className="col-span-2 space-y-2">
                    <Toggle value={inp.tenantPaysCondo} onChange={(v) => upd('tenantPaysCondo', v)} label="Inquilino paga condomínio" />
                    <Toggle value={inp.tenantPaysIPTU} onChange={(v) => upd('tenantPaysIPTU', v)} label="Inquilino paga IPTU" />
                  </div>
                </>
              )}

              {(inp.rentalType === 'airbnb' || inp.rentalType === 'misto') && (
                <>
                  <div className="col-span-2 text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: '#2563EB' }}>
                    Airbnb / Short Stay — DRE Operacional
                  </div>
                  <Field label="Diária média">
                    <NumInput value={inp.avgDailyRate} onChange={(v) => upd('avgDailyRate', v)} prefix="R$" />
                  </Field>
                  <Field label="Taxa de limpeza cobrada">
                    <NumInput value={inp.cleaningFee} onChange={(v) => upd('cleaningFee', v)} prefix="R$" />
                  </Field>
                  <Field label="Ocupação média">
                    <NumInput value={inp.occupancyRate} onChange={(v) => upd('occupancyRate', v)} suffix="%" />
                  </Field>
                  <Field label="Reservas/mês">
                    <NumInput value={inp.avgBookingsPerMonth} onChange={(v) => upd('avgBookingsPerMonth', v)} />
                  </Field>
                  <Field label="Taxa plataforma">
                    <NumInput value={inp.platformPct} onChange={(v) => upd('platformPct', v)} suffix="%" />
                  </Field>
                  <Field label="Taxa de gestão">
                    <NumInput value={inp.adminPct} onChange={(v) => upd('adminPct', v)} suffix="%" />
                  </Field>
                  <Field label="Limpeza/estadia">
                    <NumInput value={inp.cleaningCostPerStay} onChange={(v) => upd('cleaningCostPerStay', v)} prefix="R$" />
                  </Field>
                  <Field label="Seguro">
                    <NumInput value={inp.insurancePct} onChange={(v) => upd('insurancePct', v)} suffix="%" />
                  </Field>
                  <Field label="Manutenção anual">
                    <NumInput value={inp.airbnbMaintenancePct} onChange={(v) => upd('airbnbMaintenancePct', v)} suffix="%" />
                  </Field>
                </>
              )}
            </>
          )}

          {/* BLOCK 5 */}
          {activeBlock === 5 && (
            <>
              <div className="col-span-1 flex items-end pb-1">
                <Toggle value={inp.purchasedBelowMarket} onChange={(v) => upd('purchasedBelowMarket', v)} label="Comprado com desconto" />
              </div>
              {inp.purchasedBelowMarket && (
                <Field label="Desconto sobre mercado">
                  <NumInput value={inp.marketDiscount} onChange={(v) => upd('marketDiscount', v)} suffix="%" />
                </Field>
              )}
              <Field label="Valor pós-reforma (VGV)" span2>
                <NumInput value={inp.valueAfterRenovation} onChange={(v) => upd('valueAfterRenovation', v)} prefix="R$" />
                {inp.propertyValue > 0 && inp.valueAfterRenovation > inp.propertyValue && (
                  <p className="text-xs mt-1" style={{ color: '#B85B38' }}>
                    Ganho imediato: {formatPct(((inp.valueAfterRenovation - inp.propertyValue) / inp.propertyValue) * 100)}
                  </p>
                )}
              </Field>
              <Field label="Valorização anual">
                <NumInput value={inp.annualAppreciation} onChange={(v) => upd('annualAppreciation', v)} suffix="% a.a." />
              </Field>
              <Field label="Crescimento aluguel">
                <NumInput value={inp.annualRentGrowth} onChange={(v) => upd('annualRentGrowth', v)} suffix="% a.a." />
              </Field>
              <Field label="Horizonte de análise">
                <NumInput value={inp.analysisYears} onChange={(v) => upd('analysisYears', Math.max(1, Math.min(30, v)))} suffix="anos" />
              </Field>
              <Field label="Comissão de venda">
                <NumInput value={inp.capitalGainsTaxRate} onChange={(v) => upd('capitalGainsTaxRate', v)} suffix="%" />
              </Field>
            </>
          )}

          {/* BLOCK 6 */}
          {activeBlock === 6 && (
            <>
              <Field label="Tipo de investidor" span2>
                <SegmentedControl
                  value={inp.investorType}
                  onChange={(v) => upd('investorType', v as 'PF' | 'PJ')}
                  options={[{ value: 'PF', label: 'PF' }, { value: 'PJ', label: 'PJ' }]}
                />
              </Field>
              <Field label="Tributação aluguel" hint="PF: até 27,5% · PJ: 15–25%">
                <NumInput value={inp.rentalTaxRate} onChange={(v) => upd('rentalTaxRate', v)} suffix="%" />
              </Field>
              <Field label="Ganho de capital" hint="PF: 15–22,5%">
                <NumInput value={inp.capitalGainsTaxRate} onChange={(v) => upd('capitalGainsTaxRate', v)} suffix="%" />
              </Field>
              <Field label="TIR mínima (TMA)">
                <NumInput value={inp.targetYield} onChange={(v) => upd('targetYield', v)} suffix="% a.a." />
              </Field>
              <Field label="Custo de oportunidade" hint="CDI / Selic">
                <NumInput value={inp.opportunityCostRate} onChange={(v) => upd('opportunityCostRate', v)} suffix="% a.a." />
              </Field>
              <Field label="Destinação do caixa" span2>
                <SegmentedControl
                  value={inp.cashDestination}
                  onChange={(v) => upd('cashDestination', v as 'reinvestir' | 'amortizar')}
                  options={[{ value: 'reinvestir', label: 'Reinvestir' }, { value: 'amortizar', label: 'Amortizar' }]}
                />
              </Field>
              {inp.cashDestination === 'reinvestir' && (
                <Field label="Taxa de reinvestimento">
                  <NumInput value={inp.reinvestRate} onChange={(v) => upd('reinvestRate', v)} suffix="% a.m." />
                </Field>
              )}
              <div className="col-span-2 rounded-lg p-3 text-xs" style={{ background: '#F1ECE3', border: '1px solid #D4CCBE' }}>
                <p style={{ color: '#52504A' }}>
                  ⚠️ Análise educacional — simulações não constituem recomendação financeira.
                </p>
              </div>
            </>
          )}

        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* ── TOP INPUT PANEL ── */}
      <div className="shrink-0" style={{ background: '#FFFFFF', borderBottom: '1px solid #E6E1D7' }}>
        {/* Panel header */}
        <div className="flex items-center gap-2 px-4 md:px-6 py-3">
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0"
            style={{ background: '#F1ECE3', color: '#52504A' }}
            title={panelOpen ? 'Recolher painel' : 'Expandir painel'}
          >
            <svg
              className="w-3.5 h-3.5 transition-transform"
              style={{ transform: panelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
            <input
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
              className="text-sm font-bold bg-transparent outline-none min-w-0 shrink"
              style={{ color: '#1F2A1E', maxWidth: '180px' }}
              placeholder="Nome da análise"
            />
            {!panelOpen && summaryChips}
          </div>

          {/* Export group */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: '#F1ECE3', color: '#52504A', border: '1px solid #D4CCBE' }}
              title="Exportar PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              PDF
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#B85B38', color: '#fff' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Salvar
            </button>
          </div>
        </div>

        {/* Property selector bar */}
        <div
          className="flex items-center gap-2 px-4 md:px-6 py-1.5 overflow-x-auto"
          style={{ borderTop: '1px solid #F1ECE3', background: '#FDFCFA' }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#6E6B63' }}>Imóvel</span>
          <button
            onClick={() => onSelectProperty(null)}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
            style={{
              background: !selectedProperty ? '#1F2A1E' : '#F1ECE3',
              color: !selectedProperty ? '#F8F6F1' : '#52504A',
              border: '1px solid transparent',
            }}
          >
            Standalone
          </button>
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProperty(p.id)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap"
              style={{
                background: selectedProperty?.id === p.id ? '#B85B38' : '#F1ECE3',
                color: selectedProperty?.id === p.id ? '#fff' : '#52504A',
                border: '1px solid transparent',
              }}
            >
              {p.name}
            </button>
          ))}
          {selectedProperty && (
            <span className="text-[10px] shrink-0 ml-1" style={{ color: '#6E6B63' }}>
              · pré-preenchido com dados do imóvel
            </span>
          )}
        </div>

        {/* Block tabs — always visible */}
        <div className="overflow-x-auto" style={{ borderTop: '1px solid #F1ECE3' }}>
          <div className="flex items-center gap-1 px-3 py-1.5 min-w-max">
            {blocks.map((b) => {
              const active = activeBlock === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => { setActiveBlock(b.id as Block); if (!panelOpen) setPanelOpen(true) }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? 'rgba(184,91,56,0.1)' : 'transparent',
                    color: active ? '#B85B38' : '#52504A',
                    border: active ? '1px solid rgba(184,91,56,0.3)' : '1px solid transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              )
            })}
            <div className="ml-2 shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: '#F1ECE3', color: '#52504A' }}>
              <span className="mono">{activeBlock}</span>
              <span style={{ color: '#D4CCBE' }}>/</span>
              <span className="mono">{blocks.length}</span>
            </div>
          </div>
        </div>

        {/* Block content — collapses */}
        {blockContent}
      </div>

      {/* ── FULL-WIDTH RESULTS PANEL ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#F8F6F1' }}>
        <ResultsPanel results={results} inp={inp} />
      </div>
    </div>
  )
}
