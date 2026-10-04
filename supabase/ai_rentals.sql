-- ZonixAssets AI rental onboarding
-- Run once in Supabase SQL Editor before enabling the AI rental product type.

create extension if not exists pgcrypto;

create table if not exists public.ai_rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,

  business_name text,
  website_url text,
  logo_url text,
  brand_color text not null default '#1d4ed8',
  allowed_origin text,
  welcome_message text,
  system_prompt text,

  lead_capture_enabled boolean not null default true,
  lead_goal text,
  monthly_quota integer not null default 1000 check (monthly_quota > 0),

  status text not null default 'PENDING_SETUP'
    check (status in ('PENDING_SETUP','READY_FOR_PROVISIONING','ACTIVE','SUSPENDED','EXPIRED')),

  gm_client_name text,
  gm_client_slug text,
  gm_api_key text,
  gm_embed_code text,
  gm_api_endpoint text not null default 'https://gm-ai-boss.lovable.app/api/public/client-chat',

  expires_at timestamptz,
  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_rentals_user_id_idx
  on public.ai_rentals(user_id);

create index if not exists ai_rentals_status_idx
  on public.ai_rentals(status);

alter table public.ai_rentals enable row level security;

-- Explicit table privileges are required in addition to RLS policies.
-- Customer requests use the authenticated role, while server-side
-- provisioning/admin requests use the service_role role.
revoke all on table public.ai_rentals from anon;
grant select, update on table public.ai_rentals to authenticated;
grant select, insert, update, delete on table public.ai_rentals to service_role;

drop policy if exists "Users can view own AI rentals" on public.ai_rentals;
create policy "Users can view own AI rentals"
on public.ai_rentals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own AI rental setup" on public.ai_rentals;
create policy "Users can update own AI rental setup"
on public.ai_rentals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_ai_rentals_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_rentals_set_updated_at on public.ai_rentals;
create trigger ai_rentals_set_updated_at
before update on public.ai_rentals
for each row
execute function public.set_ai_rentals_updated_at();

comment on table public.ai_rentals is
'Paid AI rental onboarding and manual GM AI provisioning state for ZonixAssets.';
