// ============================================================
// Financial calculations — VIR 1.1 methodology
// ============================================================

export interface AnalysisInput {
  // Block 1 - Property
  propertyStatus: 'ready' | 'under_construction';
  city: string;
  propertyType: string;
  area: number;
  bedrooms: number;
  suites: number;
  parkingSpots: number;
  constructionYear: string;
  finishingStandard: string;
  // Only for ready
  needsRenovation: boolean;
  renovationMonths: number;
  // Only for under_construction
  deliveryMonths: number;

  // Block 2 - Purchase
  propertyValue: number;
  downPayment: number;
  downPaymentPct: boolean;
  installmentsCount: number;
  installmentValue: number;
  inccRate: number;
  acquisitionCosts: number; // ITBI, cartório
  renovationCosts: number;

  // Block 3 - Financing
  acquisitionType: 'financiamento' | 'consorcio' | 'avista';
  financingType?: 'associativo' | 'pos-chaves';
  financedValue: number;
  annualInterestRate: number;
  correctionRate: number;
  insuranceAdminRate: number;
  financingTermMonths: number;
  amortizationType: 'SAC' | 'PRICE';
  creditLetterValue?: number;
  consortiumTermMonths?: number;
  adminFeeRate?: number;
  reserveFundRate?: number;
  bid?: number;
  consortiumInccRate?: number;

  // Block 4 - Income
  rentalType: 'tradicional' | 'airbnb' | 'misto';
  monthlyRent: number;
  tenantPaysCondo: boolean;
  tenantPaysIPTU: boolean;
  avgContractMonths: number;
  vacancyMonths: number;
  maintenancePct: number;
  avgDailyRate: number;
  cleaningFee: number;
  occupancyRate: number;
  avgBookingsPerMonth: number;
  adminPct: number;
  platformPct: number;
  cleaningCostPerStay: number;
  insurancePct: number;
  monthlyIPTU: number;
  monthlyCondo: number;
  airbnbMaintenancePct: number;

  // Block 5 - Appreciation
  purchasedBelowMarket: boolean;
  marketDiscount: number;
  valueAfterRenovation: number;
  annualAppreciation: number;
  annualRentGrowth: number;
  analysisYears: number;

  // Block 6 - Investor
  investorType: 'PF' | 'PJ';
  rentalTaxRate: number;
  capitalGainsTaxRate: number;
  targetYield: number;
  opportunityCostRate: number;
  cashDestination: 'reinvestir' | 'amortizar';
  reinvestRate: number;
}

export interface MonthlyInstallment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AnnualProjection {
  year: number;
  propertyValue: number;
  grossRent: number;    // aluguel bruto
  opExpenses: number;   // despesas operacionais (sem impostos, sem financiamento)
  taxes: number;        // IR sobre renda
  netRent: number;      // NOI verdadeiro (antes de impostos)
  afterTaxNOI: number;  // NOI após impostos (antes de financiamento)
  financing: number;    // parcelas de financiamento no ano
  cashFlow: number;     // fluxo de caixa líquido (após IR e financiamento)
  cumulativeCashFlow: number;
  equity: number;
  // legacy alias
  expenses: number;     // = opExpenses + taxes (para compatibilidade com tabela)
}

export interface AnalysisResults {
  totalInvested: number;
  ownCapital: number;
  financedAmount: number;
  totalAcquisitionCost: number;
  inccCorrection: number;
  debtBalance: number;
  ltv: number;

  // Key metrics
  roi: number;
  irr: number;
  npv: number;
  paybackYears: number;
  capRate: number;    // NOI anual / totalAcquisitionCost (sem impostos, sem financiamento)
  netYield: number;   // (NOI - financiamento - IR) / capitalPróprio
  cashOnCash: number; // (NOI - financiamento) / capitalPróprio (antes de IR)

  // Monthly
  monthlyGrossRent: number;
  monthlyNOI: number;         // NOI bruto (sem IR, sem financiamento)
  monthlyNetRent: number;     // NOI após IR (sem financiamento)
  monthlyFinancingPayment: number;
  monthlyCashFlow: number;    // após IR e financiamento

