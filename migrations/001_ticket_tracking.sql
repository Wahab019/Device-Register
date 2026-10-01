alter table public.device_records add column ticket_code text;

update public.device_records
set ticket_code = 'DR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where ticket_code is null;

alter table public.device_records
  alter column ticket_code set not null,
  add constraint device_records_ticket_code_key unique (ticket_code),
  alter column ticket_code set default
    'DR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table public.device_records
  add constraint device_records_status_check
  check (status in ('pending', 'in_progress', 'ready_for_pickup', 'completed'));

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.device_records(id) on delete cascade,
  old_status text,
  new_status text not null,
  email_sent boolean not null default false,
  changed_at timestamptz not null default now()
);
create index on public.status_history (device_id, changed_at);

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.device_records(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index on public.charges (device_id);
