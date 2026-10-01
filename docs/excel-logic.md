# Lógica da planilha → motor do app

Fonte: `Escola de Imóveis – VDI – Planilha V2-2.3`. Implementação: `src/lib/finance/engine.ts`.
Validação: `npm run test:parity` — 419 verificações idênticas ao Excel em 5 cenários
(base, planta, planta com obra de 18 meses, saída no ano 10 com IR de venda, Airbnb).

## Mapa das abas

| Aba | O que faz | No código |
|---|---|---|
| 01-VP_VF | `VP = VF/(1+i)^n` e inverso | didático (não necessário no app) |
| 02-VPL | `NPV(taxa, fluxos 1..n) + fluxo 0` | `npv()` |
| 03-TIR / 03.1 | `IRR(fluxos)` | `irr()` |
| 04-ROI | `ROI = (Σ fluxos 1..n + fluxo0) / −fluxo0` · `Múltiplo = Σ fluxos 1..n / −fluxo0` | `summarize()` |
| 05-Payback | ano anterior + (−saldo acumulado anterior / fluxo do ano) | `payback()` |
| 06-CAPYield | `Cap = renda/custo à vista` · `Yield = (renda − parcela)/capital próprio` | `kpi.capRate`, `yields()` |
| 08-SAC / 09-PRICE | tabela de amortização; taxa mensal `(1+a)^(1/12)−1`; SAC: amort. = P/n; PRICE: `PMT`. Renda mínima = 1ª parcela / 0,30 | `buildAmortization()`, `kpi.minIncome` |
| 10 / 10.1 | Pesquisa de mercado (comparáveis de compra/locação, R$/m², adicionais do studio, cartório 5,5 %, seguro 1,3 %) | **não portado** (ver pendências) |
| 11 / 11.1 / 12 | **Motor de viabilidade** (mensal → anual → TIR/ROI/VPL, à vista e alavancado, pronto e planta) | `runViability()` |
| 13 / 14 | Orçamento de obra e fluxo realizado | **não portado** (ver pendências) |

## Motor mensal (11.1), por mês `m`

```
offset      = m < prazoReforma ? 0 : m − prazoReforma
aluguel     = offset>0 ? aluguel0 · (1+infl)^((offset−1)/12) : 0
corretagem  = aluguel · (mesesCorretagem / meses_contrato)
adm         = aluguel · adm%        fundoReparos = aluguel · fundo%
vacância    = aluguel==0 ? IPTU+Condomínio
                         : [(vacMeses·aluguel0 + (IPTU+Cond)·vacMeses) / meses_contrato] · (1+infl)^((offset−1)/12)
imposto PF  = (aluguel − adm) · IR           (PJ: aluguel · alíquota efetiva)
líq. à vista    = aluguel − (corretagem+adm+fundo+vacância+imposto)
líq. alavancado = líq. à vista − parcela
```

Anual: soma de 12 meses (ano 10 deduz `Reforma 10º ano`). Venda no ano de saída:
`V − (V·comissão + IRvenda·(V − preçoCompra))`, alavancado subtrai o saldo devedor do mês `12·ano`.
`V₁ = preço + reforma`; `Vₙ = Vₙ₋₁·(1+valorização)` (ou valor manual da linha 33).

Investimento inicial: à vista = `ITBI + escritura + registro + preço + reforma`;
alavancado = `entrada + ITBI + registro + avaliação + reforma`.

## Achados na planilha (pedem confirmação do professor)

1. **Escritura fora do custo alavancado** — `C43` não soma `D20` (escritura), mas `C36` (à vista) soma. Replicado.
   Só afeta o resultado se a escritura ≠ 0 (no exemplo é 0 %).
2. **Planta, saldo devedor na venda (L63:P63)** — as células apontam `J37, J49, J61…` (mês 30, 42, …),
   enquanto o ano 15 aponta `J187` (mês 180). Para saída antes do ano 15 o saldo vem do mês errado e usa o
   cronograma "pronto", não o deslocado pela obra (coluna `AA`). Modo `offPlanBalanceMode: 'excel'` (padrão) replica;
   `'adjusted'` usa o saldo correto.
3. **Planta, ROI/Múltiplo alavancado (T62/T63)** testam `G18` (texto "Faça Você") em vez de `G11`. O teste é sempre
   falso, então a planilha usa sempre o ramo "2º aporte no ano 2". Replicado no modo `excel`.
4. **Planta, vacância (coluna Y)** usa `$C` (offset do imóvel pronto) em vez de `$T`. Replicado.
5. **Datas dos cabeçalhos** pulam 2024 (`…2023, 2025, 2026`) nas abas didáticas — cosmético.
6. **Airbnb**: `K10` não recebe `K30` automaticamente ("usar para calcular aluguel"). No app, `businessModel =
   'short_stay'` usa `K30` como aluguel; mantenha `vacancyMonths = 0` para não contar vacância duas vezes.
7. **Limpeza**: a planilha assume a limpeza paga pela taxa de limpeza (J31) — `cleaning_fee` é só informativo.

## PF × PJ

A planilha **não tem** regime PJ: só `IR Renda` (15 %) sobre `aluguel − administração`. Portanto:
- **PF** = paridade exata com a planilha (nenhuma dedução além da administração).
- **PJ** = alíquota efetiva sobre a Receita Bruta (novo, definido no seu briefing).
Se PF deve deduzir mais custos operacionais diretos (condomínio, IPTU, etc.), isso é regra tributária nova e deve
ser validada por contador antes de entrar no motor.

## Divergências entre o seu briefing e a planilha (schema ajustado)

- `vacancy_rate` → a planilha usa **meses de vacância por contrato** (`vacancy_months`) + `contract_months`.
- `loan_term_years` → a planilha trabalha em **meses** (420) → `loan_term_months`.
- Faltavam campos que o cálculo exige: ITBI/escritura/registro, avaliação, reforma e prazo, corretagem, fundo de
  reparos, inflação do aluguel, INCC/planta, comissão e IR de venda, ano de saída, custo de capital, alíquota de IR.
- `down_payment` e `loan_amount` são derivados (LTV × preço); ficam como cache para listagens.

## Pendências (não portado)

- Abas 10/10.1 (pesquisa de comparáveis) e 13/14 (orçamento de obra, fluxo realizado): são ferramentas de
  coleta/controle, não alimentam a viabilidade. Dá para virar tabelas próprias (`comparables`, `budget_items`).
- "VPL Comparado" (`T47`/`T65`) e yields da planta (linhas 58/65).
