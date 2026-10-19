create table if not exists subs(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    names text not null check (char_length(names) between 1 and 169),
    price numeric(10, 2) not null,
    startd date not null,
    duration integer not null,
    updated_at timestamptz not null default now()
);

create table if not exists alerts(
    id uuid primary key default gen_random_uuid(),
    subs_id uuid not null references subs(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    descr text not null,
    alert_date timestamptz not null default now()
);

alter table subs enable row level security;
alter table alerts enable row level security;