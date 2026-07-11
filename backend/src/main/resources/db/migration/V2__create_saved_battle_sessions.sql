create table saved_battle_sessions (
    id uuid primary key,
    display_name varchar(120) not null,
    state_json text not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_saved_battle_sessions_updated_at on saved_battle_sessions (updated_at desc);
