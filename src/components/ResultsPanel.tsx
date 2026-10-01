import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line, Legend,
} from 'recharts'
import { formatCurrency, formatPct, type AnalysisResults, type AnalysisInput } from '../lib/calculations'

interface Props {
  results: AnalysisResults
  inp: AnalysisInput
}

const accent = '#B85B38'
const green = '#1F2A1E'
const danger = '#C0392B'
const warning = '#C47D0E'
const info = '#2563EB'
const muted = '#6E6B63'
const gridColor = '#E6E1D7'
const tooltipBorder = '#E6E1D7'

function MetricCard({
  label, value, sub, color, icon, size = 'md',
}: {
  label: string; value: string; sub?: string; color?: string; icon?: string; size?: 'md' | 'lg'
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col"
      style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>
          {label}
        </span>
      </div>
      <div
        className="mono font-bold leading-none truncate"
        style={{ fontSize: size === 'lg' ? 'clamp(1.25rem, 3.5vw, 2.25rem)' : 'clamp(1rem, 2.5vw, 1.5rem)', color: color || green }}
      >
        {value}
      </div>
      {sub && <div className="text-xs mt-2" style={{ color: muted }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold mb-4" style={{ color: green }}>
      {children}
    </h3>
  )
}

function irrColor(irr: number, target: number) {
  if (irr >= 18) return green
  if (irr >= target) return warning
  return danger
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: '#FFFFFF', border: `1px solid ${tooltipBorder}`, boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
      <p className="font-semibold mb-1" style={{ color: green }}>Ano {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && Math.abs(p.value) > 1000
            ? formatCurrency(p.value)
            : formatPct(p.value as number)}
        </p>
      ))}
    </div>
  )
}

const CurrencyTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: '#FFFFFF', border: `1px solid ${tooltipBorder}`, boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
      <p className="font-semibold mb-1" style={{ color: green }}>Ano {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

export default function ResultsPanel({ results, inp }: Props) {
  const tirColor = irrColor(results.irr, inp.targetYield)

  const cashFlowData = results.annualProjections.map((p) => ({
    year: p.year,
    'Fluxo de Caixa': p.cashFlow,
    'FC Acumulado': p.cumulativeCashFlow,
  }))

  const appreciationData = results.annualProjections.map((p) => ({
    year: p.year,
    'Valor do Imóvel': p.propertyValue,
    'Equity': p.equity,
    'Renda Anual': p.netRent,
  }))

  const stressData = [
    { name: 'Base', tir: results.stressResults.baseCase.irr, vpl: results.stressResults.baseCase.npv },
    { name: results.stressResults.constructionOverrun.label, tir: results.stressResults.constructionOverrun.irr, vpl: results.stressResults.constructionOverrun.npv },
    { name: 'Renda −10%', tir: results.stressResults.rentDrop10.irr, vpl: results.stressResults.rentDrop10.npv },
    { name: 'Renda −20%', tir: results.stressResults.rentDrop20.irr, vpl: results.stressResults.rentDrop20.npv },
    { name: 'Renda −30%', tir: results.stressResults.rentDrop30.irr, vpl: results.stressResults.rentDrop30.npv },
  ]

  const financingData = results.financingSchedule
    .filter((_, i) => i % 12 === 0)
    .map((s) => ({
      year: Math.floor(s.month / 12) + 1,
      'Saldo devedor': s.balance,
      'Parcela': s.payment,
    }))

  return (
    <div className="p-6 space-y-8" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: muted }}>Painel de resultados</p>
        <h2 className="text-2xl font-bold" style={{ color: green }}>Análise financeira</h2>
        <p className="text-sm mt-1" style={{ color: '#52504A' }}>
          Os indicadores atualizam em tempo real conforme você ajusta os dados.
        </p>
      </div>

      {/* Hero metrics: TIR + VPL */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-6"
          style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📊</span>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>TIR — retorno anual</span>
          </div>
          <div className="mono font-bold leading-none" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: tirColor }}>
            {results.irr > 0 && results.irr < 100 ? formatPct(results.irr, 1) : '—'}
          </div>
          <div className="mt-3">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: tirColor === green ? 'rgba(52,67,53,0.1)' : tirColor === warning ? 'rgba(196,125,14,0.1)' : 'rgba(192,57,43,0.1)',
                color: tirColor,
              }}
            >
              {results.viabilityLabel}{results.irr > 0 ? ` · acima da TMA (${inp.targetYield}%)` : ''}
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: muted }}>
            Abaixo de {inp.targetYield}%: alerta · {inp.targetYield}–17,9%: boa · 18%+: excelente
          </p>
        </div>

        <div
          className="rounded-xl p-6"
          style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💎</span>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: muted }}>VPL — riqueza criada hoje</span>
          </div>
          <div className="mono font-bold leading-none truncate" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.25rem)', color: results.npv > 0 ? '#4A7C59' : danger }}>
            {formatCurrency(results.npv)}
          </div>
          <p className="text-sm mt-3 font-medium" style={{ color: results.npv > 0 ? '#4A7C59' : danger }}>
            {results.npv > 0 ? `Projeto viável · supera a TMA de ${inp.opportunityCostRate}%` : 'Projeto não supera o custo de oportunidade'}
          </p>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ROI"
          icon="↗️"
          value={formatPct(results.roi, 1)}
          sub="Retorno sobre capital próprio"
          color={results.roi > 100 ? '#4A7C59' : warning}
        />
        <MetricCard
          label="Payback"
          icon="⏳"
          value={isFinite(results.paybackYears) ? `${results.paybackYears} anos` : '> prazo'}
          sub="Recuperação do investido"
          color={results.paybackYears <= inp.analysisYears ? '#4A7C59' : danger}
        />
        <MetricCard
          label="Cap Rate"
          icon="🏢"
          value={formatPct(results.capRate, 2)}
          sub="Rendimento sobre ativo"
          color={results.capRate > 8 ? '#4A7C59' : warning}
        />
        <MetricCard
          label="Capital próprio"
          icon="🏦"
          value={formatCurrency(results.ownCapital)}
          sub="Imóvel + obra − financiado"
        />
      </div>

      {/* Cash flow row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: muted }}>Renda bruta mensal</div>
          <div className="mono text-xl font-bold" style={{ color: accent }}>{formatCurrency(results.monthlyGrossRent)}</div>
          <div className="text-xs mt-1" style={{ color: muted }}>após vacância</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: muted }}>NOI mensal</div>
          <div className="mono text-xl font-bold" style={{ color: results.monthlyNOI > 0 ? '#4A7C59' : danger }}>{formatCurrency(results.monthlyNOI)}</div>
          <div className="text-xs mt-1" style={{ color: muted }}>bruto − despesas operacionais</div>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: muted }}>Cash flow mensal</div>
          <div className="mono text-xl font-bold" style={{ color: results.monthlyCashFlow > 0 ? '#4A7C59' : danger }}>
            {formatCurrency(results.monthlyCashFlow)}
          </div>
          <div className="text-xs mt-1" style={{ color: muted }}>
            {results.monthlyFinancingPayment > 0 ? `NOI − IR − parcela ${formatCurrency(results.monthlyFinancingPayment)}` : 'NOI após IR'}
          </div>
        </div>
      </div>

      {/* Yield metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: muted }}>Yield Líquido</div>
          <div className="mono font-bold truncate" style={{ fontSize: 'clamp(1.125rem,3vw,1.875rem)', color: results.netYield > 0 ? '#4A7C59' : danger }}>
            {formatPct(results.netYield, 2)}
          </div>
          <p className="text-xs mt-2" style={{ color: '#52504A' }}>
            Fluxo líquido / capital próprio — Fórmula: (NOI − financiamento − impostos) / capital próprio
          </p>
        </div>
        <div className="rounded-xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: muted }}>Cash on Cash</div>
          <div className="mono font-bold truncate" style={{ fontSize: 'clamp(1.125rem,3vw,1.875rem)', color: results.cashOnCash > 0 ? info : danger }}>
            {formatPct(results.cashOnCash, 2)}
          </div>
          <p className="text-xs mt-2" style={{ color: '#52504A' }}>
            FC anual / capital próprio investido — retorno de caixa puro, sem valorização
          </p>
        </div>
      </div>

      {/* Cash flow chart */}
      <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
        <SectionTitle>Fluxo de caixa projetado ({inp.analysisYears} anos)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={cashFlowData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.08} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={green} stopOpacity={0.06} />
                <stop offset="95%" stopColor={green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="year" tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
            <Tooltip content={<CurrencyTooltip />} />
            <ReferenceLine y={0} stroke={gridColor} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="Fluxo de Caixa" stroke={accent} fill="url(#fcGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="FC Acumulado" stroke={green} fill="url(#accGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Appreciation chart */}
      <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
        <SectionTitle>Valorização e patrimônio</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={appreciationData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="year" tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: muted }} />
            <Line type="monotone" dataKey="Valor do Imóvel" stroke={accent} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Equity" stroke={green} strokeWidth={2} dot={false} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="Renda Anual" stroke={warning} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stress test */}
      <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span>⚠️</span>
          <h3 className="text-base font-semibold" style={{ color: green }}>Teste de Estresse</h3>
        </div>
        <p className="text-xs mb-5" style={{ color: '#52504A' }}>
          Cenários adversos com recalculate completo do fluxo — comparados vs. TMA de {inp.targetYield}% e custo de oportunidade de {inp.opportunityCostRate}%
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid #F1ECE3` }}>
                {['Cenário', 'TIR', 'VPL', 'Viável?'].map((h) => (
                  <th key={h} className="px-3 pb-3 pt-2 text-left font-medium uppercase tracking-wider" style={{ color: muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-1">
              {stressData.map((row, i) => {
                const viable = row.tir >= inp.targetYield && row.vpl > 0
                return (
                  <tr
                    key={row.name}
                    className="hover:bg-[#FDFCFA] transition-colors"
                    style={{ borderBottom: i < stressData.length - 1 ? `1px solid #F1ECE3` : 'none' }}
                  >
                    <td className="px-3 py-3 font-medium" style={{ color: '#1F2A1E' }}>{row.name}</td>
                    <td className="px-3 py-3 mono font-bold" style={{ color: irrColor(row.tir, inp.targetYield) }}>
                      {formatPct(row.tir, 1)}
                    </td>
                    <td className="px-3 py-3 mono" style={{ color: row.vpl > 0 ? '#4A7C59' : danger }}>
                      {formatCurrency(row.vpl)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: viable ? 'rgba(74,124,89,0.12)' : 'rgba(192,57,43,0.12)',
                          color: viable ? '#4A7C59' : danger,
                        }}
                      >
                        {viable ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={160} className="mt-4">
          <BarChart data={stressData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: muted, fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <Tooltip
              formatter={(v) => formatPct(Number(v), 1)}
              labelStyle={{ color: green }}
              contentStyle={{ background: '#FFFFFF', border: `1px solid ${tooltipBorder}`, borderRadius: '8px', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}
            />
            <ReferenceLine y={inp.targetYield} stroke={warning} strokeDasharray="4 4" label={{ value: `TMA ${inp.targetYield}%`, fill: warning, fontSize: 9 }} />
            <Bar dataKey="tir" name="TIR" fill={accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Financing schedule */}
      {financingData.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
          <SectionTitle>Evolução do financiamento ({inp.amortizationType})</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={financingData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={danger} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={danger} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Area type="monotone" dataKey="Saldo devedor" stroke={danger} fill="url(#debtGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Annual table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E6E1D7', boxShadow: '0 1px 3px rgba(52,67,53,0.06)' }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid #E6E1D7` }}>
          <SectionTitle>Projeção anual detalhada</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: `1px solid #F1ECE3` }}>
                {['Ano', 'Valor imóvel', 'Renda bruta', 'Op. Exp.', 'NOI', 'IR', 'Financiam.', 'FC', 'FC Acum.', 'Equity'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: muted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.annualProjections.map((p, i) => (
                <tr
                  key={p.year}
                  className="hover:bg-[#FDFCFA] transition-colors"
                  style={{ borderBottom: i < results.annualProjections.length - 1 ? `1px solid #F1ECE3` : 'none' }}
                >
                  <td className="px-4 py-3 mono font-semibold" style={{ color: green }}>{p.year}</td>
                  <td className="px-4 py-3 mono" style={{ color: '#1F2A1E' }}>{formatCurrency(p.propertyValue)}</td>
                  <td className="px-4 py-3 mono" style={{ color: accent }}>{formatCurrency(p.grossRent)}</td>
                  <td className="px-4 py-3 mono" style={{ color: danger }}>{formatCurrency(p.opExpenses)}</td>
                  <td className="px-4 py-3 mono" style={{ color: '#4A7C59' }}>{formatCurrency(p.netRent)}</td>
                  <td className="px-4 py-3 mono" style={{ color: warning }}>{formatCurrency(p.taxes)}</td>
                  <td className="px-4 py-3 mono" style={{ color: danger }}>{formatCurrency(p.financing)}</td>
                  <td className="px-4 py-3 mono font-semibold" style={{ color: p.cashFlow >= 0 ? '#4A7C59' : danger }}>
                    {formatCurrency(p.cashFlow)}
                  </td>
                  <td className="px-4 py-3 mono" style={{ color: p.cumulativeCashFlow >= 0 ? '#4A7C59' : danger }}>
                    {formatCurrency(p.cumulativeCashFlow)}
                  </td>
                  <td className="px-4 py-3 mono font-semibold" style={{ color: info }}>{formatCurrency(p.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulas transparency */}
      <div className="rounded-xl p-6" style={{ background: '#F1ECE3', border: '1px solid #D4CCBE' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: green }}>Transparência das fórmulas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs" style={{ color: '#52504A' }}>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>Cap Rate (VIR 1.1)</p>
            <p className="font-mono">= NOI Anual ÷ Custo Total de Aquisição</p>
            <p className="mt-1">NOI = bruto − despesas operacionais (antes de IR e financiamento). Denominador inclui ITBI, reforma e INCC.</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>Yield Líquido (VIR 1.1)</p>
            <p className="font-mono">= (NOI − Financiamento − IR) ÷ Capital Próprio</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>TIR (Newton-Raphson)</p>
            <p className="font-mono">FC[0] = −capital próprio; FC[n] = NOI + venda − GCAP</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>INCC Mensal</p>
            <p className="font-mono">Saldo_t = (Saldo_(t-1) × (1 + r)) − parcela_t</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>SAC</p>
            <p className="font-mono">Amortização = saldo / n; Juros = saldo × r_mensal</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: green }}>PRICE</p>
            <p className="font-mono">PMT = PV × r / (1 − (1+r)^−n)</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(184,91,56,0.06)' }}>
        <p className="text-xs" style={{ color: '#52504A' }}>
          ⚠️ Análise educacional e informativa. Não constitui promessa de rendimento ou recomendação financeira.
        </p>
      </div>
    </div>
  )
}
