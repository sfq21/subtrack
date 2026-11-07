create table if not exists subs(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    names text not null check (char_length(names) between 1 and 169),
    price numeric(10, 2) not null,
    startd date not null,
    duration integer not null,
    category text not null default 'Other' check (category in ('Entertainment', 'Productivity', 'Utilities', 'Education', 'Health & Fitness', 'Shopping', 'Other')),
    updated_at timestamptz not null default now()
);

alter table subs add column if not exists category text not null default 'Other' check (category in ('Entertainment', 'Productivity', 'Utilities', 'Education', 'Health & Fitness', 'Shopping', 'Other'));

create table if not exists sub_price_history(
    id uuid primary key default gen_random_uuid(),
    subs_id uuid not null references subs(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    price numeric(10, 2) not null,
    duration integer not null,
    effective_at timestamptz not null default now()
);

create index if not exists sub_price_history_user_date_idx
    on sub_price_history(user_id, effective_at);

insert into sub_price_history (subs_id, user_id, price, duration)
select subs.id, subs.user_id, subs.price, subs.duration
from subs
where not exists (
    select 1
    from sub_price_history
    where sub_price_history.subs_id = subs.id
);

create table if not exists alerts(
    id uuid primary key default gen_random_uuid(),
    subs_id uuid not null references subs(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    descr text not null,
    alert_date timestamptz not null default now()
);

alter table subs enable row level security;
alter table sub_price_history enable row level security;
alter table alerts enable row level security;