/**
 * Motor financeiro — port fiel das abas 08-SAC, 09-PRICE, 11-Viabilidade,
 * 11.1-Auxiliar Viabilidade e 12-SAC Viabilidade da planilha da Escola de Imóveis.
 *
 * Convenções:
 *  - Percentuais SEMPRE como fração (0.15 = 15%).
 *  - Funções puras, sem React/Supabase → testáveis e reutilizáveis (hook, API routes, testes).
 *  - Comentários "(Excel X##)" apontam a célula de origem na planilha.
 */

export type TaxRegime = 'PF' | 'PJ';
export type AmortSystem = 'SAC' | 'PRICE';
export type BusinessModel = 'long_stay' | 'short_stay';

export interface ViabilityInputs {
  // ── Compra (11-Viabilidade B10:C28)
  propertyValue: number;        // C10
  ltv: number;                  // C11
  loanRateAnnual: number;       // C12
  areaM2: number;               // C13
  itbiPct: number;              // C19
  escrituraPct: number;         // C20
  registroPct: number;          // C21
  appraisal: number;            // C22 (R$)
  renovationCost: number;       // C23 (R$)
  renovationMonths: number;     // C24

  // ── Financiamento (12-SAC Viabilidade)
  loanTermMonths: number;       // E8 (420)
  amortization: AmortSystem;    // SAC (padrão da viabilidade) ou PRICE

  // ── Planta (F10:G22)
  offPlan: boolean;             // G10 "Sim"/"Não"
  buildMonths: number;          // G11
  incc: number;                 // G12 (a.a.)
  offPlanDownPct: number;       // G19
  offPlanInstallPct: number;    // G20
  offPlanKeysPct: number;       // G21

  // ── Locação (J10:K17)
  businessModel: BusinessModel;
  monthlyRent: number;          // K10 (long stay)
  vacancyMonths: number;        // K11 (meses vagos por contrato)
  brokerageMonths: number;      // K12 (corretagem em nº de aluguéis)
  contractMonths: number;       // K13
  adminFeePct: number;          // K14
  repairFundPct: number;        // K15
  iptuMonthly: number;          // K16
  condoMonthly: number;         // K17
  rentInflation: number;        // O10

  // ── Short stay / Airbnb (J22:K30)
  shortStay: {
    dailyRate: number;          // K22
    occupancy: number;          // K23
    platformFeePct: number;     // K24 (Administrador)
    electricityGas: number;     // K25
    internet: number;           // K26
    other: number;              // K27
  };

  // ── Venda e mercado (N10:O17)
  appreciation: number;         // O11
  renovation10thYear: number;   // O12 (R$ deduzido do ano 10)
  sellCommissionPct: number;    // O13
  exitYear: number;             // O14 (1..15)
  costOfCapital: number;        // O15
  saleTaxRate: number;          // O17

  // ── Imposto sobre renda
  taxRegime: TaxRegime;
  /** PF: alíquota sobre (aluguel − administração) — Excel O16 (15%).
   *  PJ: alíquota efetiva sobre a Receita Bruta (aluguel). */
  incomeTaxRate: number;

  /** Excel C33:Q33 — valor de mercado manual por ano (0 = usar valorização). */
  marketValueOverrides?: number[];
  /** Planta: 'excel' replica o saldo devedor da planilha (cronograma do imóvel pronto);
   *  'adjusted' usa o cronograma deslocado pela obra (coluna AA). */
  offPlanBalanceMode?: 'excel' | 'adjusted';
}

export interface AmortRow {
  n: number; opening: number; interest: number; amortization: number; payment: number; balance: number;
}

export interface MonthRow {
  month: number; offset: number;
  rent: number; brokerage: number; admin: number; repairFund: number; vacancy: number;
  payment: number; balance: number; tax: number;
  netLeveraged: number; netCash: number;
  /** aluguel − (corretagem + adm + fundo + vacância): antes de imposto e financiamento */
  noi: number;
}

export interface Indicators {
  irr: number | null; roi: number; multiple: number; npv: number;
  paybackYears: number | null; flows: number[]; yields: number[];
}

