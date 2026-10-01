-- ============================================================================
-- Análises Financeiras — Schema v1 (1 Imóvel → N Cenários de Análise)
-- Executar no Supabase SQL Editor. Idempotente para re-execução em dev.
-- Convenção: percentuais armazenados como FRAÇÃO (0.15 = 15%), igual ao motor TS.
-- Cada coluna aponta a célula de origem na planilha (aba 11-Viabilidade).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── helper: updated_at ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
-- 1) properties — Imóvel (ativo pai)
-- ============================================================================
create table if not exists public.properties (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title            text not null,                                   -- "Apto Pinheiros 2Q"
  property_type    text not null default 'Pronto/Usado'
                   check (property_type in ('Pronto/Usado', 'Na Planta')),   -- G10 "Sim"/"Não"
  address          text,
  city_neighborhood text,
  usable_area      numeric(10,2) check (usable_area is null or usable_area >= 0),  -- C13 (m²)
  bedrooms         int  check (bedrooms      is null or bedrooms      >= 0),
  suites           int  check (suites        is null or suites        >= 0),
  parking_spots    int  check (parking_spots is null or parking_spots >= 0),
  asking_price     numeric(14,2) check (asking_price is null or asking_price >= 0), -- C10
  condo_fee        numeric(12,2) default 0 check (condo_fee    >= 0),               -- K17
  iptu_monthly     numeric(12,2) default 0 check (iptu_monthly >= 0),               -- K16
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists properties_user_idx on public.properties (user_id, created_at desc);
drop trigger if exists trg_properties_updated on public.properties;
create trigger trg_properties_updated before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2) analyses — Cenário de análise (filho)
-- ============================================================================
create table if not exists public.analyses (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid not null references public.properties(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade default auth.uid(),
  scenario_name    text not null,                                   -- "Cenário 1: Airbnb PJ"
  business_model   text not null default 'Long Stay'
                   check (business_model in ('Short Stay', 'Long Stay')),
  tax_regime       text not null default 'PF' check (tax_regime in ('PF', 'PJ')),

  -- Compra (C10:C24) — preço de compra pode divergir do preço pedido
  purchase_price          numeric(14,2) not null check (purchase_price >= 0),   -- C10
  itbi_pct                numeric(7,5)  not null default 0.03,                  -- C19
  escritura_pct           numeric(7,5)  not null default 0,                     -- C20
  registro_pct            numeric(7,5)  not null default 0.02,                  -- C21
  appraisal_cost          numeric(12,2) not null default 0,                     -- C22
  renovation_cost         numeric(14,2) not null default 0,                     -- C23
  renovation_months       int           not null default 0 check (renovation_months >= 0), -- C24

  -- Financiamento
  down_payment            numeric(14,2),                                        -- derivado (C15) — cache p/ listagens
  loan_amount             numeric(14,2),                                        -- derivado (C14) — cache
  ltv                     numeric(7,5)  not null default 0.8 check (ltv between 0 and 1), -- C11
  interest_rate_annual    numeric(7,5)  not null default 0.10,                  -- C12
  loan_term_months        int           not null default 420 check (loan_term_months between 1 and 420), -- E8
  amortization_system     text          not null default 'SAC' check (amortization_system in ('SAC','PRICE')),

  -- Planta (G10:G22)
  off_plan_build_months   int           not null default 12,                    -- G11
  incc_annual             numeric(7,5)  not null default 0.04,                  -- G12
  off_plan_down_pct       numeric(7,5)  not null default 0.10,                  -- G19
  off_plan_install_pct    numeric(7,5)  not null default 0.80,                  -- G20
  off_plan_keys_pct       numeric(7,5)  not null default 0.10,                  -- G21

  -- Locação tradicional (K10:K17, O10)
  monthly_rent            numeric(12,2) not null default 0,                     -- K10
  vacancy_months          numeric(5,2)  not null default 0,                     -- K11 (meses vagos por contrato)
  brokerage_months        numeric(5,2)  not null default 0,                     -- K12
  contract_months         int           not null default 12 check (contract_months > 0), -- K13
  admin_fee_pct           numeric(7,5)  not null default 0,                     -- K14
  repair_fund_pct         numeric(7,5)  not null default 0,                     -- K15
  rent_inflation_annual   numeric(7,5)  not null default 0.05,                  -- O10

  -- Short stay / Airbnb (K22:K27)
  daily_rate              numeric(12,2),                                        -- K22
  occupancy_rate          numeric(7,5)  check (occupancy_rate is null or occupancy_rate between 0 and 1), -- K23
  platform_fee            numeric(7,5),                                         -- K24 (Administrador/plataforma)
  cleaning_fee            numeric(12,2),                                        -- informativo: a planilha assume limpeza paga pela taxa de limpeza
  electricity_gas         numeric(12,2) default 0,                              -- K25
  internet_cost           numeric(12,2) default 0,                              -- K26
  other_costs             numeric(12,2) default 0,                              -- K27

  -- Venda e mercado (N10:O17)
  appreciation_rate_annual numeric(7,5) not null default 0.05,                  -- O11
  renovation_year10        numeric(14,2) not null default 0,                    -- O12
  sell_commission_pct      numeric(7,5)  not null default 0,                    -- O13
  exit_year                int           not null default 15 check (exit_year between 1 and 15), -- O14
  cost_of_capital          numeric(7,5)  not null default 0.10,                 -- O15
  income_tax_rate          numeric(7,5)  not null default 0.15,                 -- O16 (PF: s/ aluguel−adm | PJ: s/ receita bruta)
  sale_tax_rate            numeric(7,5)  not null default 0,                    -- O17
  market_value_overrides   jsonb         not null default '[]'::jsonb,          -- C33:Q33

  -- Resultado calculado (snapshot para dashboards/listagens; o motor TS é a fonte da verdade)
  results_snapshot         jsonb,
  results_engine_version    text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists analyses_property_idx on public.analyses (property_id, created_at);
create index if not exists analyses_user_idx     on public.analyses (user_id);
drop trigger if exists trg_analyses_updated on public.analyses;
create trigger trg_analyses_updated before update on public.analyses
  for each row execute function public.set_updated_at();

-- Garante que o cenário e o imóvel pertencem ao mesmo usuário (defesa além do RLS)
create or replace function public.analyses_enforce_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.properties p where p.id = new.property_id and p.user_id = new.user_id) then
    raise exception 'property_id não pertence ao user_id informado';
  end if;
  return new;
end $$;

drop trigger if exists trg_analyses_owner on public.analyses;
create trigger trg_analyses_owner before insert or update of property_id, user_id on public.analyses
  for each row execute function public.analyses_enforce_owner();

-- ============================================================================
-- 3) Row Level Security
-- ============================================================================
alter table public.properties enable row level security;
alter table public.analyses   enable row level security;

drop policy if exists "properties_select_own" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
drop policy if exists "properties_delete_own" on public.properties;

create policy "properties_select_own" on public.properties
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "properties_insert_own" on public.properties
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "properties_update_own" on public.properties
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "properties_delete_own" on public.properties
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_update_own" on public.analyses;
drop policy if exists "analyses_delete_own" on public.analyses;

create policy "analyses_select_own" on public.analyses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "analyses_insert_own" on public.analyses
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.properties p where p.id = property_id and p.user_id = (select auth.uid()))
  );
create policy "analyses_update_own" on public.analyses
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "analyses_delete_own" on public.analyses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Nada é exposto ao papel anônimo
revoke all on public.properties from anon;
revoke all on public.analyses   from anon;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.analyses   to authenticated;
