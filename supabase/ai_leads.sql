-- ZonixAssets AI chatbot lead storage
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.ai_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  whatsapp text,
  interest text,
  source text not null default 'store_chat',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'closed')),
  consent_text text,
  last_message text,
  conversation_excerpt jsonb not null default '[]'::jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_leads_has_contact check (
    nullif(trim(coalesce(email, '')), '') is not null
    or nullif(trim(coalesce(whatsapp, '')), '') is not null
  )
);

create index if not exists ai_leads_created_at_idx
  on public.ai_leads (created_at desc);

create index if not exists ai_leads_status_idx
  on public.ai_leads (status);

create index if not exists ai_leads_email_idx
  on public.ai_leads (lower(email))
  where email is not null;

create index if not exists ai_leads_whatsapp_idx
  on public.ai_leads (whatsapp)
  where whatsapp is not null;

alter table public.ai_leads enable row level security;

-- No anon/authenticated policies are created intentionally.
-- The storefront server writes leads using SUPABASE_SECRET_KEY,
-- and the owner-only admin API reads them using the same server-side key.
