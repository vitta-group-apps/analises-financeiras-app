import React, { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '../lib/calculations'

// ─── Colors ────────────────────────────────────────────────────────────────
const accent  = '#B85B38'
const danger  = '#C0392B'
const info    = '#2563EB'
const success = '#4A7C59'
const headingColor = '#1F2A1E'
const mutedColor   = '#52504A'
const labelsColor  = '#7A776F'
const cardBorder   = '#E2DCD2'
const panelBg      = '#F1ECE3'

// ─── Calculation functions (preserved) ─────────────────────────────────────
type System = 'SAC' | 'PRICE'
type AcquisitionType = 'financiamento' | 'consorcio'
type DownPaymentMode = 'R$' | '%'

interface Installment {
  month: number
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
}

function calcSAC(
  principal: number,
  annualRate: number,
  correctionRate: number,
  insuranceRate: number,
  months: number,
): Installment[] {
  const r = Math.pow(1 + (annualRate + correctionRate) / 100, 1 / 12) - 1
  const ins = insuranceRate / 100 / 12
  const amort = principal / months
  let balance = principal
  return Array.from({ length: months }, (_, i) => {
    const interest = balance * r
    const insurance = balance * ins
    const payment = amort + interest + insurance
    balance = Math.max(balance - amort, 0)
    return { month: i + 1, year: Math.ceil((i + 1) / 12), payment, principal: amort, interest, balance }
  })
}

function calcPRICE(
  principal: number,
  annualRate: number,
  correctionRate: number,
  insuranceRate: number,
  months: number,
): Installment[] {
  const r = Math.pow(1 + (annualRate + correctionRate) / 100, 1 / 12) - 1
  const ins = insuranceRate / 100 / 12
  const pmt = r > 0 ? (principal * r) / (1 - Math.pow(1 + r, -months)) : principal / months
  let balance = principal
  return Array.from({ length: months }, (_, i) => {
    const interest = balance * r
    const principalPmt = pmt - interest
    const insurance = balance * ins
    balance = Math.max(balance - principalPmt, 0)
    return { month: i + 1, year: Math.ceil((i + 1) / 12), payment: pmt + insurance, principal: principalPmt, interest, balance }
  })
}

function calcConsorcio(carta: number, adminRate: number, reserveRate: number, months: number, bid: number) {
  const monthlyAdmin = carta * (adminRate / 100) / months
  const monthlyReserve = carta * (reserveRate / 100) / months
  const totalMonthly = monthlyAdmin + monthlyReserve + carta / months
  const totalPaid = totalMonthly * months
  const totalCost = totalPaid + bid
  const effectiveCost = ((totalCost / carta) - 1) * 100
  return { totalMonthly, totalPaid, totalCost, effectiveCost, bid }
}

// ─── BRL Text Input ─────────────────────────────────────────────────────────
function BRLInput({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  placeholder?: string
  suffix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  const displayValue = focused
    ? raw
    : value > 0
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''

  function handleFocus() {
    setRaw(value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
    setFocused(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setRaw(v)
    // Strip everything except digits and comma/period
    const stripped = v.replace(/[^\d,.]/g, '').replace(',', '.')
    const parsed = parseFloat(stripped)
    onChange(isNaN(parsed) ? 0 : parsed)
  }

  function handleBlur() {
    setFocused(false)
    setRaw('')
  }

  return (
    <div>
      <label
        className="text-xs font-medium uppercase tracking-wider block mb-1.5"
        style={{ color: labelsColor }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {!suffix && (
          <span className="absolute left-3 text-xs select-none" style={{ color: mutedColor }}>R$</span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder={placeholder ?? '0,00'}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full py-2.5 rounded-xl text-sm font-medium outline-none transition"
          style={{
            background: '#F8F6F1',
            border: `1px solid #D4CCBE`,
            color: headingColor,
            paddingLeft: suffix ? '0.75rem' : '2.5rem',
            paddingRight: suffix ? '3.5rem' : '0.75rem',
            boxShadow: focused ? '0 0 0 3px rgba(184,91,56,0.15)' : 'none',
          }}
        />
        {suffix && (
          <span className="absolute right-3 text-xs select-none" style={{ color: mutedColor }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

function PercentInput({
  label,
  value,
  onChange,
  placeholder,
  suffix = '% a.a.',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  placeholder?: string
  suffix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  const displayValue = focused
    ? raw
    : value > 0
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''

  function handleFocus() {
    setRaw(value > 0 ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
    setFocused(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setRaw(v)
    const stripped = v.replace(/[^\d,.]/g, '').replace(',', '.')
    const parsed = parseFloat(stripped)
    onChange(isNaN(parsed) ? 0 : parsed)
  }

  function handleBlur() {
    setFocused(false)
    setRaw('')
  }

  return (
    <div>
      <label
        className="text-xs font-medium uppercase tracking-wider block mb-1.5"
        style={{ color: labelsColor }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder={placeholder ?? '0,00'}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full py-2.5 px-3 rounded-xl text-sm font-medium outline-none transition"
          style={{
            background: '#F8F6F1',
            border: `1px solid #D4CCBE`,
            color: headingColor,
            paddingRight: '3.5rem',
            boxShadow: focused ? '0 0 0 3px rgba(184,91,56,0.15)' : 'none',
          }}
        />
        <span className="absolute right-3 text-xs select-none" style={{ color: mutedColor }}>{suffix}</span>
      </div>
    </div>
  )
}

function MonthsInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  const displayValue = focused ? raw : value > 0 ? String(value) : ''

  function handleFocus() {
    setRaw(value > 0 ? String(value) : '')
    setFocused(true)
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '')
    setRaw(v)
    onChange(parseInt(v) || 0)
  }
  function handleBlur() {
    setFocused(false)
    setRaw('')
  }

  return (
    <div>
      <label
        className="text-xs font-medium uppercase tracking-wider block mb-1.5"
        style={{ color: labelsColor }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder="360"
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full py-2.5 px-3 rounded-xl text-sm font-medium outline-none transition"
          style={{
            background: '#F8F6F1',
            border: `1px solid #D4CCBE`,
            color: headingColor,
            paddingRight: '4rem',
            boxShadow: focused ? '0 0 0 3px rgba(184,91,56,0.15)' : 'none',
          }}
        />
        <span className="absolute right-3 text-xs select-none" style={{ color: mutedColor }}>meses</span>
      </div>
    </div>
  )
}

// ─── Segmented toggle ───────────────────────────────────────────────────────
function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  labels: optLabels,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labels?: Record<T, string>
}) {
  return (
    <div
      className="flex gap-0.5 p-0.5 rounded-xl"
      style={{ background: '#F1ECE3', border: `1px solid ${cardBorder}` }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: value === opt ? accent : 'transparent',
            color: value === opt ? '#FFFFFF' : mutedColor,
          }}
        >
          {optLabels ? optLabels[opt] : opt}
        </button>
      ))}
    </div>
  )
}

// ─── Small stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#F8F6F1', border: `1px solid ${cardBorder}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>{label}</div>
      <div className="font-bold text-base tabular-nums" style={{ color: color ?? headingColor }}>{value}</div>
    </div>
  )
}

// ─── Summary row ────────────────────────────────────────────────────────────
function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex justify-between items-center py-2.5"
      style={{ borderBottom: `1px solid ${cardBorder}` }}
    >
      <span className="text-sm" style={{ color: mutedColor }}>{label}</span>
      <span className="tabular-nums font-semibold text-sm" style={{ color: highlight ? accent : headingColor }}>{value}</span>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function FinancingCalculator() {
  // Section 1 — Estrutura de Compra
  const [propertyValue, setPropertyValue] = useState(500000)
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentMode>('R$')
  const [downPaymentR, setDownPaymentR] = useState(100000)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [itbiMode, setItbiMode] = useState<DownPaymentMode>('%')
  const [itbiR, setItbiR] = useState(0)
  const [itbiPct, setItbiPct] = useState(4)
  const [reformValue, setReformValue] = useState(0)

  // Section 2 — Parâmetros
  const [acqType, setAcqType] = useState<AcquisitionType>('financiamento')
  const [system, setSystem] = useState<System>('SAC')
  const [annualRate, setAnnualRate] = useState(10.5)
  const [correctionRate, setCorrectionRate] = useState(3.5)
  const [insuranceRate, setInsuranceRate] = useState(0.5)
  const [months, setMonths] = useState(360)

  // Consórcio
  const [adminRate, setAdminRate] = useState(20)
  const [reserveRate, setReserveRate] = useState(2)
  const [consortiumMonths, setConsortiumMonths] = useState(120)
  const [bid, setBid] = useState(0)

  // Results
  const [showTable, setShowTable] = useState(false)
  const [tableRows, setTableRows] = useState(24)
  const [extraPayment, setExtraPayment] = useState(0)

  // ── Derived values ────────────────────────────────────────────────────────

  // Resolved down payment in R$
  const resolvedDownPaymentR = useMemo(() => {
    if (downPaymentMode === 'R$') return downPaymentR
    return propertyValue * (downPaymentPct / 100)
  }, [downPaymentMode, downPaymentR, downPaymentPct, propertyValue])

  // LTV
  const ltv = useMemo(() => {
    if (propertyValue <= 0) return 0
    return ((propertyValue - resolvedDownPaymentR) / propertyValue) * 100
  }, [propertyValue, resolvedDownPaymentR])

  // ITBI in R$
  const resolvedItbiR = useMemo(() => {
    if (itbiMode === 'R$') return itbiR
    return propertyValue * (itbiPct / 100)
  }, [itbiMode, itbiR, itbiPct, propertyValue])

  // Principal = property value - down payment
  const principal = useMemo(
    () => Math.max(0, propertyValue - resolvedDownPaymentR),
    [propertyValue, resolvedDownPaymentR],
  )

  // Capital próprio total
  const capitalProprio = useMemo(
    () => resolvedDownPaymentR + resolvedItbiR + reformValue,
    [resolvedDownPaymentR, resolvedItbiR, reformValue],
  )

  // ── Schedules ─────────────────────────────────────────────────────────────
  const schedule = useMemo(() => {
    if (acqType === 'consorcio' || principal <= 0 || months <= 0) return []
    return system === 'SAC'
      ? calcSAC(principal, annualRate, correctionRate, insuranceRate, months)
      : calcPRICE(principal, annualRate, correctionRate, insuranceRate, months)
  }, [acqType, system, principal, annualRate, correctionRate, insuranceRate, months])

  const consorcio = useMemo(() => {
    if (acqType !== 'consorcio') return null
    return calcConsorcio(principal, adminRate, reserveRate, consortiumMonths, bid)
  }, [acqType, principal, adminRate, reserveRate, consortiumMonths, bid])

  const yearlyData = useMemo(() => {
    const byYear: Record<number, { year: number; principal: number; interest: number; balance: number }> = {}
    schedule.forEach((s) => {
      if (!byYear[s.year]) byYear[s.year] = { year: s.year, principal: 0, interest: 0, balance: 0 }
      byYear[s.year].principal += s.principal
      byYear[s.year].interest += s.interest
      byYear[s.year].balance = s.balance
    })
    return Object.values(byYear)
  }, [schedule])

  const totalPaid = schedule.reduce((s, i) => s + i.payment, 0)
  const totalInterest = schedule.reduce((s, i) => s + i.interest, 0)
  const firstPayment = schedule[0]?.payment ?? 0
  const lastPayment = schedule[schedule.length - 1]?.payment ?? 0

  const sacSchedule = useMemo(
    () => (principal > 0 && months > 0 ? calcSAC(principal, annualRate, correctionRate, insuranceRate, months) : []),
    [principal, annualRate, correctionRate, insuranceRate, months],
  )
  const priceSchedule = useMemo(
    () => (principal > 0 && months > 0 ? calcPRICE(principal, annualRate, correctionRate, insuranceRate, months) : []),
    [principal, annualRate, correctionRate, insuranceRate, months],
  )
  const sacTotal = sacSchedule.reduce((s, i) => s + i.payment, 0)
  const priceTotal = priceSchedule.reduce((s, i) => s + i.payment, 0)

  const compData = yearlyData.map((d) => ({
    year: d.year,
    SAC: sacSchedule.filter((s) => s.year === d.year).reduce((a, s) => a + s.payment, 0),
    PRICE: priceSchedule.filter((s) => s.year === d.year).reduce((a, s) => a + s.payment, 0),
  }))

  const extraPaymentResult = useMemo(() => {
    if (extraPayment <= 0 || months <= 0 || principal <= 0) return null
    const amortPerMonth = principal / months
    const monthsSaved = Math.floor(extraPayment / amortPerMonth)
    const newMonths = Math.max(1, months - monthsSaved)
    const newSchedule = system === 'SAC'
      ? calcSAC(principal, annualRate, correctionRate, insuranceRate, newMonths)
      : calcPRICE(principal, annualRate, correctionRate, insuranceRate, newMonths)
    const newTotal = newSchedule.reduce((s, i) => s + i.payment, 0)
    const interestSaved = Math.max(0, totalPaid - newTotal - extraPayment)
    return { monthsSaved, newMonths, interestSaved }
  }, [extraPayment, months, principal, system, annualRate, correctionRate, insuranceRate, totalPaid])

  const tooltipStyle = { background: '#FFFFFF', border: `1px solid ${cardBorder}`, color: headingColor }

  const cardCls = 'rounded-2xl p-5'
  const cardSty: React.CSSProperties = {
    background: '#FFFFFF',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 1px 4px rgba(31,42,30,0.05)',
  }

  return (
    <div className="min-h-full p-6 lg:p-8" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: labelsColor }}>Ferramentas</p>
        <h1 className="text-3xl font-bold" style={{ color: headingColor }}>Calculadora de Financiamento</h1>
        <p className="text-sm mt-1" style={{ color: mutedColor }}>
          Simule parcelas SAC ou PRICE, compare sistemas e visualize o custo total do crédito imobiliário.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: inputs ───────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Section 1 — Estrutura de Compra */}
          <div className={cardCls} style={cardSty}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: labelsColor }}>
              Estrutura de Compra
            </p>

            {/* 1. Valor do Imóvel */}
            <div className="mb-4">
              <BRLInput
                label="Valor do Imóvel"
                value={propertyValue}
                onChange={setPropertyValue}
              />
            </div>

            {/* 2. Entrada */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: labelsColor }}>
                Entrada
              </label>
              <div className="mb-2">
                <SegmentedToggle<DownPaymentMode>
                  options={['R$', '%'] as const}
                  value={downPaymentMode}
                  onChange={setDownPaymentMode}
                  labels={{ 'R$': 'R$ valor', '%': '% do imóvel' }}
                />
              </div>
              {downPaymentMode === 'R$' ? (
                <BRLInput label="" value={downPaymentR} onChange={setDownPaymentR} />
              ) : (
                <PercentInput label="" value={downPaymentPct} onChange={setDownPaymentPct} suffix="%" />
              )}
              {/* LTV display */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs" style={{ color: mutedColor }}>
                  LTV:{' '}
                  <span className="font-semibold tabular-nums" style={{ color: ltv > 80 ? danger : headingColor }}>
                    {ltv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </span>
                </span>
                {ltv > 80 && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#FEE2E2', color: danger }}
                  >
                    LTV acima de 80%
                  </span>
                )}
              </div>
            </div>

            {/* 3. Custos de Aquisição (ITBI + Cartório) */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: labelsColor }}>
                Custos de Aquisição (ITBI + Cartório)
              </label>
              <div className="mb-2">
                <SegmentedToggle<DownPaymentMode>
                  options={['R$', '%'] as const}
                  value={itbiMode}
                  onChange={setItbiMode}
                  labels={{ 'R$': 'R$ valor', '%': '% do imóvel' }}
                />
              </div>
              {itbiMode === 'R$' ? (
                <BRLInput label="" value={itbiR} onChange={setItbiR} />
              ) : (
                <PercentInput label="" value={itbiPct} onChange={setItbiPct} suffix="%" placeholder="4,00" />
              )}
              {itbiMode === '%' && (
                <p className="mt-1.5 text-xs tabular-nums" style={{ color: mutedColor }}>
                  = {formatCurrency(resolvedItbiR)}
                </p>
              )}
            </div>

            {/* 4. Reforma / Obra Inicial */}
            <div className="mb-4">
              <BRLInput
                label="Reforma / Obra Inicial"
                value={reformValue}
                onChange={setReformValue}
                placeholder="0,00"
              />
            </div>

            {/* Summary highlight box */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: '#FDF8F3', border: `1.5px solid ${accent}33` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold" style={{ color: accent }}>Saldo Devedor (Principal)</span>
                <span className="font-bold tabular-nums text-sm" style={{ color: accent }}>
                  {formatCurrency(principal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: mutedColor }}>Capital Próprio Total</span>
                <span className="font-semibold tabular-nums text-sm" style={{ color: headingColor }}>
                  {formatCurrency(capitalProprio)}
                </span>
              </div>
              <div
                className="pt-1.5 mt-1 text-[10px] space-y-0.5"
                style={{ borderTop: `1px solid ${cardBorder}`, color: labelsColor }}
              >
                <div className="flex justify-between">
                  <span>Entrada</span>
                  <span className="tabular-nums">{formatCurrency(resolvedDownPaymentR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ITBI + Cartório</span>
                  <span className="tabular-nums">{formatCurrency(resolvedItbiR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reforma</span>
                  <span className="tabular-nums">{formatCurrency(reformValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — Parâmetros do Financiamento */}
          <div className={cardCls} style={cardSty}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: labelsColor }}>
              Parâmetros do Financiamento
            </p>

            {/* Type toggle */}
            <div className="mb-4">
              <SegmentedToggle<AcquisitionType>
                options={['financiamento', 'consorcio'] as const}
                value={acqType}
                onChange={setAcqType}
                labels={{ financiamento: 'Financiamento', consorcio: 'Consórcio' }}
              />
            </div>

            {acqType === 'financiamento' ? (
              <div className="space-y-4">
                {/* SAC/PRICE */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: labelsColor }}>
                    Sistema de amortização
                  </p>
                  <SegmentedToggle<System>
                    options={['SAC', 'PRICE'] as const}
                    value={system}
                    onChange={setSystem}
                  />
                </div>

                <PercentInput label="Taxa de Juros Anual" value={annualRate} onChange={setAnnualRate} suffix="% a.a." />
                <PercentInput label="Correção TR/IPCA" value={correctionRate} onChange={setCorrectionRate} suffix="%" />
                <PercentInput label="Seguro + Admin" value={insuranceRate} onChange={setInsuranceRate} suffix="% a.a." />

                <div>
                  <MonthsInput label="Prazo" value={months} onChange={(v) => setMonths(Math.max(12, Math.min(420, v)))} />
                  <p className="text-xs mt-1.5" style={{ color: mutedColor }}>
                    {Math.round(months / 12)} anos &middot; taxa efetiva {(annualRate + correctionRate + insuranceRate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% a.a.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PercentInput label="Taxa de Administração" value={adminRate} onChange={setAdminRate} suffix="%" />
                <PercentInput label="Fundo de Reserva" value={reserveRate} onChange={setReserveRate} suffix="%" />
                <MonthsInput label="Prazo" value={consortiumMonths} onChange={setConsortiumMonths} />
                <BRLInput label="Lance" value={bid} onChange={setBid} placeholder="0,00" />
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: results ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {acqType === 'financiamento' ? (
            <>
              {/* Summary stats */}
              <div className={cardCls} style={cardSty}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: labelsColor }}>
                  Resumo — {system}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                  <StatCard label="1ª Parcela" value={formatCurrency(firstPayment)} color={danger} />
                  <StatCard
                    label={system === 'SAC' ? 'Última Parcela' : 'Parcela Fixa'}
                    value={formatCurrency(lastPayment)}
                  />
                  <StatCard label="Total Pago" value={formatCurrency(totalPaid)} />
                  <StatCard label="Juros Totais" value={formatCurrency(totalInterest)} color={danger} />
                  <StatCard label="Capital Próprio Total" value={formatCurrency(capitalProprio)} color={success} />
                </div>
                <SummaryRow label="Principal (Saldo Devedor)" value={formatCurrency(principal)} />
                <SummaryRow label="Total de Juros" value={formatCurrency(totalInterest)} />
                <SummaryRow label="Total Pago" value={formatCurrency(totalPaid)} highlight />
                <SummaryRow
                  label="Custo efetivo relativo"
                  value={
                    principal > 0
                      ? `${(((totalPaid / principal) - 1) * 100).toFixed(1)}% sobre o principal`
                      : '—'
                  }
                />
              </div>

              {/* Annual bar chart */}
              <div className={cardCls} style={cardSty}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: labelsColor }}>
                  Composição anual da parcela
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={yearlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
                    <XAxis dataKey="year" tick={{ fill: labelsColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: labelsColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: mutedColor }} />
                    <Bar dataKey="principal" name="Amortização" stackId="a" fill={success} />
                    <Bar dataKey="interest" name="Juros" stackId="a" fill={danger} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* SAC vs PRICE comparison */}
              <div className={cardCls} style={cardSty}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: labelsColor }}>
                  Comparativo SAC vs PRICE
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-xl p-3" style={{ background: panelBg, border: `1px solid ${cardBorder}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>SAC — Total pago</div>
                    <div className="font-bold text-lg tabular-nums" style={{ color: success }}>{formatCurrency(sacTotal)}</div>
                    <div className="text-xs mt-1" style={{ color: mutedColor }}>1ª: {formatCurrency(sacSchedule[0]?.payment ?? 0)}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: panelBg, border: `1px solid ${cardBorder}` }}>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>PRICE — Total pago</div>
                    <div className="font-bold text-lg tabular-nums" style={{ color: info }}>{formatCurrency(priceTotal)}</div>
                    <div className="text-xs mt-1" style={{ color: mutedColor }}>Parcela fixa: {formatCurrency(priceSchedule[0]?.payment ?? 0)}</div>
                  </div>
                </div>
                <div
                  className="rounded-xl p-3 text-xs mb-4"
                  style={{ background: panelBg, border: `1px solid ${cardBorder}`, color: mutedColor }}
                >
                  <span style={{ color: success }}>SAC economiza {formatCurrency(Math.abs(priceTotal - sacTotal))}</span>{' '}
                  em relação ao PRICE, mas com parcelas iniciais maiores.
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={compData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
                    <XAxis dataKey="year" tick={{ fill: labelsColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: labelsColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: mutedColor }} />
                    <Area type="monotone" dataKey="SAC" stroke={success} fill="rgba(74,124,89,0.1)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="PRICE" stroke={info} fill="rgba(37,99,235,0.1)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Extraordinary amortization */}
              <div className={`${cardCls} space-y-4`} style={cardSty}>
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: headingColor }}>Amortização Extraordinária</h2>
                  <p className="text-sm" style={{ color: mutedColor }}>
                    Simule o efeito de um pagamento extra sobre o prazo e o custo total do financiamento.
                  </p>
                </div>
                <BRLInput label="Valor do pagamento extra" value={extraPayment} onChange={setExtraPayment} placeholder="0,00" />
                {extraPaymentResult && extraPaymentResult.monthsSaved > 0 ? (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ background: panelBg, border: `1px solid ${cardBorder}` }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>Meses antecipados</div>
                        <div className="font-bold text-xl tabular-nums" style={{ color: accent }}>{extraPaymentResult.monthsSaved} meses</div>
                        <div className="text-xs mt-0.5" style={{ color: mutedColor }}>
                          De {months} para {extraPaymentResult.newMonths} meses
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>Juros economizados</div>
                        <div className="font-bold text-xl tabular-nums" style={{ color: success }}>
                          {formatCurrency(extraPaymentResult.interestSaved)}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: mutedColor }}>economia estimada</div>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: mutedColor }}>
                      Estimativa aproximada. O valor real depende do momento do pagamento e da tabela vigente.
                    </p>
                  </div>
                ) : extraPayment > 0 ? (
                  <div
                    className="rounded-xl p-3 text-xs"
                    style={{ background: panelBg, border: `1px solid ${cardBorder}`, color: mutedColor }}
                  >
                    O pagamento extra informado não é suficiente para antecipar parcelas com as premissas atuais.
                  </div>
                ) : null}
              </div>

              {/* Amortization table */}
              <div className="rounded-2xl overflow-hidden" style={cardSty}>
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: `1px solid ${cardBorder}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: labelsColor }}>
                    Tabela de amortização
                  </p>
                  <button
                    onClick={() => setShowTable(!showTable)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: panelBg, color: accent, border: `1px solid ${cardBorder}` }}
                  >
                    {showTable ? 'Ocultar' : 'Mostrar'} tabela
                  </button>
                </div>
                {showTable && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${cardBorder}`, background: '#F8F6F1' }}>
                            {['Mês', 'Parcela', 'Amortização', 'Juros', 'Saldo'].map((h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left font-medium uppercase tracking-wider"
                                style={{ color: labelsColor }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.slice(0, tableRows).map((row, i) => (
                            <tr
                              key={row.month}
                              style={{ borderBottom: i < tableRows - 1 ? `1px solid ${cardBorder}` : 'none' }}
                            >
                              <td className="px-4 py-2.5 tabular-nums" style={{ color: mutedColor }}>{row.month}</td>
                              <td className="px-4 py-2.5 tabular-nums font-semibold" style={{ color: headingColor }}>{formatCurrency(row.payment)}</td>
                              <td className="px-4 py-2.5 tabular-nums" style={{ color: success }}>{formatCurrency(row.principal)}</td>
                              <td className="px-4 py-2.5 tabular-nums" style={{ color: danger }}>{formatCurrency(row.interest)}</td>
                              <td className="px-4 py-2.5 tabular-nums" style={{ color: headingColor }}>{formatCurrency(row.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {tableRows < schedule.length && (
                      <div className="px-5 py-3 text-center" style={{ borderTop: `1px solid ${cardBorder}` }}>
                        <button
                          onClick={() => setTableRows((r) => Math.min(r + 36, schedule.length))}
                          className="text-xs px-4 py-2 rounded-lg font-medium"
                          style={{ background: panelBg, color: accent, border: `1px solid ${cardBorder}` }}
                        >
                          Carregar mais {Math.min(36, schedule.length - tableRows)} meses
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Consórcio results */
            consorcio && (
              <div className={`${cardCls} space-y-4`} style={cardSty}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: labelsColor }}>
                  Resultado do Consórcio
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: 'Parcela mensal', v: formatCurrency(consorcio.totalMonthly), c: accent },
                    { l: 'Lance', v: formatCurrency(consorcio.bid), c: headingColor },
                    { l: 'Total pago', v: formatCurrency(consorcio.totalPaid), c: headingColor },
                    {
                      l: 'Custo efetivo',
                      v: `${consorcio.effectiveCost.toFixed(1)}%`,
                      c: consorcio.effectiveCost < 25 ? success : danger,
                    },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="rounded-xl p-4" style={{ background: panelBg, border: `1px solid ${cardBorder}` }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: labelsColor }}>{l}</div>
                      <div className="font-bold text-xl tabular-nums" style={{ color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4 text-xs" style={{ background: '#EEF2FF', border: '1px solid #BFDBFE' }}>
                  <p style={{ color: info }}>
                    No consórcio não há juros — apenas taxa de administração e fundo de reserva. O custo efetivo de{' '}
                    <span className="font-bold">{consorcio.effectiveCost.toFixed(1)}%</span> sobre a carta de crédito é
                    geralmente menor que um financiamento, mas exige aguardar a contemplação.
                  </p>
                </div>
                <SummaryRow label="Carta de crédito (Saldo Devedor)" value={formatCurrency(principal)} />
                <SummaryRow label="Taxa de admin total" value={formatCurrency(principal * adminRate / 100)} />
                <SummaryRow label="Fundo de reserva total" value={formatCurrency(principal * reserveRate / 100)} />
                <SummaryRow label="Lance ofertado" value={formatCurrency(bid)} />
                <SummaryRow label="Capital Próprio Total" value={formatCurrency(capitalProprio)} />
                <SummaryRow label="Total pago" value={formatCurrency(consorcio.totalPaid)} highlight />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