  annualProjections: AnnualProjection[];
  cashFlows: number[];
  financingSchedule: MonthlyInstallment[];

  stressResults: {
    baseCase: { irr: number; npv: number };
    constructionOverrun: { irr: number; npv: number; label: string };
    rentDrop10: { irr: number; npv: number };
    rentDrop20: { irr: number; npv: number };
    rentDrop30: { irr: number; npv: number };
  };

  viable: boolean;
  viabilityLabel: string;
  propertyStatus: 'ready' | 'under_construction';
}

// ---- Helpers ----

function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

function calcInccBalance(
  initialBalance: number,
  monthlyInccRate: number,
  installment: number,
  months: number,
): number {
  let balance = initialBalance;
  for (let m = 0; m < months; m++) {
    balance = balance * (1 + monthlyInccRate) - installment;
  }
  return Math.max(balance, 0);
}

function calcSAC(
  principal: number,
  annualInterest: number,
  correctionAnnual: number,
  insuranceAdmin: number,
  months: number,
): MonthlyInstallment[] {
  const schedule: MonthlyInstallment[] = [];
  const r = monthlyRate(annualInterest + correctionAnnual);
  const ins = insuranceAdmin / 100 / 12;
  const monthlyPrincipal = principal / months;
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const insurance = balance * ins;
    const payment = monthlyPrincipal + interest + insurance;
    balance = Math.max(balance - monthlyPrincipal, 0);
    schedule.push({ month: m, payment, principal: monthlyPrincipal, interest, balance });
  }
  return schedule;
}

function calcPRICE(
  principal: number,
  annualInterest: number,
  correctionAnnual: number,
  insuranceAdmin: number,
  months: number,
): MonthlyInstallment[] {
  const schedule: MonthlyInstallment[] = [];
  const r = monthlyRate(annualInterest + correctionAnnual);
  const ins = insuranceAdmin / 100 / 12;
  const pmt = r > 0 ? (principal * r) / (1 - Math.pow(1 + r, -months)) : principal / months;
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPmt = pmt - interest;
    const insurance = balance * ins;
    balance = Math.max(balance - principalPmt, 0);
    schedule.push({ month: m, payment: pmt + insurance, principal: principalPmt, interest, balance });
  }
  return schedule;
}

// VIR 1.1: Newton-Raphson IRR with clamping and convergence guard
function calcIRR(cashFlows: number[]): number {
  const hasNeg = cashFlows.some((cf) => cf < 0);
  const hasPos = cashFlows.some((cf) => cf > 0);
  if (!hasNeg || !hasPos) return 0;

  function npvAt(r: number): number {
    return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  }
  function dnpvAt(r: number): number {
    return cashFlows.reduce((acc, cf, t) => acc - (t * cf) / ((1 + r) * Math.pow(1 + r, t)), 0);
  }

  // Try multiple starting guesses, return the best-converging result
  const guesses = [0.08, 0.12, 0.15, 0.2, 0.05, 0.25];
  let best: number | null = null;
  let bestResidual = Infinity;

  for (const guess of guesses) {
    let rate = guess;
    let converged = false;
    for (let iter = 0; iter < 300; iter++) {
      const npv = npvAt(rate);
      const d = dnpvAt(rate);
      if (Math.abs(d) < 1e-12) break;
      const delta = npv / d;
      rate = Math.max(-0.5, Math.min(5, rate - delta));
      if (Math.abs(delta) < 1e-9) { converged = true; break; }
    }
    if (!converged) continue;
    if (!isFinite(rate) || rate < -0.5 || rate > 5) continue;
    const residual = Math.abs(npvAt(rate));
    if (residual < bestResidual) {
      bestResidual = residual;
      best = rate;
    }
  }

  // Sanity: residual must be small relative to investment
  const scale = Math.abs(cashFlows[0]) || 1;
  if (best === null || bestResidual > scale * 0.01) return 0;
  return best;
}

function calcNPV(cashFlows: number[], discountRatePct: number): number {
  const r = discountRatePct / 100;
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
}