export interface ViabilityResult {
  loan: number; downPayment: number;
  upfrontCash: number; upfrontLeveraged: number;
  monthlyRent: number;
  marketValue: number[];
  amortization: AmortRow[];
  months: MonthRow[];
  annual: { rentCash: number[]; rentLeveraged: number[]; saleCash: number[]; saleLeveraged: number[] };
  cash: Indicators;
  leveraged: Indicators;
  offPlanCash?: Indicators;
  offPlanLeveraged?: Indicators;
  kpi: {
    noiMonthly: number; capRate: number; ltv: number;
    outOfPocket: number; firstInstallment: number; minIncome: number;
  };
}

// ───────────────────────────── Matemática financeira ─────────────────────────────

/** Excel I8: (1+a)^(1/12)-1 */
export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1;

/** Excel NPV(rate, values) — o 1º valor é descontado 1 período. */
export function npv(rate: number, values: number[]): number {
  return values.reduce((acc, v, i) => acc + v / Math.pow(1 + rate, i + 1), 0);
}

/** Excel IRR — Newton com fallback por bisseção. Retorna null se não houver raiz. */
export function irr(flows: number[], guess = 0.1): number | null {
  const f = (r: number) => flows.reduce((a, v, i) => a + v / Math.pow(1 + r, i), 0);
  const df = (r: number) => flows.reduce((a, v, i) => a - (i * v) / Math.pow(1 + r, i + 1), 0);
  let r = guess;
  for (let k = 0; k < 100; k++) {
    const d = df(r);
    if (!isFinite(d) || d === 0) break;
    const nr = r - f(r) / d;
    if (!isFinite(nr) || nr <= -0.999999) break;
    if (Math.abs(nr - r) < 1e-12) return nr;
    r = nr;
  }
  let lo = -0.99, hi = 10;
  const flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return null;
  let a = lo, b = hi, fa = flo;
  for (let k = 0; k < 300; k++) {
    const mid = (a + b) / 2, fm = f(mid);
    if (Math.abs(fm) < 1e-9) return mid;
    if (fa * fm < 0) b = mid; else { a = mid; fa = fm; }
  }
  return (a + b) / 2;
}

/** Aba 05-Payback: ano em que o saldo acumulado vira positivo, com fração linear. */
export function payback(flows: number[]): number | null {
  let cum = flows[0];
  for (let t = 1; t < flows.length; t++) {
    const prev = cum;
    cum += flows[t];
    if (cum >= 0 && flows[t] !== 0) return t - 1 + -prev / flows[t];
  }
  return null;
}

/** Abas 08-SAC / 09-PRICE / 12-SAC Viabilidade. */
export function buildAmortization(
  principal: number, annualRate: number, termMonths: number, system: AmortSystem,
): AmortRow[] {
  const i = monthlyRate(annualRate);
  const n = Math.max(0, Math.min(Math.round(termMonths), 420)); // planilha limita a 420 (A11)
  const rows: AmortRow[] = [];
  if (!n || principal <= 0) return rows;
  const pmt = system === 'PRICE'
    ? (i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n)))
    : 0;
  let balance = principal;
  for (let k = 1; k <= n; k++) {
    const opening = balance;
    const interest = opening * i;
    const amort = system === 'SAC' ? principal / n : pmt - interest;
    const payment = interest + amort;
    balance = opening + interest - payment;
    rows.push({ n: k, opening, interest, amortization: amort, payment, balance });
  }
  return rows;
}

/** Excel K30: aluguel líquido Airbnb (limpeza considerada paga pela taxa de limpeza). */
export const shortStayNetRent = (i: ViabilityInputs) => {
  const s = i.shortStay;
  return s.dailyRate * (s.occupancy * 30) * (1 - s.platformFeePct)
    - (s.electricityGas + s.internet + s.other + i.iptuMonthly + i.condoMonthly);
};

/**
 * Imposto mensal sobre a renda.
 *  PF: (aluguel − administração) × alíquota   (Excel K8 = (D−F)×O16)
 *  PJ: aluguel bruto × alíquota efetiva
 */
const incomeTax = (i: ViabilityInputs, rent: number, admin: number) =>
  i.taxRegime === 'PJ' ? rent * i.incomeTaxRate : (rent - admin) * i.incomeTaxRate;

// ───────────────────────────────── Motor principal ─────────────────────────────────

const YEARS = 15;
const sum = (a: number[], from = 0, to = a.length) => a.slice(from, to).reduce((x, y) => x + y, 0);

