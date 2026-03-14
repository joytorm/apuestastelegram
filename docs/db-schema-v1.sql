-- ApuestasTelegram MVP - DB Schema v1
-- Fecha: 2026-03-14
-- Objetivo: esquema mínimo para ingesta, revisión y distribución de tips

begin;

-- Extensiones recomendadas
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =========================
-- ENUMS
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tip_status') then
    create type public.tip_status as enum (
      'pending',
      'approved',
      'rejected',
      'distributed',
      'settled'
    );
  end if;
end $$;

-- =========================
-- TABLAS
-- =========================

-- Admins de la aplicación (controlados por auth.users)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Tipsters/fuentes monitorizadas
create table if not exists public.tipsters (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'telegram' check (source_type in ('telegram','email','web')),
  source_channel_id text,
  source_channel_name text,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_channel_id)
);

-- Eventos deportivos canónicos (MVP: simples)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  competition text,
  home_team text,
  away_team text,
  starts_at timestamptz,
  event_key text,
  created_at timestamptz not null default now(),
  unique (event_key)
);

-- Tips parseados + trazabilidad completa
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),

  -- Relación fuente
  tipster_id uuid references public.tipsters(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,

  -- Origen (deduplicación)
  source_type text not null default 'telegram' check (source_type in ('telegram','email','web')),
  source_channel_id text,
  source_channel_name text,
  source_message_id text,
  source_timestamp timestamptz,
  source_content_type text not null default 'text' check (source_content_type in ('text','image','mixed')),
  source_raw_text text,
  source_raw_payload jsonb not null default '{}'::jsonb,
  source_content_hash text,

  -- Parse estructurado
  sport text,
  event text,
  market_type text,
  selection text,
  odds numeric(8,3),
  stake numeric(8,2),
  bookmaker text,
  parse_confidence numeric(5,4),
  parser_model text,
  parser_version text,
  parse_error text,

  -- Workflow
  status public.tip_status not null default 'pending',
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  -- Distribución
  distributed_at timestamptz,
  distribution_channel_id text,
  distribution_message_id text,

  -- Liquidación (reservado para siguiente fase)
  settlement_result text,
  settlement_profit_units numeric(10,2),
  settled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Reglas
  constraint tips_odds_positive check (odds is null or odds > 1),
  constraint tips_stake_non_negative check (stake is null or stake >= 0),
  constraint tips_parse_confidence_range check (
    parse_confidence is null or (parse_confidence >= 0 and parse_confidence <= 1)
  )
);

-- Dedupe por mensaje Telegram (si existe)
create unique index if not exists tips_source_telegram_unique
on public.tips (source_channel_id, source_message_id)
where source_type = 'telegram' and source_channel_id is not null and source_message_id is not null;

-- Subscriptores (preparado para monetización)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint,
  telegram_username text,
  access_status text not null default 'inactive' check (access_status in ('inactive','active','past_due','canceled')),
  plan_id text,
  current_period_end timestamptz,

  provider text,
  provider_customer_id text,
  provider_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (telegram_user_id),
  unique (provider, provider_subscription_id)
);

-- =========================
-- ÍNDICES
-- =========================
create index if not exists tips_status_created_idx on public.tips(status, created_at desc);
create index if not exists tips_tipster_idx on public.tips(tipster_id, created_at desc);
create index if not exists tips_event_idx on public.tips(event_id);
create index if not exists tips_source_hash_idx on public.tips(source_content_hash);
create index if not exists tips_source_ts_idx on public.tips(source_timestamp desc);
create index if not exists subscribers_access_status_idx on public.subscribers(access_status);

-- Búsqueda fuzzy básica (útil para matching manual inicial)
create index if not exists events_home_team_trgm_idx on public.events using gin (home_team gin_trgm_ops);
create index if not exists events_away_team_trgm_idx on public.events using gin (away_team gin_trgm_ops);

-- =========================
-- TRIGGERS (updated_at)
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tipsters_updated_at on public.tipsters;
create trigger trg_tipsters_updated_at
before update on public.tipsters
for each row execute function public.set_updated_at();

drop trigger if exists trg_tips_updated_at on public.tips;
create trigger trg_tips_updated_at
before update on public.tips
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscribers_updated_at on public.subscribers;
create trigger trg_subscribers_updated_at
before update on public.subscribers
for each row execute function public.set_updated_at();

-- =========================
-- RLS (solo admin)
-- =========================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.tipsters enable row level security;
alter table public.events enable row level security;
alter table public.tips enable row level security;
alter table public.subscribers enable row level security;

-- Limpieza por idempotencia
drop policy if exists admin_users_admin_only on public.admin_users;
drop policy if exists tipsters_admin_only on public.tipsters;
drop policy if exists events_admin_only on public.events;
drop policy if exists tips_admin_only on public.tips;
drop policy if exists subscribers_admin_only on public.subscribers;

create policy admin_users_admin_only on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tipsters_admin_only on public.tipsters
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy events_admin_only on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tips_admin_only on public.tips
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy subscribers_admin_only on public.subscribers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;