// ---- Gross rent helpers ----

function calcMonthlyGrossRent(inp: AnalysisInput): number {
  if (inp.rentalType === 'tradicional') {
    const total = Math.max(inp.avgContractMonths + inp.vacancyMonths, 1);
    const vacancyFactor = 1 - inp.vacancyMonths / total;
    return inp.monthlyRent * vacancyFactor;
  } else if (inp.rentalType === 'airbnb') {
    const daysOccupied = 30 * (inp.occupancyRate / 100);
    const avgBookings = Math.max(inp.avgBookingsPerMonth, 1);
    const cleaningPerDay = inp.cleaningFee / Math.max(daysOccupied / avgBookings, 1);
    return (inp.avgDailyRate + cleaningPerDay) * daysOccupied;
  } else {
    // misto: average of both
    const total = Math.max(inp.avgContractMonths + inp.vacancyMonths, 1);
    const trad = inp.monthlyRent * (1 - inp.vacancyMonths / total);
    const airbnb = inp.avgDailyRate * 30 * (inp.occupancyRate / 100);
    return (trad + airbnb) / 2;
  }
}

// VIR 1.1: Operating expenses — excludes income taxes and financing
function calcMonthlyOpExpenses(inp: AnalysisInput, grossRent: number): number {
  if (inp.rentalType === 'tradicional') {
    let exp = grossRent * (inp.maintenancePct / 100 / 12);
    if (!inp.tenantPaysCondo) exp += inp.monthlyCondo;
    if (!inp.tenantPaysIPTU) exp += inp.monthlyIPTU;
    return exp;
  } else if (inp.rentalType === 'airbnb') {
    const adminCost = grossRent * (inp.adminPct / 100);
    const platformCost = grossRent * (inp.platformPct / 100);
    const cleaningCost = inp.cleaningCostPerStay * inp.avgBookingsPerMonth;
    const insurance = grossRent * (inp.insurancePct / 100);
    const maintenance = grossRent * (inp.airbnbMaintenancePct / 100 / 12);
    return adminCost + platformCost + cleaningCost + insurance + maintenance + inp.monthlyIPTU + inp.monthlyCondo;
  } else {
    // misto: blend
    const tradShare = grossRent / 2;
    const tradExp = tradShare * (inp.maintenancePct / 100 / 12)
      + (!inp.tenantPaysCondo ? inp.monthlyCondo / 2 : 0)
      + (!inp.tenantPaysIPTU ? inp.monthlyIPTU / 2 : 0);
    const airbnbShare = grossRent / 2;
    const airbnbExp = airbnbShare * (inp.adminPct / 100)
      + airbnbShare * (inp.platformPct / 100)
      + inp.cleaningCostPerStay * inp.avgBookingsPerMonth / 2
      + airbnbShare * (inp.airbnbMaintenancePct / 100 / 12)
      + (inp.monthlyIPTU + inp.monthlyCondo) / 2;
    return tradExp + airbnbExp;
  }
}

// VIR 1.1: True NOI = Gross - Operating Expenses (before income tax and financing)
function calcMonthlyNOI(inp: AnalysisInput, grossRent: number): number {
  return grossRent - calcMonthlyOpExpenses(inp, grossRent);
}

// ---- Core projection engine (no stress tests, used by stress callers) ----