function summarize(flows: number[], costOfCapital: number, lateSecondPayment = false) {
  // Excel T37/T38 (normal) e T55/T56 (planta com obra > 12 meses: 2º aporte no ano 2)
  const head = lateSecondPayment ? flows[0] + flows[1] : flows[0];
  const tail = sum(flows, lateSecondPayment ? 2 : 1);
  return {
    irr: irr(flows),
    roi: (tail + head) / -head,
    multiple: tail / -head,
    npv: npv(costOfCapital, flows.slice(1)) + flows[0],
    paybackYears: payback(flows),
  };
}

/** Yield: ano 1 = renda/investimento; demais = renda/investimento, ou renda/fluxo1 se renda1 < 0 (Excel D40/D47). */
function yields(rent: number[], flows: number[], upfront: number): number[] {
  return rent.map((r, y) =>
    y === 0 ? (upfront ? r / upfront : 0)
      : rent[0] < 0 ? -r / flows[0] : (upfront ? r / upfront : 0));
}

export function runViability(inp: ViabilityInputs): ViabilityResult {
  const exit = Math.min(Math.max(Math.round(inp.exitYear), 1), YEARS);
  const horizon = exit * 12;                                          // P14
  const rent0 = inp.businessModel === 'short_stay' ? shortStayNetRent(inp) : inp.monthlyRent;
  const inccM = monthlyRate(inp.incc);                                // H12

  // Empréstimo / entrada (C14, C15)
  const loan = inp.offPlan
    ? inp.propertyValue * inp.ltv * Math.pow(1 + inp.incc, (inp.buildMonths + 1) / 12)
    : inp.propertyValue * inp.ltv;
  const downPayment = inp.propertyValue * (1 - inp.ltv);
  const itbi = inp.itbiPct * inp.propertyValue;                       // D19
  const escritura = inp.escrituraPct * inp.propertyValue;             // D20
  const registro = inp.registroPct * inp.propertyValue;               // D21

  const sched = buildAmortization(loan, inp.loanRateAnnual, inp.loanTermMonths, inp.amortization);
  const sacAt = (m: number) => sched[m - 1];

  // Provisões (L11, L12)
  const cm = inp.contractMonths || 1;
  const vacProvision =
    (inp.vacancyMonths * rent0) / cm + ((inp.iptuMonthly + inp.condoMonthly) * inp.vacancyMonths) / cm;
  const brokerageRate = inp.brokerageMonths / cm;

  // ── Motor mensal — imóvel pronto (11.1, colunas B:M)
  const months: MonthRow[] = [];
  for (let m = 1; m <= horizon; m++) {
    const offset = m < inp.renovationMonths ? 0 : m - inp.renovationMonths;       // C
    const growth = Math.pow(1 + inp.rentInflation, (offset - 1) / 12);
    const rent = offset > 0 ? rent0 * growth : 0;                                 // D
    const brokerage = rent * brokerageRate;                                       // E
    const admin = rent * inp.adminFeePct;                                         // F
    const repairFund = rent * inp.repairFundPct;                                  // G
    const vacancy = rent === 0 ? inp.iptuMonthly + inp.condoMonthly : vacProvision * growth; // H
    const s = sacAt(m);
    const payment = s ? s.payment : 0;                                            // I
    const balance = s ? s.balance : 0;                                            // J
    const tax = incomeTax(inp, rent, admin);                                      // K
    months.push({
      month: m, offset, rent, brokerage, admin, repairFund, vacancy, payment, balance, tax,
      netLeveraged: rent - (brokerage + admin + repairFund + vacancy + payment + tax), // L
      netCash: rent - (brokerage + admin + repairFund + vacancy + tax),                // M
      noi: rent - (brokerage + admin + repairFund + vacancy),
    });
  }

  // Valor de mercado (linha 34): ano 1 = valor + reforma; depois valorização composta
  const marketValue: number[] = [];
  for (let y = 0; y < YEARS; y++) {
    if (y === 0) { marketValue.push(inp.propertyValue + inp.renovationCost); continue; }
    const manual = inp.marketValueOverrides?.[y] ?? 0;
    const prev = marketValue[y - 1];
    marketValue.push(manual < prev ? prev * (1 + inp.appreciation) : manual);
  }

  const yearSum = (pick: (r: MonthRow) => number, y: number) => {
    if (exit < y + 1) return 0;
    const s = sum(months.slice(y * 12, y * 12 + 12).map(pick));
    return y === 9 ? s - inp.renovation10thYear : s;                              // L37: −O12
  };
  const rentCash = Array.from({ length: YEARS }, (_, y) => yearSum(r => r.netCash, y));
  const rentLev = Array.from({ length: YEARS }, (_, y) => yearSum(r => r.netLeveraged, y));

  const saleGross = (y: number) =>
    marketValue[y] - (marketValue[y] * inp.sellCommissionPct + inp.saleTaxRate * (marketValue[y] - inp.propertyValue));
  const saleCash = Array.from({ length: YEARS }, (_, y) => (exit === y + 1 ? saleGross(y) : 0));
  const saleLev = Array.from({ length: YEARS }, (_, y) =>
    exit === y + 1 ? saleGross(y) - (sacAt((y + 1) * 12)?.balance ?? 0) : 0);

  // Investimento inicial
  const upfrontCash = itbi + escritura + registro + inp.propertyValue + inp.renovationCost;     // C36
  // C43 — a planilha NÃO inclui escritura no custo alavancado (replicado de propósito)
  const upfrontLev = downPayment + itbi + registro + inp.appraisal + inp.renovationCost;

  const flowsCash = Array.from({ length: YEARS }, (_, y) => (y === 0 ? -upfrontCash : 0) + rentCash[y] + saleCash[y]);
  const flowsLev = Array.from({ length: YEARS }, (_, y) => (y === 0 ? -upfrontLev : 0) + rentLev[y] + saleLev[y]);

  const cash: Indicators = { ...summarize(flowsCash, inp.costOfCapital), flows: flowsCash, yields: yields(rentCash, flowsCash, upfrontCash) };
  const leveraged: Indicators = { ...summarize(flowsLev, inp.costOfCapital), flows: flowsLev, yields: yields(rentLev, flowsLev, upfrontLev) };

  // ── Imóvel na planta (11.1 colunas O:AD + 11-Viabilidade linhas 49-65)
  let offPlanCash: Indicators | undefined;
  let offPlanLeveraged: Indicators | undefined;
  if (inp.offPlan) {
    const entry = downPayment * inp.offPlanDownPct;                              // G14
    const inst = (inp.offPlanInstallPct * downPayment) / inp.buildMonths;        // G15
    const keys = downPayment * inp.offPlanKeysPct;                               // G16
    let P = 0, S = 0;
    const pm: { netCash: number; netLev: number; adjBalance: number }[] = [];
    for (let m = 1; m <= horizon; m++) {
      const O = m === 1 ? entry : 0;
      P = m <= inp.buildMonths ? (m === 1 ? inst : P * (1 + inccM)) : 0;         // P
      const Q = (m === inp.buildMonths ? keys : 0) * Math.pow(1 + inp.incc, (m - 1) / 12); // Q
      const R = -(O + P + Q);
      S = R !== 0 ? 0 : S + 1;                                                   // mês ajustado
      const T = S < inp.renovationMonths ? 0 : S - inp.renovationMonths;
      const U = T > 0 ? rent0 * Math.pow(1 + inp.rentInflation, (T - 1) / 12) : 0;
      const V = U * brokerageRate, W = U * inp.adminFeePct, X = U * inp.repairFundPct;
      // Y usa o offset do cronograma "pronto" ($C) — quirk da planilha, replicado
      const Y = U === 0 && S === 0 ? 0
        : U === 0 ? inp.iptuMonthly + inp.condoMonthly
        : vacProvision * Math.pow(1 + inp.rentInflation, (months[m - 1].offset - 1) / 12);
      const Z = S > 0 ? (sacAt(S)?.payment ?? 0) : 0;
      const AA = S > 0 ? (sacAt(S)?.balance ?? 0) : 0;
      const AB = incomeTax(inp, U, W);
      pm.push({
        netLev: U - (V + W + X + Y + Z + AB - R),                                // AC
        netCash: U - (V + W + X + Y + AB),                                       // AD
        adjBalance: AA,
      });
    }
    const ys = (pick: (r: typeof pm[number]) => number, y: number) =>
      exit < y + 1 ? 0 : sum(pm.slice(y * 12, y * 12 + 12).map(pick)) - (y === 9 ? inp.renovation10thYear : 0);
    const rC = Array.from({ length: YEARS }, (_, y) => ys(r => r.netCash, y));
    const rL = Array.from({ length: YEARS }, (_, y) => ys(r => r.netLev, y));
    const long = inp.buildMonths > 12;
    const costs = itbi + escritura + registro + inp.renovationCost;
    const levCost = itbi + registro + inp.appraisal + inp.renovationCost;
    const saleLevOffPlan = (y: number) => {
      if (exit !== y + 1) return 0;
      // 'excel': a planilha (11-Viabilidade L63:Q63) lê o saldo em J37, J49, … (mês 12·ano+18)
      // para saída antes do ano 15, e em J187 (mês 180) no ano 15 — inconsistência replicada p/ paridade.
      // 'adjusted': saldo correto do cronograma deslocado pela obra (coluna AA no mês de saída).
      const excelMonth = y + 1 === YEARS ? 180 : (y + 1) * 12 + 18;
      const bal = inp.offPlanBalanceMode === 'adjusted'
        ? (pm[(y + 1) * 12 - 1]?.adjBalance ?? 0)
        : (sacAt(excelMonth)?.balance ?? 0);
      return saleGross(y) - bal;
    };
    const fC = Array.from({ length: YEARS }, (_, y) =>
      (y === 0 ? (long ? -inp.propertyValue : -(costs + inp.propertyValue)) : y === 1 && long ? -costs : 0)
      + rC[y] + (exit === y + 1 ? saleGross(y) : 0));
    const fL = Array.from({ length: YEARS }, (_, y) =>
      (y === 0 && !long ? -levCost : y === 1 && long ? -levCost : 0) + rL[y] + saleLevOffPlan(y));
    offPlanCash = { ...summarize(fC, inp.costOfCapital, long), flows: fC, yields: [] };
    // 11-Viabilidade T62/T63 testam G18 (célula de TEXTO "Faça Você") em vez de G11: o teste é sempre falso,
    // então a planilha usa SEMPRE o ramo "2º aporte no ano 2". Replicado no modo "excel"; "adjusted" usa a regra correta.
    const levSecondBranch = inp.offPlanBalanceMode === "adjusted" ? long : true;
    offPlanLeveraged = { ...summarize(fL, inp.costOfCapital, levSecondBranch), flows: fL, yields: [] };
  }

  // ── KPIs de storytelling (sticky bar / micro-insights)
  const stabilized = months.find(r => r.rent > 0 && r.month > inp.renovationMonths + 12) ?? months[months.length - 1];
  const first = sched[0];
  const kpi = {
    noiMonthly: stabilized?.noi ?? 0,
    capRate: upfrontCash > 0 ? ((stabilized?.noi ?? 0) * 12) / upfrontCash : 0,
    ltv: inp.ltv,
    outOfPocket: upfrontLev,
    firstInstallment: first?.payment ?? 0,
    minIncome: (first?.payment ?? 0) / 0.3,                                      // K8 = G11/0,3
  };

  return {
    loan, downPayment, upfrontCash, upfrontLeveraged: upfrontLev, monthlyRent: rent0,
    marketValue, amortization: sched, months,
    annual: { rentCash, rentLeveraged: rentLev, saleCash, saleLeveraged: saleLev },
    cash, leveraged, offPlanCash, offPlanLeveraged, kpi,
  };
}

