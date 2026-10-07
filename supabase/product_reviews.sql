-- ZonixAssets verified product reviews
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null,
  reviewer_name text not null default 'Verified buyer',
  verified_purchase boolean not null default false,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_one_per_buyer unique (user_id, product_id),
  constraint product_reviews_title_length check (
    title is null or char_length(title) <= 100
  ),
  constraint product_reviews_body_length check (
    char_length(body) between 10 and 1200
  )
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, is_approved, created_at desc);

create index if not exists product_reviews_user_idx
  on public.product_reviews (user_id, created_at desc);

alter table public.product_reviews enable row level security;

-- Reviews are read/written only through server routes.
-- This keeps buyer identity and purchase verification on the server.
revoke all on table public.product_reviews from anon, authenticated;
grant select, insert, update, delete
  on table public.product_reviews
  to service_role;