function computeProjection(inp: AnalysisInput): {
  totalInvested: number; ownCapital: number; financedAmount: number;
  totalAcquisitionCost: number; inccCorrection: number; debtBalance: number; ltv: number;
  roi: number; irr: number; npv: number; paybackYears: number;
  capRate: number; netYield: number; cashOnCash: number;
  monthlyGrossRent: number; monthlyNOI: number; monthlyNetRent: number;
  monthlyFinancingPayment: number; monthlyCashFlow: number;
  annualProjections: AnnualProjection[]; cashFlows: number[];
  financingSchedule: MonthlyInstallment[];
  viable: boolean; viabilityLabel: string;
} {
  // ---- Own capital ----
  const downPaymentValue = inp.downPaymentPct
    ? inp.propertyValue * (inp.downPayment / 100)
    : inp.downPayment;

  const initialBalance = Math.max(inp.propertyValue - downPaymentValue, 0);
  const inccMonthly = monthlyRate(inp.inccRate);

  const inccBalance = inp.acquisitionType === 'avista'
    ? 0
    : calcInccBalance(initialBalance, inccMonthly, inp.installmentValue, inp.installmentsCount);

  // INCC premium = extra debt incurred vs naive outstanding principal
  const naivePrincipalAfterInstallments = Math.max(
    initialBalance - inp.installmentValue * inp.installmentsCount,
    0,
  );
  const inccCorrection = Math.max(0, inccBalance - naivePrincipalAfterInstallments);

  // VIR 1.1: Total Acquisition Cost = preço + ITBI/cartório + reforma + INCC acumulado
  const totalAcquisitionCost =
    inp.propertyValue + inp.acquisitionCosts + inp.renovationCosts + inccCorrection;

  let financedAmount = 0;
  let debtBalance = 0;

  if (inp.acquisitionType === 'financiamento') {
    financedAmount = inp.financedValue > 0 ? inp.financedValue : inccBalance;
    debtBalance = financedAmount;
  } else if (inp.acquisitionType === 'consorcio') {
    financedAmount = inp.creditLetterValue ?? 0;
    debtBalance = financedAmount;
  }

  // VIR 1.1: Capital Próprio = Entrada + ITBI + Reforma + aportes não financiados
  const ownCapital = Math.max(totalAcquisitionCost - financedAmount, 0);
  const totalInvested = totalAcquisitionCost;
  const ltv = inp.propertyValue > 0 ? (financedAmount / inp.propertyValue) * 100 : 0;

  // ---- Financing schedule ----
  let financingSchedule: MonthlyInstallment[] = [];
  if (inp.acquisitionType === 'financiamento' && financedAmount > 0) {
    financingSchedule = inp.amortizationType === 'SAC'
      ? calcSAC(financedAmount, inp.annualInterestRate, inp.correctionRate, inp.insuranceAdminRate, inp.financingTermMonths)
      : calcPRICE(financedAmount, inp.annualInterestRate, inp.correctionRate, inp.insuranceAdminRate, inp.financingTermMonths);
  }

  const monthlyFinancingPayment = financingSchedule.length > 0 ? financingSchedule[0].payment : 0;

  // ---- Monthly income ----
  const grossRent = calcMonthlyGrossRent(inp);
  const monthlyOpEx = calcMonthlyOpExpenses(inp, grossRent);
  const monthlyNOI = calcMonthlyNOI(inp, grossRent); // before taxes
  const monthlyTax = Math.max(0, monthlyNOI) * (inp.rentalTaxRate / 100);
  const monthlyNetRent = monthlyNOI - monthlyTax; // after taxes, before financing
  const monthlyCashFlow = monthlyNetRent - monthlyFinancingPayment;

  // VIR 1.1: Cap Rate = Annual NOI (before taxes) / Total Acquisition Cost
  const capRate = totalAcquisitionCost > 0 ? (monthlyNOI * 12 / totalAcquisitionCost) * 100 : 0;

  // VIR 1.1: Yield Líquido = (Annual NOI − Annual Financing − Annual Taxes) / Capital Próprio
  const netYield = ownCapital > 0 ? (monthlyCashFlow * 12 / ownCapital) * 100 : 0;

  // Cash on Cash = (Annual NOI − Annual Financing) / Capital Próprio (antes de IR — retorno de caixa puro)
  const cashOnCash = ownCapital > 0 ? (monthlyNetRent * 12 / ownCapital) * 100 : 0;

  // ---- Annual projections ----
  const annualProjections: AnnualProjection[] = [];
  const cashFlows: number[] = [-ownCapital];
  let cumulativeCashFlow = -ownCapital;
  let currentPropertyValue = inp.valueAfterRenovation > 0 ? inp.valueAfterRenovation : inp.propertyValue;
  let currentMonthlyGross = grossRent;
  let remainingDebt = debtBalance;

  for (let y = 1; y <= inp.analysisYears; y++) {
    currentPropertyValue *= 1 + inp.annualAppreciation / 100;
    currentMonthlyGross *= 1 + inp.annualRentGrowth / 100;

    // Scale airbnb daily rate with rent growth
    const yearInp: AnalysisInput = {
      ...inp,
      monthlyRent: currentMonthlyGross,
      avgDailyRate: inp.avgDailyRate * Math.pow(1 + inp.annualRentGrowth / 100, y),
    };

    const annualGross = currentMonthlyGross * 12;
    const annualOpEx = calcMonthlyOpExpenses(yearInp, currentMonthlyGross) * 12;
    const annualNOI = annualGross - annualOpEx; // true NOI this year
    const annualTax = Math.max(0, annualNOI) * (inp.rentalTaxRate / 100);
    const annualAfterTaxNOI = annualNOI - annualTax;

    // Use actual financing payments from schedule for this year
    const startM = (y - 1) * 12;
    const endM = Math.min(y * 12, financingSchedule.length);
    let annualFinancing = 0;
    for (let m = startM; m < endM; m++) {
      annualFinancing += financingSchedule[m].payment;
    }

    // Update remaining debt to end-of-year balance
    if (endM > startM && financingSchedule.length > 0) {
      remainingDebt = financingSchedule[endM - 1].balance;
    } else if (y * 12 >= inp.financingTermMonths) {
      remainingDebt = 0;
    }

    const equity = currentPropertyValue - remainingDebt;
    const annualCashFlow = annualAfterTaxNOI - annualFinancing;
    cumulativeCashFlow += annualCashFlow;

    annualProjections.push({
      year: y,
      propertyValue: currentPropertyValue,
      grossRent: annualGross,
      opExpenses: annualOpEx,
      taxes: annualTax,
      netRent: annualNOI,        // true NOI (before taxes)
      afterTaxNOI: annualAfterTaxNOI,
      financing: annualFinancing,
      cashFlow: annualCashFlow,
      cumulativeCashFlow,
      equity,
      expenses: annualOpEx + annualTax, // legacy: total deductions from gross
    });

    // IRR: last year includes property sale proceeds net of debt and capital gains tax
    if (y === inp.analysisYears) {
      const gain = Math.max(0, currentPropertyValue - inp.propertyValue);
      const capitalGainsTax = gain * (inp.capitalGainsTaxRate / 100);
      const saleNet = currentPropertyValue - remainingDebt - capitalGainsTax;
      cashFlows.push(annualCashFlow + saleNet);
    } else {
      cashFlows.push(annualCashFlow);
    }
  }

  // ---- IRR and NPV ----
  const irrDecimal = ownCapital > 0 ? calcIRR(cashFlows) : 0;
  const irr = irrDecimal * 100;
  const npv = calcNPV(cashFlows, inp.opportunityCostRate);

  // ---- ROI ----
  const finalProjection = annualProjections[annualProjections.length - 1];
  const totalReturn =
    annualProjections.reduce((s, p) => s + p.cashFlow, 0) +
    (finalProjection?.propertyValue ?? inp.propertyValue) - ownCapital;
  const roi = ownCapital > 0 ? (totalReturn / ownCapital) * 100 : 0;

  // ---- Payback ----
  let paybackYears = Infinity;
  for (const proj of annualProjections) {
    if (proj.cumulativeCashFlow >= 0) { paybackYears = proj.year; break; }
  }

  const viable = irr >= inp.targetYield && npv > 0;
  const viabilityLabel =
    irr >= 18 ? 'Excelente' :
    irr >= 14 ? 'Boa' :
    irr >= inp.targetYield ? 'Adequada' : 'Abaixo da meta';

  return {
    totalInvested,
    ownCapital,
    financedAmount,
    totalAcquisitionCost,
    inccCorrection,
    debtBalance,
    ltv,
    roi,
    irr,
    npv,
    paybackYears,
    capRate,
    netYield,
    cashOnCash,
    monthlyGrossRent: grossRent,
    monthlyNOI,
    monthlyNetRent,
    monthlyFinancingPayment,
    monthlyCashFlow,
    annualProjections,
    cashFlows,
    financingSchedule,
    viable,
    viabilityLabel,
  };
}

