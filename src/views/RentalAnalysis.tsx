import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { formatCurrency, formatPct } from '../lib/calculations'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  accent:   '#B85B38',
  success:  '#4A7C59',
  danger:   '#C0392B',
  info:     '#2563EB',
  heading:  '#1F2A1E',
  muted:    '#52504A',
  labels:   '#8A8880',
  border:   '#E2DCD2',
  inputBg:  '#F8F6F1',
  inputBdr: '#D4CCBE',
  cardBg:   '#FFFFFF',
  pageBg:   '#F5F2EC',
  panelBg:  '#F1ECE3',
  airBg:    '#EFF6FF',
}

const cardStyle: React.CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 4px rgba(31,42,30,0.06)',
}
const panelStyle: React.CSSProperties = {
  background: C.panelBg,
  border: `1px solid ${C.border}`,
}
const iStyle: React.CSSProperties = {
  background: C.inputBg,
  border: `1px solid ${C.inputBdr}`,
  color: C.heading,
}
const tooltipStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${C.border}`,
  color: C.heading,
  fontSize: 12,
}
const inputCls = 'w-full px-3 py-2 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#B85B38]/30 transition'

// ─── Primitive components ─────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.labels }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: C.muted }}>{hint}</p>}
    </div>
  )
}

function NumInput({ value, onChange, suffix, prefix, step = '1' }: {
  value: number; onChange: (v: number) => void;
  suffix?: string; prefix?: string; step?: string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-xs pointer-events-none" style={{ color: C.muted }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={inputCls}
        style={{ ...iStyle, paddingLeft: prefix ? '2.5rem' : undefined, paddingRight: suffix ? '3rem' : undefined }}
      />
      {suffix && <span className="absolute right-3 text-xs pointer-events-none" style={{ color: C.muted }}>{suffix}</span>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={iStyle}
    />
  )
}

function Toggle({ checked, onChange, labelOn, labelOff }: {
  checked: boolean; onChange: (v: boolean) => void; labelOn: string; labelOff: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
      style={{
        background: checked ? '#EAF3EC' : '#FEF2EE',
        border: `1px solid ${checked ? '#B8D4BF' : '#F0C4B5'}`,
        color: checked ? C.success : C.accent,
        fontWeight: 500,
      }}
    >
      <span
        className="w-7 h-4 rounded-full relative transition-all flex-shrink-0"
        style={{ background: checked ? C.success : '#D4CCBE' }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
          style={{ left: checked ? '14px' : '2px' }}
        />
      </span>
      {checked ? labelOn : labelOff}
    </button>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
      <div className="w-1 h-4 rounded-full" style={{ background: C.accent }} />
      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: C.heading }}>{title}</h4>
    </div>
  )
}

function DRERow({ label, value, color, bold, border: showBorder }: {
  label: string; value: string; color?: string; bold?: boolean; border?: boolean;
}) {
  return (
    <div
      className="flex justify-between items-center py-1.5 text-xs"
      style={showBorder ? { borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 8 } : undefined}
    >
      <span style={{ color: bold ? C.heading : C.muted, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span
        className="font-mono font-semibold tabular-nums"
        style={{ color: color ?? (bold ? C.heading : C.muted), fontWeight: bold ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  )
}

function ApplyRow({ label, value, note, color, onApply }: {
  label: string; value: string; note?: string; color?: string; onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs gap-3"
      style={{ background: C.panelBg, border: `1px solid ${C.border}` }}>
      <span className="font-medium" style={{ color: color ?? C.muted }}>{label}</span>
      <span className="font-mono font-semibold flex-1 text-right" style={{ color: C.heading }}>{value}</span>
      {note && <span style={{ color: C.labels }}>{note}</span>}
      <button
        onClick={onApply}
        className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors flex-shrink-0"
        style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.accent }}
      >
        Aplicar
      </button>
    </div>
  )
}

// ─── Calculation functions (preserved) ────────────────────────────────────────
function calcTraditional(params: {
  monthlyRent: number; vacancyMonths: number;
  maintenancePct: number; adminPct: number; taxRate: number;
  condo: number; iptu: number; tenantPaysCondo: boolean; tenantPaysIPTU: boolean;
}) {
  const { monthlyRent, vacancyMonths, maintenancePct, adminPct, taxRate, condo, iptu, tenantPaysCondo, tenantPaysIPTU } = params
  const occupiedMonths = 12 - vacancyMonths
  const occupancyRate = occupiedMonths / 12
  const effectiveRent = monthlyRent * occupancyRate
  const maintenance = (params.maintenancePct / 100 / 12) * monthlyRent * 12  // annual maint prorated monthly
  const maintenanceMonthly = maintenance / 12
  const admin = effectiveRent * (adminPct / 100)
  const condoExp = tenantPaysCondo ? 0 : condo
  const iptuExp = tenantPaysIPTU ? 0 : iptu
  const grossIncome = effectiveRent         // monthly effective
  const expenses = maintenanceMonthly + admin + condoExp + iptuExp
  const netBeforeTax = grossIncome - expenses
  const tax = Math.max(0, netBeforeTax) * (taxRate / 100)
  const net = netBeforeTax - tax
  return { grossIncome, expenses, tax, net, occupancyRate, occupiedMonths, maintenanceMonthly, admin, condoExp, iptuExp }
}

function calcAirbnb(params: {
  dailyRate: number; cleaningFee: number; occupancyPct: number;
  bookingsPerMonth: number; adminPct: number; platformPct: number;
  cleaningCostPerStay: number; maintenancePct: number; taxRate: number;
  electricity: number; gas: number; water: number; internet: number; condo: number; iptu: number;
}) {
  const { dailyRate, cleaningFee, occupancyPct, bookingsPerMonth, adminPct, platformPct,
    cleaningCostPerStay, maintenancePct, taxRate,
    electricity, gas, water, internet, condo, iptu } = params
  const daysOccupied = 30 * (occupancyPct / 100)
  const grossRevenue = dailyRate * daysOccupied + cleaningFee * bookingsPerMonth
  const platformFee = grossRevenue * (platformPct / 100)
  const adminFee = grossRevenue * (adminPct / 100)
  const cleaningTotal = cleaningCostPerStay * bookingsPerMonth
  const variableExpenses = platformFee + adminFee + cleaningTotal
  const maintenanceCost = grossRevenue * (maintenancePct / 100)
  const fixedExpenses = electricity + gas + water + internet + condo + iptu
  const expenses = variableExpenses + fixedExpenses + maintenanceCost
  const netBeforeTax = grossRevenue - expenses
  const tax = Math.max(0, netBeforeTax) * (taxRate / 100)
  const net = netBeforeTax - tax
  return { grossRevenue, variableExpenses, fixedExpenses, maintenanceCost, expenses, tax, net, daysOccupied, platformFee, adminFee, cleaningTotal }
}

function calcBreakeven(tradNet: number, airbnbParams: Parameters<typeof calcAirbnb>[0]) {
  for (let occ = 1; occ <= 100; occ++) {
    const r = calcAirbnb({ ...airbnbParams, occupancyPct: occ })
    if (r.net >= tradNet) return occ
  }
  return null
}

// ─── Profile-based Airbnb pricing matrix ─────────────────────────────────────
type FinishingStd = 'Econômico' | 'Médio' | 'Alto' | 'Luxo'
type PropertyKind = 'Apartamento' | 'Studio/Kitnet' | 'Casa' | 'Cobertura' | 'Comercial'

const RATE_TABLE: Record<string, [number, number, number]> = {
  // [conservador, mercado, premium] noite R$
  'Studio/Kitnet_1_Econômico': [100, 140, 200],
  'Studio/Kitnet_1_Médio':     [135, 185, 265],
  'Studio/Kitnet_1_Alto':      [185, 260, 370],
  'Studio/Kitnet_1_Luxo':      [260, 370, 530],
  'Apartamento_1_Econômico':   [130, 180, 260],
  'Apartamento_1_Médio':       [165, 230, 330],
  'Apartamento_1_Alto':        [220, 310, 450],
  'Apartamento_1_Luxo':        [310, 450, 640],
  'Apartamento_2_Econômico':   [150, 210, 300],
  'Apartamento_2_Médio':       [195, 270, 390],
  'Apartamento_2_Alto':        [270, 380, 550],
  'Apartamento_2_Luxo':        [380, 540, 780],
  'Apartamento_3_Médio':       [250, 350, 510],
  'Apartamento_3_Alto':        [360, 510, 740],
  'Apartamento_3_Luxo':        [530, 750, 1080],
  'Casa_2_Médio':              [210, 295, 430],
  'Casa_2_Alto':               [295, 420, 610],
  'Casa_3_Médio':              [280, 395, 570],
  'Casa_3_Alto':               [390, 550, 800],
  'Casa_3_Luxo':               [550, 780, 1120],
  'Casa_4_Alto':               [490, 700, 1010],
  'Casa_4_Luxo':               [700, 990, 1430],
  'Cobertura_2_Alto':          [480, 680, 980],
  'Cobertura_2_Luxo':          [680, 960, 1380],
  'Cobertura_3_Alto':          [640, 900, 1300],
  'Cobertura_3_Luxo':          [900, 1280, 1850],
  'Comercial_0_Econômico':     [90, 130, 190],
}

const OCC_TABLE: Record<string, [number, number, number]> = {
  // [conservador, mercado, premium] % ocupação
  'Econômico': [60, 70, 55],
  'Médio':     [55, 65, 52],
  'Alto':      [50, 62, 50],
  'Luxo':      [45, 58, 48],
}

function getProfileRates(
  type: string, beds: number, standard: string,
): { rates: [number, number, number]; occs: [number, number, number] } {
  const key = `${type}_${beds}_${standard}`
  // try exact match, then drop finishing, then default
  const fallback2 = `${type}_${beds}_Médio`
  const fallback3 = `Apartamento_${beds}_Médio`
  const rates = RATE_TABLE[key] ?? RATE_TABLE[fallback2] ?? RATE_TABLE[fallback3] ?? [180, 260, 380]
  const occs = OCC_TABLE[standard] ?? [50, 63, 50]
  return { rates, occs }
}

interface Scenario { label: string; dailyRate: number; occupancy: number; color: string }

// ─── Main component ───────────────────────────────────────────────────────────
export default function RentalAnalysis() {
  // Property header
  const [propertyName, setPropertyName] = useState('Meu Apartamento')
  const [area, setArea] = useState(65)
  const [propertyValue, setPropertyValue] = useState(600000)
  const [propertyType, setPropertyType] = useState<PropertyKind>('Apartamento')
  const [bedrooms, setBedrooms] = useState(2)
  const [finishingStandard, setFinishingStandard] = useState<FinishingStd>('Alto')

  // Traditional inputs
  const [monthlyRent, setMonthlyRent] = useState(3500)
  const [vacancyMonths, setVacancyMonths] = useState(1)
  const [adminPct, setAdminPct] = useState(10)
  const [maintenancePct, setMaintenancePct] = useState(1)
  const [taxRate, setTaxRate] = useState(27.5)
  const [condo, setCondo] = useState(600)
  const [iptuAnnual, setIptuAnnual] = useState(3000)
  const [tenantPaysCondo, setTenantPaysCondo] = useState(true)
  const [tenantPaysIPTU, setTenantPaysIPTU] = useState(true)

  // Airbnb inputs
  const [dailyRate, setDailyRate] = useState(200)
  const [airCleaningFee, setAirCleaningFee] = useState(80)
  const [airOccupancyPct, setAirOccupancyPct] = useState(65)
  const [bookingsPerMonth, setBookingsPerMonth] = useState(6)
  const [airAdminPct, setAirAdminPct] = useState(20)
  const [platformPct, setPlatformPct] = useState(3)
  const [cleaningCostPerStay, setCleaningCostPerStay] = useState(120)
  const [airMaintenancePct, setAirMaintenancePct] = useState(2)
  const [airTaxRate, setAirTaxRate] = useState(15)
  const [electricity, setElectricity] = useState(200)
  const [gas, setGas] = useState(50)
  const [water, setWater] = useState(80)
  const [internet, setInternet] = useState(120)
  const [airCondo, setAirCondo] = useState(600)
  const [airIptuMonthly, setAirIptuMonthly] = useState(250)

  // Profile-based editable scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const { rates, occs } = getProfileRates('Apartamento', 2, 'Alto')
    return [
      { label: 'Conservador', dailyRate: rates[0], occupancy: occs[0], color: C.muted },
      { label: 'Mercado',     dailyRate: rates[1], occupancy: occs[1], color: '#C47D0E' },
      { label: 'Premium',     dailyRate: rates[2], occupancy: occs[2], color: C.success },
    ]
  })

  function refreshScenarios() {
    const { rates, occs } = getProfileRates(propertyType, bedrooms, finishingStandard)
    setScenarios([
      { label: 'Conservador', dailyRate: rates[0], occupancy: occs[0], color: C.muted },
      { label: 'Mercado',     dailyRate: rates[1], occupancy: occs[1], color: '#C47D0E' },
      { label: 'Premium',     dailyRate: rates[2], occupancy: occs[2], color: C.success },
    ])
  }

  function updateScenario(i: number, key: keyof Scenario, val: number) {
    setScenarios(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
  }

  const iptuMonthly = iptuAnnual / 12
  const costPerSqm = propertyValue > 0 && area > 0 ? propertyValue / area : 0

  // Calculations
  const tradParams = useMemo(() => ({
    monthlyRent, vacancyMonths, maintenancePct, adminPct, taxRate,
    condo, iptu: iptuMonthly, tenantPaysCondo, tenantPaysIPTU,
  }), [monthlyRent, vacancyMonths, maintenancePct, adminPct, taxRate, condo, iptuMonthly, tenantPaysCondo, tenantPaysIPTU])

  const trad = useMemo(() => calcTraditional(tradParams), [tradParams])

  const airbnbParams = useMemo(() => ({
    dailyRate, cleaningFee: airCleaningFee, occupancyPct: airOccupancyPct,
    bookingsPerMonth, adminPct: airAdminPct, platformPct,
    cleaningCostPerStay, maintenancePct: airMaintenancePct, taxRate: airTaxRate,
    electricity, gas, water, internet, condo: airCondo, iptu: airIptuMonthly,
  }), [dailyRate, airCleaningFee, airOccupancyPct, bookingsPerMonth, airAdminPct, platformPct,
      cleaningCostPerStay, airMaintenancePct, airTaxRate, electricity, gas, water, internet, airCondo, airIptuMonthly])

  const airbnb = useMemo(() => calcAirbnb(airbnbParams), [airbnbParams])
  const breakeven = useMemo(() => calcBreakeven(trad.net, airbnbParams), [trad.net, airbnbParams])

  const tradYield = propertyValue > 0 ? (trad.net * 12 / propertyValue) * 100 : 0
  const airYield = propertyValue > 0 ? (airbnb.net * 12 / propertyValue) * 100 : 0
  const winner = trad.net >= airbnb.net ? 'tradicional' : 'airbnb'

  // Traditional price suggestions (% of market value — standard benchmark)
  const tradSuggestions = [
    { label: 'Conservador', rent: Math.round(propertyValue * 0.004), note: '0,40% VGV', color: C.muted },
    { label: 'Mercado',     rent: Math.round(propertyValue * 0.005), note: '0,50% VGV', color: '#C47D0E' },
    { label: 'Premium',     rent: Math.round(propertyValue * 0.007), note: '0,70% VGV', color: C.success },
  ]

  // Chart data (annualized)
  const comparisonData = [
    { name: 'Receita Bruta',    Tradicional: trad.grossIncome * 12,  Airbnb: airbnb.grossRevenue * 12 },
    { name: 'Despesas',         Tradicional: trad.expenses * 12,     Airbnb: airbnb.expenses * 12 },
    { name: 'IR',               Tradicional: trad.tax * 12,          Airbnb: airbnb.tax * 12 },
    { name: 'Resultado Líq.',   Tradicional: trad.net * 12,          Airbnb: airbnb.net * 12 },
  ]

  const radarData = [
    { metric: 'Renda',        Tradicional: Math.min(100, (trad.net / 5000) * 100),   Airbnb: Math.min(100, (airbnb.net / 5000) * 100) },
    { metric: 'Estabilidade', Tradicional: 85, Airbnb: 40 },
    { metric: 'Gestão',       Tradicional: 80, Airbnb: 30 },
    { metric: 'Flexibilidade',Tradicional: 30, Airbnb: 90 },
    { metric: 'Rentabilidade',Tradicional: Math.min(100, tradYield * 10), Airbnb: Math.min(100, airYield * 10) },
  ]

  return (
    <div className="min-h-full p-6 md:p-8" style={{ background: C.pageBg, fontFamily: 'inherit' }}>

      {/* Page title */}
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.labels }}>Análise Imobiliária</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: C.heading }}>Análise de Locação</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Compare locação tradicional e Airbnb/Short Stay com demonstrativo de resultado completo.
        </p>
      </div>

      {/* ── Property Header ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 mb-6" style={cardStyle}>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.heading }}>Perfil do Imóvel</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Field label="Imóvel">
            <TextInput value={propertyName} onChange={setPropertyName} placeholder="Nome" />
          </Field>
          <Field label="Tipo">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyKind)}
              className={inputCls} style={iStyle}
            >
              {['Apartamento','Studio/Kitnet','Casa','Cobertura','Comercial'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Quartos">
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className={inputCls} style={iStyle}
            >
              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n === 0 ? 'Studio' : `${n} quartos`}</option>)}
            </select>
          </Field>
          <Field label="Padrão">
            <select
              value={finishingStandard}
              onChange={(e) => setFinishingStandard(e.target.value as FinishingStd)}
              className={inputCls} style={iStyle}
            >
              {['Econômico','Médio','Alto','Luxo'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Área Útil">
            <NumInput value={area} onChange={setArea} suffix="m²" />
          </Field>
          <Field label="Valor de Mercado">
            <NumInput value={propertyValue} onChange={setPropertyValue} prefix="R$" step="1000" />
          </Field>
        </div>
      </div>

      {/* ── Two-column DRE cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Locação Tradicional ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#EAF3EC' }}>
              <span style={{ color: C.success }}>T</span>
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: C.heading }}>Locação Tradicional</h3>
              <p className="text-[10px]" style={{ color: C.muted }}>Demonstrativo de Resultado (DRE)</p>
            </div>
          </div>

          {/* Receitas */}
          <SectionHead title="Receitas" />
          <div className="space-y-3">
            <Field label="Aluguel Bruto Mensal">
              <NumInput value={monthlyRent} onChange={setMonthlyRent} prefix="R$" step="50" />
            </Field>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.labels }}>
                Sugestões de preço por m²
              </p>
              {tradSuggestions.map(s => (
                <ApplyRow
                  key={s.label}
                  label={s.label}
                  value={`${formatCurrency(s.rent)}/mês`}
                  note={s.note}
                  color={s.color}
                  onApply={() => setMonthlyRent(s.rent)}
                />
              ))}
            </div>
          </div>

          {/* Vacância */}
          <SectionHead title="Vacância & Ocupação" />
          <div className="space-y-3">
            <Field label={`Vacância Estimada — ${vacancyMonths} meses/ano`}>
              <div className="space-y-1">
                <input
                  type="range" min={0} max={6} step={1} value={vacancyMonths}
                  onChange={(e) => setVacancyMonths(Number(e.target.value))}
                  className="w-full" style={{ accentColor: C.accent }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: C.muted }}>
                  <span>0 meses</span>
                  <span>6 meses</span>
                </div>
              </div>
            </Field>
            <div className="flex gap-4 text-xs">
              <div className="rounded-lg px-3 py-2 flex-1" style={panelStyle}>
                <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.labels }}>Meses Ocupados</span>
                <span className="font-mono font-bold" style={{ color: C.heading }}>{12 - vacancyMonths} meses</span>
              </div>
              <div className="rounded-lg px-3 py-2 flex-1" style={panelStyle}>
                <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.labels }}>Ocupação</span>
                <span className="font-mono font-bold" style={{ color: C.success }}>{formatPct((12 - vacancyMonths) / 12 * 100, 0)}</span>
              </div>
            </div>
          </div>

          {/* Despesas Operacionais */}
          <SectionHead title="Despesas Operacionais" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taxa de Administração">
                <NumInput value={adminPct} onChange={setAdminPct} suffix="%" step="0.5" />
              </Field>
              <Field label="Manutenção Anual">
                <NumInput value={maintenancePct} onChange={setMaintenancePct} suffix="% imóvel" step="0.1" />
              </Field>
            </div>

            {/* Condo responsibility */}
            <div className="rounded-lg p-3 space-y-3" style={panelStyle}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.labels }}>Responsabilidade das Contas</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>Condomínio</p>
                    <NumInput value={condo} onChange={setCondo} prefix="R$" step="10" />
                  </div>
                  <div className="mt-4">
                    <Toggle
                      checked={tenantPaysCondo}
                      onChange={setTenantPaysCondo}
                      labelOn="Inquilino paga"
                      labelOff="Proprietário paga"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>IPTU (mensal pro-rata)</p>
                    <NumInput value={iptuAnnual} onChange={setIptuAnnual} prefix="R$/ano" step="100" />
                  </div>
                  <div className="mt-4">
                    <Toggle
                      checked={tenantPaysIPTU}
                      onChange={setTenantPaysIPTU}
                      labelOn="Inquilino paga"
                      labelOff="Proprietário paga"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px]" style={{ color: C.labels }}>
                IPTU mensal: {formatCurrency(iptuMonthly)}
              </p>
            </div>
          </div>

          {/* Impostos */}
          <SectionHead title="Impostos" />
          <Field label="IR sobre Renda de Aluguel" hint="Tabela progressiva — padrão 27,5%">
            <NumInput value={taxRate} onChange={setTaxRate} suffix="%" step="0.5" />
          </Field>

          {/* DRE Result */}
          <div className="rounded-xl p-4 mt-5 space-y-0.5" style={{
            background: '#F0F7F1',
            border: `1px solid #C6DBCA`,
          }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: C.success }}>
              Resultado Tradicional — Mensal
            </p>
            <DRERow label="Receita Efetiva" value={formatCurrency(trad.grossIncome)} color={C.success} />
            <DRERow label={`(-) Manutenção (${maintenancePct}% a.a.)`} value={`- ${formatCurrency(trad.maintenanceMonthly)}`} color={C.danger} />
            <DRERow label={`(-) Administração (${adminPct}%)`} value={`- ${formatCurrency(trad.admin)}`} color={C.danger} />
            {!tenantPaysCondo && <DRERow label="(-) Condomínio" value={`- ${formatCurrency(trad.condoExp)}`} color={C.danger} />}
            {!tenantPaysIPTU && <DRERow label="(-) IPTU pro-rata" value={`- ${formatCurrency(trad.iptuExp)}`} color={C.danger} />}
            <DRERow label="(-) Despesas Operacionais" value={`- ${formatCurrency(trad.expenses)}`} color={C.danger} />
            <DRERow label={`(-) IR (${taxRate}%)`} value={`- ${formatCurrency(trad.tax)}`} color={C.danger} />
            <DRERow label="(=) Resultado Líquido Anual" value={formatCurrency(trad.net * 12)} bold border color={trad.net > 0 ? C.success : C.danger} />
            <DRERow label="Rentabilidade Líquida" value={formatPct(tradYield, 2)} bold color={tradYield >= 6 ? C.success : '#C47D0E'} />
          </div>
        </div>

        {/* ── Airbnb / Short Stay ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: C.airBg }}>
              <span style={{ color: C.info }}>A</span>
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: C.heading }}>Airbnb & Short Stay</h3>
              <p className="text-[10px]" style={{ color: C.muted }}>Demonstrativo de Resultado (DRE)</p>
            </div>
          </div>

          {/* Receitas */}
          <SectionHead title="Receitas" />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Diária Média">
                <NumInput value={dailyRate} onChange={setDailyRate} prefix="R$" step="5" />
              </Field>
              <Field label="Taxa de Limpeza (hóspede)">
                <NumInput value={airCleaningFee} onChange={setAirCleaningFee} prefix="R$" step="5" />
              </Field>
            </div>
            <Field label={`Ocupação Média — ${airOccupancyPct}%`}>
              <div className="space-y-1">
                <input
                  type="range" min={0} max={100} step={1} value={airOccupancyPct}
                  onChange={(e) => setAirOccupancyPct(Number(e.target.value))}
                  className="w-full" style={{ accentColor: C.info }}
                />
                <div className="flex justify-between text-[10px]" style={{ color: C.muted }}>
                  <span>0%</span>
                  <span className="font-mono font-bold" style={{ color: C.info }}>
                    {Math.round(30 * airOccupancyPct / 100)} dias/mês
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </Field>
            <div className="rounded-lg px-3 py-2" style={panelStyle}>
              <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.labels }}>Receita Bruta Mensal</span>
              <span className="font-mono font-bold text-sm" style={{ color: C.info }}>{formatCurrency(airbnb.grossRevenue)}</span>
              <span className="text-[10px] ml-2" style={{ color: C.muted }}>
                {Math.round(airbnb.daysOccupied)} dias × {formatCurrency(dailyRate)} + taxas
              </span>
            </div>
          </div>

          {/* Sugestão de Precificação — Perfil do Imóvel */}
          <SectionHead title="Precificação por Perfil do Imóvel" />
          <div className="rounded-lg p-3 mb-2 text-xs space-y-1" style={{ background: C.airBg, border: `1px solid #BFDBFE` }}>
            <p style={{ color: C.info }} className="font-semibold">
              {propertyType} · {bedrooms === 0 ? 'Studio' : `${bedrooms} quartos`} · Padrão {finishingStandard}
            </p>
            <p style={{ color: C.muted }}>Baseado em perfil do imóvel, capacidade e padrão de acabamento — não em m².</p>
            <button
              onClick={refreshScenarios}
              className="text-[10px] font-bold px-2 py-1 rounded-md transition-colors mt-1"
              style={{ background: C.info, color: '#fff' }}
            >
              Recalcular sugestões para este perfil
            </button>
          </div>
          <div className="space-y-2">
            {scenarios.map((s, i) => {
              const scenRevenue = calcAirbnb({ ...airbnbParams, dailyRate: s.dailyRate, occupancyPct: s.occupancy })
              return (
                <div key={s.label} className="rounded-lg p-3 space-y-2" style={{ background: C.panelBg, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>{s.label}</span>
                    <button
                      onClick={() => { setDailyRate(s.dailyRate); setAirOccupancyPct(s.occupancy) }}
                      className="text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors"
                      style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.accent }}
                    >
                      Aplicar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: C.labels }}>Diária</p>
                      <NumInput value={s.dailyRate} onChange={(v) => updateScenario(i, 'dailyRate', v)} prefix="R$" step="5" />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: C.labels }}>Ocupação</p>
                      <NumInput value={s.occupancy} onChange={(v) => updateScenario(i, 'occupancy', Math.min(100, Math.max(0, v)))} suffix="%" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted }}>NOI estimado</span>
                    <span className="font-mono font-bold" style={{ color: scenRevenue.net > 0 ? C.success : C.danger }}>
                      {formatCurrency(scenRevenue.net)}/mês
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Despesas Variáveis */}
          <SectionHead title="Despesas Variáveis (por estadia)" />
          <div className="space-y-3">
            <Field label="Limpeza paga à Equipe">
              <NumInput value={cleaningCostPerStay} onChange={setCleaningCostPerStay} prefix="R$/est." step="5" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taxa Airbnb/Booking">
                <NumInput value={platformPct} onChange={setPlatformPct} suffix="%" step="0.1" />
              </Field>
              <Field label="Taxa de Gestão/Anfitrião">
                <NumInput value={airAdminPct} onChange={setAirAdminPct} suffix="%" step="0.5" />
              </Field>
            </div>
            <Field label="Reservas por mês (estimativa)">
              <NumInput value={bookingsPerMonth} onChange={setBookingsPerMonth} />
            </Field>
          </div>

          {/* Despesas Fixas */}
          <SectionHead title="Fixas Mensais (Contas de Consumo)" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Luz / Energia Elétrica">
              <NumInput value={electricity} onChange={setElectricity} prefix="R$" step="10" />
            </Field>
            <Field label="Gás">
              <NumInput value={gas} onChange={setGas} prefix="R$" step="5" />
            </Field>
            <Field label="Água">
              <NumInput value={water} onChange={setWater} prefix="R$" step="5" />
            </Field>
            <Field label="Internet / Wi-Fi">
              <NumInput value={internet} onChange={setInternet} prefix="R$" step="5" />
            </Field>
            <Field label="Condomínio">
              <NumInput value={airCondo} onChange={setAirCondo} prefix="R$" step="10" />
            </Field>
            <Field label="IPTU (mensal)">
              <NumInput value={airIptuMonthly} onChange={setAirIptuMonthly} prefix="R$" step="10" />
            </Field>
          </div>

          {/* Manutenção */}
          <SectionHead title="Manutenção & Enxoval" />
          <Field label="Manutenção & Reposição de Enxoval (% da receita)">
            <NumInput value={airMaintenancePct} onChange={setAirMaintenancePct} suffix="%" step="0.5" />
          </Field>

          {/* Impostos */}
          <SectionHead title="Impostos" />
          <Field label="IR / Carnê-Leão ou Simples" hint="Simples Nacional — padrão 15%">
            <NumInput value={airTaxRate} onChange={setAirTaxRate} suffix="%" step="0.5" />
          </Field>

          {/* DRE Result */}
          <div className="rounded-xl p-4 mt-5 space-y-0.5" style={{
            background: '#EFF6FF',
            border: `1px solid #BFDBFE`,
          }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: C.info }}>
              Resultado Airbnb — Mensal
            </p>
            <DRERow label="Receita Bruta Mensal" value={formatCurrency(airbnb.grossRevenue)} color={C.info} />
            <DRERow label="(-) Despesas Variáveis" value={`- ${formatCurrency(airbnb.variableExpenses)}`} color={C.danger} />
            <DRERow label="(-) Despesas Fixas" value={`- ${formatCurrency(airbnb.fixedExpenses)}`} color={C.danger} />
            <DRERow label={`(-) Manutenção (${airMaintenancePct}% receita)`} value={`- ${formatCurrency(airbnb.maintenanceCost)}`} color={C.danger} />
            <DRERow label={`(-) IR (${airTaxRate}%)`} value={`- ${formatCurrency(airbnb.tax)}`} color={C.danger} />
            <DRERow label="(=) Resultado Líquido Mensal" value={formatCurrency(airbnb.net)} bold border color={airbnb.net > 0 ? C.info : C.danger} />
            <DRERow label="Rentabilidade Líquida (a.a.)" value={formatPct(airYield, 2)} bold color={airYield >= 6 ? C.success : '#C47D0E'} />
          </div>
        </div>
      </div>

      {/* ── NOI Comparison Banner ────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5 mb-6" style={{
        background: winner === 'airbnb'
          ? 'linear-gradient(135deg, #EFF6FF 0%, #F5F2EC 100%)'
          : 'linear-gradient(135deg, #F0F7F1 0%, #F5F2EC 100%)',
        border: `1px solid ${winner === 'airbnb' ? '#BFDBFE' : '#C6DBCA'}`,
        boxShadow: '0 1px 4px rgba(31,42,30,0.06)',
      }}>
        {/* Top: recommendation */}
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: winner === 'airbnb' ? '#DBEAFE' : '#D1EAD8', color: winner === 'airbnb' ? C.info : C.success }}>
            {winner === 'airbnb' ? 'A' : 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: winner === 'airbnb' ? C.info : C.success }}>
              Estratégia recomendada com as premissas atuais
            </p>
            <p className="font-bold text-base" style={{ color: C.heading }}>
              {winner === 'airbnb' ? 'Airbnb / Short Stay' : 'Locação Tradicional'} gera mais retorno líquido
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>
              {winner === 'airbnb'
                ? `+${formatCurrency(airbnb.net - trad.net)}/mês líquido com ${airOccupancyPct}% de ocupação.`
                : `+${formatCurrency(trad.net - airbnb.net)}/mês líquido com maior estabilidade e menos gestão.`}
            </p>
          </div>
        </div>

        {/* NOI side-by-side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-4" style={{ background: '#F0F7F1', border: `1px solid #C6DBCA` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.success }}>
              NOI Mensal — Tradicional
            </p>
            <p className="font-mono text-2xl font-bold" style={{ color: trad.net > 0 ? C.success : C.danger }}>
              {formatCurrency(trad.net)}
            </p>
            <div className="mt-2 space-y-0.5 text-[10px]" style={{ color: C.muted }}>
              <div className="flex justify-between">
                <span>Receita efetiva</span>
                <span className="font-mono">{formatCurrency(trad.grossIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas op.</span>
                <span className="font-mono" style={{ color: C.danger }}>−{formatCurrency(trad.expenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>IR ({taxRate}%)</span>
                <span className="font-mono" style={{ color: C.danger }}>−{formatCurrency(trad.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: `1px solid #C6DBCA`, color: C.heading }}>
                <span>Yield líq. a.a.</span>
                <span className="font-mono">{formatPct(tradYield, 2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: '#EFF6FF', border: `1px solid #BFDBFE` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.info }}>
              NOI Mensal — Airbnb
            </p>
            <p className="font-mono text-2xl font-bold" style={{ color: airbnb.net > 0 ? C.info : C.danger }}>
              {formatCurrency(airbnb.net)}
            </p>
            <div className="mt-2 space-y-0.5 text-[10px]" style={{ color: C.muted }}>
              <div className="flex justify-between">
                <span>Receita bruta</span>
                <span className="font-mono">{formatCurrency(airbnb.grossRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesas op.</span>
                <span className="font-mono" style={{ color: C.danger }}>−{formatCurrency(airbnb.expenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>IR ({airTaxRate}%)</span>
                <span className="font-mono" style={{ color: C.danger }}>−{formatCurrency(airbnb.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: `1px solid #BFDBFE`, color: C.heading }}>
                <span>Yield líq. a.a.</span>
                <span className="font-mono">{formatPct(airYield, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delta */}
        <div className="flex items-center justify-between rounded-lg px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${winner === 'airbnb' ? '#BFDBFE' : '#C6DBCA'}` }}>
          <span className="text-xs font-semibold" style={{ color: C.heading }}>Diferença NOI mensal</span>
          <div className="text-right">
            <span className="font-mono text-xl font-bold" style={{ color: winner === 'airbnb' ? C.info : C.success }}>
              {formatCurrency(Math.abs(airbnb.net - trad.net))}
            </span>
            <span className="text-xs ml-2" style={{ color: C.muted }}>
              em favor do {winner === 'airbnb' ? 'Airbnb' : 'Tradicional'}
              {' · '}{formatCurrency(Math.abs(airbnb.net - trad.net) * 12)}/ano
            </span>
          </div>
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Bar Chart */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-bold mb-1" style={{ color: C.heading }}>Comparativo Anualizado</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>Receita, despesas e resultado líquido (R$/ano)</p>
          <div className="flex gap-4 mb-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: C.success }} />
              <span style={{ color: C.muted }}>Tradicional</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm inline-block" style={{ background: C.info }} />
              <span style={{ color: C.muted }}>Airbnb</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={comparisonData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fill: C.labels, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.labels, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                formatter={(v: unknown) => formatCurrency(Number(v))}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="Tradicional" fill={C.success} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Airbnb" fill={C.info} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-sm font-bold mb-1" style={{ color: C.heading }}>Análise Multidimensional</h3>
          <p className="text-xs mb-4" style={{ color: C.muted }}>Renda, Estabilidade, Gestão, Flexibilidade, Rentabilidade</p>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Tradicional" dataKey="Tradicional" stroke={C.success} fill={C.success} fillOpacity={0.15} strokeWidth={1.5} />
              <Radar name="Airbnb" dataKey="Airbnb" stroke={C.info} fill={C.info} fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 justify-center mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded inline-block" style={{ background: C.success }} />
              <span style={{ color: C.muted }}>Tradicional</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded inline-block" style={{ background: C.info }} />
              <span style={{ color: C.muted }}>Airbnb</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Breakeven Section ────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <h3 className="text-sm font-bold mb-1" style={{ color: C.heading }}>Ocupação de Equilíbrio</h3>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          Com qual taxa de ocupação o Airbnb empata com o aluguel tradicional?
        </p>

        {breakeven !== null ? (
          <div className="flex flex-wrap items-center gap-6 mb-5">
            <div className="rounded-xl px-6 py-4 text-center" style={{
              background: 'linear-gradient(135deg, #FEF3EE 0%, #F5F2EC 100%)',
              border: `1px solid #F0C4B5`,
            }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.labels }}>Ocupação de Equilíbrio</p>
              <p className="font-mono text-3xl font-bold" style={{ color: C.accent }}>{breakeven}%</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{Math.round(30 * breakeven / 100)} dias/mês</p>
            </div>
            <p className="text-sm flex-1" style={{ color: C.muted }}>
              Com as premissas atuais, o Airbnb supera a locação tradicional a partir de{' '}
              <span className="font-mono font-bold" style={{ color: C.accent }}>{breakeven}% de ocupação</span>{' '}
              ({Math.round(30 * breakeven / 100)} dias/mês).
              {airOccupancyPct >= breakeven
                ? ` Sua ocupação atual (${airOccupancyPct}%) já está acima do equilíbrio.`
                : ` Sua ocupação atual (${airOccupancyPct}%) ainda está abaixo do equilíbrio.`}
            </p>
          </div>
        ) : (
          <div className="rounded-xl px-5 py-4 mb-5" style={{ background: '#FEF2F2', border: `1px solid #FECACA` }}>
            <p className="text-sm" style={{ color: C.danger }}>
              Com as premissas atuais, o Airbnb não supera a locação tradicional mesmo com 100% de ocupação.
              Revise as despesas ou a diária média.
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[20, 30, 40, 50, 60, 70, 80, 90, 100].map(occ => ({
              occ: `${occ}%`,
              Airbnb: calcAirbnb({ ...airbnbParams, occupancyPct: occ }).net,
              Tradicional: trad.net,
            }))}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="occ" tick={{ fill: C.labels, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.labels, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} contentStyle={tooltipStyle} />
            <Bar dataKey="Airbnb" fill={C.info} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Tradicional" fill={C.success} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] mt-3" style={{ color: C.labels }}>
          Valores estimados com base nas premissas inseridas. Consulte referências locais para maior precisão.
        </p>
      </div>

    </div>
  )
}
