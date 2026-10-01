import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpenseEntry {
  id: string;
  month: string; // "MM/AAAA"
  receita: number;
  diarias: number;
  ocupacao: number;
  financiamento: number;
  condominio: number;
  iptu: number;
  luz: number;
  gas: number;
  agua: number;
  internet: number;
  limpeza: number;
  plataforma: number;
  gestao: number;
  manutencao: number;
  outros: number;
}

interface Benfeitoria {
  id: string;
  descricao: string;
  data: string;
  custo: number;
  categoria: "Estrutural" | "Estético" | "Equipamento" | "Manutenção";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTIES = [
  "Apt 301 – Pinheiros, SP",
  "Casa 02 – Florianópolis, SC",
  "Studio 14 – Miraflores, Lima",
  "Loft Centro – Curitiba, PR",
];

const CATEGORY_COLORS = [
  "#B85B38",
  "#344335",
  "#C47D0E",
  "#2563EB",
  "#4A7C59",
  "#8B4513",
  "#6B7280",
  "#9333EA",
  "#0891B2",
  "#DC2626",
  "#059669",
  "#7C3AED",
];

const CATEGORY_LABELS: Record<string, string> = {
  financiamento: "Financiamento/Hipoteca",
  condominio: "Condomínio",
  iptu: "IPTU",
  luz: "Luz",
  gas: "Gás",
  agua: "Água",
  internet: "Internet/Wi-Fi",
  limpeza: "Taxa de Limpeza",
  plataforma: "Taxa de Plataforma",
  gestao: "Taxa de Gestão",
  manutencao: "Manutenção & Enxoval",
  outros: "Outros",
};

const EXPENSE_KEYS = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

const BENFEITORIA_CATS = ["Estrutural", "Estético", "Equipamento", "Manutenção"] as const;

const BENFEITORIA_BADGE_COLORS: Record<string, string> = {
  Estrutural: "bg-blue-100 text-blue-800",
  Estético: "bg-purple-100 text-purple-800",
  Equipamento: "bg-amber-100 text-amber-800",
  Manutenção: "bg-green-100 text-green-800",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: ExpenseEntry[] = [
  {
    id: "1",
    month: "05/2025",
    receita: 8400,
    diarias: 21,
    ocupacao: 70,
    financiamento: 2200,
    condominio: 450,
    iptu: 120,
    luz: 180,
    gas: 45,
    agua: 60,
    internet: 100,
    limpeza: 420,
    plataforma: 336,
    gestao: 504,
    manutencao: 200,
    outros: 80,
  },
  {
    id: "2",
    month: "06/2025",
    receita: 9200,
    diarias: 24,
    ocupacao: 80,
    financiamento: 2200,
    condominio: 450,
    iptu: 120,
    luz: 210,
    gas: 50,
    agua: 60,
    internet: 100,
    limpeza: 480,
    plataforma: 368,
    gestao: 552,
    manutencao: 150,
    outros: 0,
  },
  {
    id: "3",
    month: "07/2025",
    receita: 11500,
    diarias: 29,
    ocupacao: 93,
    financiamento: 2200,
    condominio: 450,
    iptu: 120,
    luz: 260,
    gas: 55,
    agua: 65,
    internet: 100,
    limpeza: 580,
    plataforma: 460,
    gestao: 690,
    manutencao: 320,
    outros: 150,
  },
  {
    id: "4",
    month: "08/2025",
    receita: 7800,
    diarias: 19,
    ocupacao: 61,
    financiamento: 2200,
    condominio: 450,
    iptu: 120,
    luz: 190,
    gas: 40,
    agua: 58,
    internet: 100,
    limpeza: 380,
    plataforma: 312,
    gestao: 468,
    manutencao: 100,
    outros: 0,
  },
];

const MOCK_BENFEITORIAS: Benfeitoria[] = [
  {
    id: "b1",
    descricao: "Troca de encanamento do banheiro",
    data: "2025-04-10",
    custo: 1800,
    categoria: "Estrutural",
  },
  {
    id: "b2",
    descricao: "Pintura completa do apartamento",
    data: "2025-05-22",
    custo: 2400,
    categoria: "Estético",
  },
  {
    id: "b3",
    descricao: "Ar-condicionado split novo",
    data: "2025-06-15",
    custo: 3200,
    categoria: "Equipamento",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcExpenses(e: ExpenseEntry): number {
  return (
    e.financiamento +
    e.condominio +
    e.iptu +
    e.luz +
    e.gas +
    e.agua +
    e.internet +
    e.limpeza +
    e.plataforma +
    e.gestao +
    e.manutencao +
    e.outros
  );
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#6E6B63" }}>
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 border ${className}`}
      style={{ borderColor: "#E2DCD2" }}
    >
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  delta,
  deltaInvert,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number; // % deviation from estimate; positive = above estimate
  deltaInvert?: boolean; // for costs: positive delta is bad (costs exceeded)
}) {
  const good = delta !== undefined
    ? (deltaInvert ? delta <= 0 : delta >= 0)
    : null;
  const deltaColor = good === null ? undefined : (good ? "#4A7C59" : "#C0392B");
  return (
    <div
      className="bg-white rounded-2xl border p-4 flex flex-col gap-1 min-w-[150px]"
      style={{ borderColor: "#E2DCD2" }}
    >
      <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#6E6B63" }}>
        {label}
      </p>
      <p className="mono text-xl font-bold" style={{ color: "#1F2A1E" }}>
        {value}
      </p>
      {delta !== undefined && (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full self-start"
          style={{ background: deltaColor ? `${deltaColor}18` : '#F1ECE3', color: deltaColor ?? "#6E6B63" }}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs estimado
        </span>
      )}
      {sub && (
        <p className="text-xs" style={{ color: "#52504A" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fullName: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-md text-sm"
      style={{ background: "#fff", borderColor: "#E2DCD2", color: "#1F2A1E" }}
    >
      <p className="font-semibold">{item.payload.fullName}</p>
      <p className="mono">{brl(item.value)}</p>
    </div>
  );
}

// ─── Form default state ───────────────────────────────────────────────────────

function emptyFormExpenses(): Omit<ExpenseEntry, "id" | "month" | "receita" | "diarias" | "ocupacao"> {
  return {
    financiamento: 0,
    condominio: 0,
    iptu: 0,
    luz: 0,
    gas: 0,
    agua: 0,
    internet: 0,
    limpeza: 0,
    plataforma: 0,
    gestao: 0,
    manutencao: 0,
    outros: 0,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OperationalView() {
  const [selectedProperty, setSelectedProperty] = useState(PROPERTIES[0]);
  const [entries, setEntries] = useState<ExpenseEntry[]>(MOCK_ENTRIES);
  const [benfeitorias, setBenfeitorias] = useState<Benfeitoria[]>(MOCK_BENFEITORIAS);

  // Form state
  const [formMonth, setFormMonth] = useState("");
  const [formReceita, setFormReceita] = useState("");
  const [formDiarias, setFormDiarias] = useState("");
  const [formOcupacao, setFormOcupacao] = useState("");
  const [formExpenses, setFormExpenses] = useState(emptyFormExpenses());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estimated (VIR projection baseline)
  const [estRevenue, setEstRevenue] = useState(9000);
  const [estCosts, setEstCosts] = useState(4500);
  const [showEstConfig, setShowEstConfig] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  }
  useEffect(() => { /* toast auto-dismiss handled by setTimeout above */ }, []);

  // Breakeven
  const [dailyRate, setDailyRate] = useState("350");

  // Benfeitoria form
  const [bDesc, setBDesc] = useState("");
  const [bDate, setBDate] = useState("");
  const [bCusto, setBCusto] = useState("");
  const [bCat, setBCat] = useState<Benfeitoria["categoria"]>("Estrutural");

  // ── Derived data ─────────────────────────────────────────────────────────

  const latestEntry = entries[entries.length - 1];

  const allExpenseTotals = entries.map(calcExpenses);
  const totalCosts = allExpenseTotals.reduce((s, v) => s + v, 0);
  const avgMonthly = entries.length > 0 ? totalCosts / entries.length : 0;
  const sortedTotals = [...allExpenseTotals].sort((a, b) => a - b);
  const median =
    sortedTotals.length === 0
      ? 0
      : sortedTotals.length % 2 === 1
      ? sortedTotals[Math.floor(sortedTotals.length / 2)]
      : (sortedTotals[sortedTotals.length / 2 - 1] + sortedTotals[sortedTotals.length / 2]) / 2;
  const minMonthly = sortedTotals[0] ?? 0;
  const maxMonthly = sortedTotals[sortedTotals.length - 1] ?? 0;
  const variation = minMonthly > 0 ? ((maxMonthly - minMonthly) / minMonthly) * 100 : 0;

  // Donut chart data from latest entry
  const donutData = latestEntry
    ? EXPENSE_KEYS.map((key, i) => ({
        name: key,
        fullName: CATEGORY_LABELS[key],
        value: latestEntry[key as keyof ExpenseEntry] as number,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      })).filter((d) => d.value > 0)
    : [];

  // Breakeven
  const rate = parseFloat(dailyRate) || 0;
  const currentFixedCosts = latestEntry ? calcExpenses(latestEntry) : 0;
  const breakevenDiarias = rate > 0 ? Math.ceil(currentFixedCosts / rate) : 0;
  const realizedDiarias = latestEntry?.diarias ?? 0;
  const breakevenProgress =
    breakevenDiarias > 0 ? Math.min((realizedDiarias / breakevenDiarias) * 100, 100) : 0;

  // Benfeitorias total
  const totalBenfeitorias = benfeitorias.reduce((s, b) => s + b.custo, 0);

  // Estimated vs Real deltas
  const avgRevenue = entries.length > 0 ? entries.reduce((s, e) => s + e.receita, 0) / entries.length : 0;
  const revenueDelta = estRevenue > 0 ? ((avgRevenue - estRevenue) / estRevenue) * 100 : 0;
  const costDelta = estCosts > 0 ? ((avgMonthly - estCosts) / estCosts) * 100 : 0;
  const avgNOI = avgRevenue - avgMonthly;
  const estNOI = estRevenue - estCosts;
  const noiDelta = estNOI !== 0 ? ((avgNOI - estNOI) / Math.abs(estNOI)) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleExpenseChange(key: string, value: string) {
    setFormExpenses((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  }

  function handleStartEdit(entry: ExpenseEntry) {
    setEditingId(entry.id);
    setFormMonth(entry.month);
    setFormReceita(String(entry.receita));
    setFormDiarias(String(entry.diarias));
    setFormOcupacao(String(entry.ocupacao));
    const { id: _id, month: _m, receita: _r, diarias: _d, ocupacao: _o, ...expenses } = entry;
    setFormExpenses(expenses);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormMonth("");
    setFormReceita("");
    setFormDiarias("");
    setFormOcupacao("");
    setFormExpenses(emptyFormExpenses());
  }

  function handleRegisterMonth() {
    if (!formMonth.trim()) { showToast("Informe o mês de referência (MM/AAAA).", false); return; }
    const entry: ExpenseEntry = {
      id: editingId ?? uid(),
      month: formMonth,
      receita: parseFloat(formReceita) || 0,
      diarias: parseInt(formDiarias) || 0,
      ocupacao: parseFloat(formOcupacao) || 0,
      ...formExpenses,
    };
    if (editingId) {
      setEntries((prev) => prev.map((e) => e.id === editingId ? entry : e));
      showToast(`Registro ${formMonth} atualizado com sucesso.`);
    } else {
      setEntries((prev) => [...prev, entry]);
      showToast(`Mês ${formMonth} registrado para ${selectedProperty}.`);
    }
    setEditingId(null);
    setFormMonth("");
    setFormReceita("");
    setFormDiarias("");
    setFormOcupacao("");
    setFormExpenses(emptyFormExpenses());
  }

  function handleDeleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast("Registro removido.", false);
  }

  function handleAddBenfeitoria() {
    if (!bDesc.trim() || !bDate || !bCusto) return;
    setBenfeitorias((prev) => [
      ...prev,
      {
        id: uid(),
        descricao: bDesc,
        data: bDate,
        custo: parseFloat(bCusto) || 0,
        categoria: bCat,
      },
    ]);
    setBDesc("");
    setBDate("");
    setBCusto("");
    setBCat("Estrutural");
  }

  function handleDeleteBenfeitoria(id: string) {
    setBenfeitorias((prev) => prev.filter((b) => b.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen px-4 md:px-6 py-8 space-y-8"
      style={{ background: "#F8F6F1", color: "#1F2A1E" }}
    >
      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all animate-in"
          style={{
            background: toast.ok ? "#1F2A1E" : "#C0392B",
            color: "#F8F6F1",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            minWidth: 260,
          }}
        >
          <span>{toast.ok ? "✓" : "✕"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "#6E6B63" }}>
            DRE Real Airbnb
          </p>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#1F2A1E" }}>
            Gestão Operacional
          </h1>
          <p className="text-sm mt-1" style={{ color: "#52504A" }}>
            Registre receitas e despesas reais e compare com as projeções do VIR.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Property selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider hidden sm:block" style={{ color: "#6E6B63" }}>
              Imóvel
            </label>
            <select
              className="rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B85B38]/30"
              style={{ borderColor: "#E2DCD2", color: "#1F2A1E" }}
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              {PROPERTIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {/* PDF export */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ background: "#fff", color: "#52504A", borderColor: "#E2DCD2" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1ECE3")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            title="Exportar PDF"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* ── Estimado vs Real config ──────────────────────────────────────── */}
      <div className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#E2DCD2" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6E6B63" }}>
              Projeção Inicial (VIR) — Estimado vs. Real
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#52504A" }}>
              Configure os valores projetados pela análise VIR para comparar com o realizado.
            </p>
          </div>
          <button
            onClick={() => setShowEstConfig((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all"
            style={{ borderColor: "#E2DCD2", color: "#B85B38", background: "rgba(184,91,56,0.06)" }}
          >
            {showEstConfig ? "Fechar" : "Configurar metas"}
          </button>
        </div>
        {showEstConfig && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #E2DCD2" }}>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Receita Projetada (R$/mês)
              </label>
              <input
                type="number" min="0" className="w-full rounded-xl border px-3 py-2 text-sm bg-white mono focus:outline-none focus:ring-2 focus:ring-[#B85B38]/30"
                style={{ borderColor: "#E2DCD2" }}
                value={estRevenue}
                onChange={(e) => setEstRevenue(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Custos Projetados (R$/mês)
              </label>
              <input
                type="number" min="0" className="w-full rounded-xl border px-3 py-2 text-sm bg-white mono focus:outline-none focus:ring-2 focus:ring-[#B85B38]/30"
                style={{ borderColor: "#E2DCD2" }}
                value={estCosts}
                onChange={(e) => setEstCosts(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}
        {/* Comparison row — always visible */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Receita Média Real", real: avgRevenue, est: estRevenue, invert: false },
            { label: "Custo Médio Real", real: avgMonthly, est: estCosts, invert: true },
            { label: "NOI Médio Real", real: avgNOI, est: estNOI, invert: false },
          ].map(({ label, real, est, invert }) => {
            const delta = est !== 0 ? ((real - est) / Math.abs(est)) * 100 : 0;
            const isGood = invert ? delta <= 0 : delta >= 0;
            const dc = entries.length === 0 ? "#6E6B63" : (isGood ? "#4A7C59" : "#C0392B");
            return (
              <div key={label} className="rounded-xl p-3 space-y-1" style={{ background: "#F8F6F1", border: "1px solid #E2DCD2" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6E6B63" }}>{label}</p>
                <p className="mono text-base font-bold" style={{ color: "#1F2A1E" }}>{brl(real)}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span style={{ color: "#6E6B63" }}>Est. {brl(est)}</span>
                  {entries.length > 0 && (
                    <span className="font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${dc}18`, color: dc }}>
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Expense Entry Form ───────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader>{editingId ? `Editando: ${formMonth || "mês"}` : "Registrar Despesas Mensais"}</SectionHeader>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="text-xs px-3 py-1 rounded-lg border font-semibold"
              style={{ borderColor: "#E2DCD2", color: "#52504A" }}
            >
              Cancelar edição
            </button>
          )}
        </div>
        <div className="space-y-5">
          {/* Revenue row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Mês de Referência
              </label>
              <input
                type="text"
                placeholder="MM/AAAA"
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none"
                style={{ borderColor: "#E2DCD2" }}
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Receita Bruta (R$)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0,00"
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
                style={{ borderColor: "#E2DCD2" }}
                value={formReceita}
                onChange={(e) => setFormReceita(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Diárias Realizadas
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
                style={{ borderColor: "#E2DCD2" }}
                value={formDiarias}
                onChange={(e) => setFormDiarias(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Taxa de Ocupação (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
                style={{ borderColor: "#E2DCD2" }}
                value={formOcupacao}
                onChange={(e) => setFormOcupacao(e.target.value)}
              />
            </div>
          </div>

          {/* Expense categories grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {EXPENSE_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                  {CATEGORY_LABELS[key]}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0,00"
                  className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
                  style={{ borderColor: "#E2DCD2" }}
                  value={formExpenses[key as keyof typeof formExpenses] || ""}
                  onChange={(e) => handleExpenseChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "#6E6B63" }}>
              Vinculando ao imóvel: <span className="font-semibold" style={{ color: "#1F2A1E" }}>{selectedProperty}</span>
            </p>
            <button
              onClick={handleRegisterMonth}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: editingId ? "#344335" : "#B85B38" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={editingId ? "M5 13l4 4L19 7" : "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"} />
              </svg>
              {editingId ? "Salvar alterações" : "Salvar Registro"}
            </button>
          </div>
        </div>
      </Card>

      {/* ── Metrics Summary ──────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div>
          <SectionHeader>Resumo de Custos — {entries.length} {entries.length === 1 ? "mês" : "meses"} registrados</SectionHeader>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <MetricCard label="Total de Custos" value={brl(totalCosts)} sub={`${entries.length} meses`} />
            <MetricCard
              label="Média Mensal"
              value={brl(avgMonthly)}
              delta={costDelta}
              deltaInvert
            />
            <MetricCard label="Mediana" value={brl(median)} />
            <MetricCard label="Mínimo Mensal" value={brl(minMonthly)} />
            <MetricCard label="Máximo Mensal" value={brl(maxMonthly)} />
            <MetricCard
              label="Variação no Período"
              value={`${variation.toFixed(1)}%`}
              sub="(máx – mín) / mín"
            />
            <MetricCard
              label="NOI Médio Mensal"
              value={brl(avgNOI)}
              delta={noiDelta}
            />
          </div>
        </div>
      )}

      {/* ── Expense History Table ────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Histórico Mensal — DRE Real</SectionHeader>
          {entries.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#F1ECE3", color: "#52504A" }}>
              {entries.length} {entries.length === 1 ? "registro" : "registros"}
            </span>
          )}
        </div>
        {entries.length === 0 ? (
          <p className="text-sm" style={{ color: "#52504A" }}>
            Nenhum mês registrado ainda. Use o formulário acima para adicionar o primeiro registro.
          </p>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-sm border-collapse" style={{ minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E2DCD2", background: "#FAFAF8" }}>
                  {["Mês/Ano", "Receita Bruta", "Custos Op.", "NOI Líquido Real", "Diárias", "Ocupação %", "Ações"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: "#6E6B63" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const expenses = calcExpenses(entry);
                  const noi = entry.receita - expenses;
                  const noiColor = noi >= 0 ? "#4A7C59" : "#DC2626";
                  const isEditing = editingId === entry.id;
                  return (
                    <tr
                      key={entry.id}
                      className="group border-b last:border-0 transition-colors"
                      style={{
                        borderColor: "#E2DCD2",
                        background: isEditing ? "rgba(184,91,56,0.04)" : undefined,
                      }}
                      onMouseEnter={(e) => { if (!isEditing) e.currentTarget.style.background = "#FDFCFA"; }}
                      onMouseLeave={(e) => { if (!isEditing) e.currentTarget.style.background = ""; }}
                    >
                      <td className="py-2.5 px-3 mono font-semibold" style={{ color: "#1F2A1E" }}>{entry.month}</td>
                      <td className="py-2.5 px-3 mono" style={{ color: "#B85B38" }}>{brl(entry.receita)}</td>
                      <td className="py-2.5 px-3 mono" style={{ color: "#C0392B" }}>{brl(expenses)}</td>
                      <td className="py-2.5 px-3 mono font-bold" style={{ color: noiColor }}>{brl(noi)}</td>
                      <td className="py-2.5 px-3 mono text-xs" style={{ color: "#52504A" }}>{entry.diarias}</td>
                      <td className="py-2.5 px-3 mono text-xs" style={{ color: "#52504A" }}>{entry.ocupacao}%</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="text-xs px-2 py-1 rounded-lg transition-all"
                            style={{ color: "#B85B38", background: "rgba(184,91,56,0.08)" }}
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-xs px-2 py-1 rounded-lg transition-all"
                            style={{ color: "#DC2626", background: "rgba(220,38,38,0.08)" }}
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E2DCD2", background: "#F1ECE3" }}>
                  <td className="py-2.5 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: "#6E6B63" }}>Totais</td>
                  <td className="py-2.5 px-3 mono font-bold" style={{ color: "#B85B38" }}>
                    {brl(entries.reduce((s, e) => s + e.receita, 0))}
                  </td>
                  <td className="py-2.5 px-3 mono font-bold" style={{ color: "#C0392B" }}>
                    {brl(totalCosts)}
                  </td>
                  <td className="py-2.5 px-3 mono font-bold" style={{ color: entries.reduce((s, e) => s + e.receita, 0) - totalCosts >= 0 ? "#4A7C59" : "#DC2626" }}>
                    {brl(entries.reduce((s, e) => s + e.receita, 0) - totalCosts)}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs" style={{ color: "#52504A" }}>
                    {entries.reduce((s, e) => s + e.diarias, 0)}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs" style={{ color: "#52504A" }}>
                    {entries.length > 0 ? (entries.reduce((s, e) => s + e.ocupacao, 0) / entries.length).toFixed(0) : 0}% méd.
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* ── Chart + Breakeven row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <Card>
          <SectionHeader>
            Distribuição de Despesas
            {latestEntry ? ` — ${latestEntry.month}` : ""}
          </SectionHeader>
          {donutData.length === 0 ? (
            <p className="text-sm" style={{ color: "#52504A" }}>
              Nenhuma despesa registrada.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="40%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => {
                    const item = donutData.find((d) => d.name === value);
                    return (
                      <span style={{ fontSize: "11px", color: "#52504A" }}>
                        {item?.fullName ?? value}
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Breakeven */}
        <Card>
          <SectionHeader>Breakeven de Diárias</SectionHeader>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
                Diária Média (R$)
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
                style={{ borderColor: "#E2DCD2" }}
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "#F8F6F1", border: "1px solid #E2DCD2" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#1F2A1E" }}>
                Você precisa de{" "}
                <span className="mono font-bold text-lg" style={{ color: "#B85B38" }}>
                  {breakevenDiarias}
                </span>{" "}
                diárias para cobrir seus custos fixos de{" "}
                <span className="mono font-semibold">{brl(currentFixedCosts)}</span>
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6E6B63" }}>
                <span>
                  Realizadas:{" "}
                  <span className="mono font-semibold" style={{ color: "#1F2A1E" }}>
                    {realizedDiarias}
                  </span>
                </span>
                <span>
                  Meta:{" "}
                  <span className="mono font-semibold" style={{ color: "#1F2A1E" }}>
                    {breakevenDiarias}
                  </span>
                </span>
              </div>
              <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: "#E2DCD2" }}>
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${breakevenProgress}%`,
                    background:
                      breakevenProgress >= 100
                        ? "#4A7C59"
                        : breakevenProgress >= 70
                        ? "#C47D0E"
                        : "#B85B38",
                  }}
                />
              </div>
              <p className="text-xs mt-1.5 text-right mono" style={{ color: "#6E6B63" }}>
                {breakevenProgress.toFixed(0)}% da meta
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Registro de Benfeitorias ─────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <SectionHeader>Registro de Benfeitorias</SectionHeader>
          <div className="text-right">
            <p className="text-xs" style={{ color: "#6E6B63" }}>
              Total Investido
            </p>
            <p className="mono text-lg font-bold" style={{ color: "#1F2A1E" }}>
              {brl(totalBenfeitorias)}
            </p>
          </div>
        </div>

        {/* Add form */}
        <div
          className="rounded-xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end"
          style={{ background: "#F8F6F1", border: "1px solid #E2DCD2" }}
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Troca de piso"
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none"
              style={{ borderColor: "#E2DCD2" }}
              value={bDesc}
              onChange={(e) => setBDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
              Data
            </label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none"
              style={{ borderColor: "#E2DCD2" }}
              value={bDate}
              onChange={(e) => setBDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
              Custo (R$)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0,00"
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none mono"
              style={{ borderColor: "#E2DCD2" }}
              value={bCusto}
              onChange={(e) => setBCusto(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6E6B63" }}>
              Categoria
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none"
              style={{ borderColor: "#E2DCD2" }}
              value={bCat}
              onChange={(e) => setBCat(e.target.value as Benfeitoria["categoria"])}
            >
              {BENFEITORIA_CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddBenfeitoria}
              className="w-full px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#344335" }}
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* List */}
        {benfeitorias.length === 0 ? (
          <p className="text-sm" style={{ color: "#52504A" }}>
            Nenhuma benfeitoria registrada.
          </p>
        ) : (
          <div className="space-y-2">
            {benfeitorias.map((b) => (
              <div
                key={b.id}
                className="group flex items-center justify-between rounded-xl px-4 py-3 border"
                style={{ borderColor: "#E2DCD2", background: "#fff" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${BENFEITORIA_BADGE_COLORS[b.categoria]}`}
                  >
                    {b.categoria}
                  </span>
                  <p className="text-sm font-medium truncate" style={{ color: "#1F2A1E" }}>
                    {b.descricao}
                  </p>
                  <p className="text-xs hidden sm:block shrink-0" style={{ color: "#6E6B63" }}>
                    {new Date(b.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="mono text-sm font-semibold" style={{ color: "#1F2A1E" }}>
                    {brl(b.custo)}
                  </span>
                  <button
                    onClick={() => handleDeleteBenfeitoria(b.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-sm"
                    style={{ color: "#DC2626" }}
                    aria-label="Remover benfeitoria"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
