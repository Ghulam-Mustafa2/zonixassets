-- ZonixAssets product specification fields
-- Safe to run more than once.

alter table public.products
  add column if not exists demo_url text,
  add column if not exists tech_stack text,
  add column if not exists file_format text,
  add column if not exists license_type text,
  add column if not exists package_contents text,
  add column if not exists file_size_bytes bigint,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.products
  drop constraint if exists products_file_size_bytes_nonnegative;

alter table public.products
  add constraint products_file_size_bytes_nonnegative
  check (file_size_bytes is null or file_size_bytes >= 0);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

comment on column public.products.demo_url is
  'Optional public live demo URL for templates, UI kits, or tools.';

comment on column public.products.tech_stack is
  'Human-readable real technology stack, e.g. Next.js, React, Tailwind CSS.';

comment on column public.products.file_format is
  'Human-readable delivered file format, e.g. ZIP, PPTX, PNG, source code.';

comment on column public.products.license_type is
  'Human-readable customer license label.';

comment on column public.products.package_contents is
  'Short factual summary of what is included in the download package.';

comment on column public.products.file_size_bytes is
  'Uploaded product file size in bytes when known.';
