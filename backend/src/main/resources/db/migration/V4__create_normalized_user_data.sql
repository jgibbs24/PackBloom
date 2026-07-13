create table user_pack_history (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    client_entry_id varchar(120),
    set_code varchar(12) not null,
    booster_type varchar(32) not null,
    pack_number integer,
    total_value_usd numeric(10, 2) not null,
    chase_hit_card_id varchar(120),
    chase_hit_card_name varchar(255),
    opened_at timestamp with time zone not null,
    created_at timestamp with time zone not null
);

create table user_pulled_cards (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    pack_history_id uuid references user_pack_history(id) on delete cascade,
    scryfall_id varchar(120) not null,
    name varchar(255) not null,
    set_code varchar(12) not null,
    booster_type varchar(32) not null,
    rarity varchar(32) not null,
    price_usd numeric(10, 2) not null,
    finish varchar(64),
    treatment varchar(120),
    slot varchar(120),
    image_url text,
    pulled_at timestamp with time zone not null
);

create table user_chase_cards (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    card_name varchar(255) not null,
    set_code varchar(12),
    created_at timestamp with time zone not null
);

create table user_favorite_cards (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    scryfall_id varchar(120) not null,
    name varchar(255) not null,
    set_code varchar(12),
    image_url text,
    created_at timestamp with time zone not null,
    unique (user_id, scryfall_id)
);

create table user_battle_history (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    client_entry_id varchar(120),
    set_code varchar(12) not null,
    set_name varchar(120) not null,
    booster_type varchar(32) not null,
    player_a_name varchar(80) not null,
    player_b_name varchar(80) not null,
    total_a numeric(10, 2) not null,
    total_b numeric(10, 2) not null,
    margin numeric(10, 2) not null,
    winner varchar(16) not null,
    best_card_a_json text,
    best_card_b_json text,
    completed_at timestamp with time zone not null,
    created_at timestamp with time zone not null
);

create index idx_user_pack_history_user_opened on user_pack_history(user_id, opened_at desc);
create index idx_user_pulled_cards_user_pulled on user_pulled_cards(user_id, pulled_at desc);
create index idx_user_pulled_cards_user_card on user_pulled_cards(user_id, scryfall_id);
create index idx_user_chase_cards_user on user_chase_cards(user_id, created_at desc);
create index idx_user_favorite_cards_user on user_favorite_cards(user_id, created_at desc);
create index idx_user_battle_history_user_completed on user_battle_history(user_id, completed_at desc);
