# Análises Financeiras — módulos (Excel → app)

```
supabase/migrations/001_properties_analyses.sql   schema + RLS (rodar no SQL Editor)
.env.local.example                                 template (URL do projeto já preenchida)
src/lib/finance/engine.ts                          motor puro, paridade com a planilha
src/lib/format.ts                                  formatação pt-BR
src/lib/supabase/{client,types,mappers,repository}.ts
src/hooks/useFinancialCalculations.ts
src/components/ui/{CurrencyInput,PercentInput,IntegerInput,FormGrid}.tsx
src/components/layout/{ScenarioHeader,StickyKpiBar,MobileFab}.tsx
src/components/steps/{StepTabs,insights,AnalysisWorkspace}.tsx
tests/engine.parity.test.ts + golden.json          419 checks vs. Excel
docs/EXCEL_LOGIC.md                                mapa de fórmulas + achados
```

## Passos
1. Rode a migration no Supabase SQL Editor.
2. Copie `.env.local.example` → `.env.local` e cole a anon key.
3. Copie `src/` para o repositório (alias `@/*` → `src/*`). Tailwind v3 com `content` cobrindo `src/**/*.tsx`.
4. Troque o cálculo atual por `runViability` (ou delegue o hook existente a ele) e rode `npm run test:parity`.
5. Ligue `AnalysisWorkspace` a `repository.ts`: `onSaveProperty → saveProperty`, `onSaveAnalysis → saveAnalysis`.