/** Valores-padrão = exemplo da planilha (11-Viabilidade). */
export const defaultInputs: ViabilityInputs = {
  propertyValue: 300000, ltv: 0.8, loanRateAnnual: 0.10, areaM2: 25,
  itbiPct: 0.03, escrituraPct: 0, registroPct: 0.02, appraisal: 1500,
  renovationCost: 50000, renovationMonths: 6,
  loanTermMonths: 420, amortization: 'SAC',
  offPlan: false, buildMonths: 12, incc: 0.04, offPlanDownPct: 0.1, offPlanInstallPct: 0.8, offPlanKeysPct: 0.1,
  businessModel: 'long_stay', monthlyRent: 3000, vacancyMonths: 2, brokerageMonths: 1, contractMonths: 18,
  adminFeePct: 0, repairFundPct: 0.05, iptuMonthly: 80, condoMonthly: 450, rentInflation: 0.05,
  shortStay: { dailyRate: 150, occupancy: 0.85, platformFeePct: 0.15, electricityGas: 100, internet: 100, other: 0 },
  appreciation: 0.05, renovation10thYear: 0, sellCommissionPct: 0, exitYear: 15, costOfCapital: 0.10,
  saleTaxRate: 0, taxRegime: 'PF', incomeTaxRate: 0.15,
};