// ---- Main analysis engine ----

export function runAnalysis(inp: AnalysisInput): AnalysisResults {
  const base = computeProjection(inp);

  // Stress tests — each runs full recalculation with modified inputs
  function stress(overrides: Partial<AnalysisInput>) {
    const r = computeProjection({ ...inp, ...overrides });
    return { irr: r.irr, npv: r.npv };
  }

  // Construction overrun label depends on property status
  const isReady = inp.propertyStatus === 'ready';
  const constructionOverrunResult = isReady
    ? stress({ renovationCosts: inp.renovationCosts * 1.2, acquisitionCosts: inp.acquisitionCosts * 1.1 })
    : stress({ propertyValue: inp.propertyValue * 1.2, inccRate: inp.inccRate * 1.3 });
  const constructionLabel = isReady ? '+20% custo de reforma' : '+20% custo de obra';

  return {
    ...base,
    stressResults: {
      baseCase: { irr: base.irr, npv: base.npv },
      constructionOverrun: { ...constructionOverrunResult, label: constructionLabel },
      rentDrop10: stress({ monthlyRent: inp.monthlyRent * 0.9, avgDailyRate: inp.avgDailyRate * 0.9 }),
      rentDrop20: stress({ monthlyRent: inp.monthlyRent * 0.8, avgDailyRate: inp.avgDailyRate * 0.8 }),
      rentDrop30: stress({ monthlyRent: inp.monthlyRent * 0.7, avgDailyRate: inp.avgDailyRate * 0.7 }),
    },
    propertyStatus: inp.propertyStatus,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export const defaultInput: AnalysisInput = {
  propertyStatus: 'ready',
  city: 'São Paulo, SP',
  propertyType: 'Apartamento',
  area: 65,
  bedrooms: 2,
  suites: 1,
  parkingSpots: 1,
  constructionYear: '2024',
  finishingStandard: 'Alto',
  needsRenovation: false,
  renovationMonths: 3,
  deliveryMonths: 24,
  propertyValue: 800000,
  downPayment: 20,
  downPaymentPct: true,
  installmentsCount: 24,
  installmentValue: 2000,
  inccRate: 6,
  acquisitionCosts: 32000,
  renovationCosts: 40000,
  acquisitionType: 'financiamento',
  financingType: 'pos-chaves',
  financedValue: 512000,
  annualInterestRate: 10.5,
  correctionRate: 3.5,
  insuranceAdminRate: 0.5,
  financingTermMonths: 360,
  amortizationType: 'SAC',
  creditLetterValue: 0,
  consortiumTermMonths: 120,
  adminFeeRate: 20,
  reserveFundRate: 2,
  bid: 0,
  consortiumInccRate: 6,
  rentalType: 'tradicional',
  monthlyRent: 4500,
  tenantPaysCondo: true,
  tenantPaysIPTU: true,
  avgContractMonths: 30,
  vacancyMonths: 1,
  maintenancePct: 1,
  avgDailyRate: 250,
  cleaningFee: 80,
  occupancyRate: 65,
  avgBookingsPerMonth: 6,
  adminPct: 20,
  platformPct: 3,
  cleaningCostPerStay: 120,
  insurancePct: 1,
  monthlyIPTU: 250,
  monthlyCondo: 600,
  airbnbMaintenancePct: 2,
  purchasedBelowMarket: false,
  marketDiscount: 0,
  valueAfterRenovation: 900000,
  annualAppreciation: 5,
  annualRentGrowth: 4,
  analysisYears: 10,
  investorType: 'PF',
  rentalTaxRate: 15,
  capitalGainsTaxRate: 15,
  targetYield: 10,
  opportunityCostRate: 12,
  cashDestination: 'reinvestir',
  reinvestRate: 0.8,
};
