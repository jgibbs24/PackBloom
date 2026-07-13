create table user_accounts (
    id uuid primary key,
    email varchar(254) not null unique,
    display_name varchar(80) not null,
    password_hash varchar(100) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table auth_tokens (
    id uuid primary key,
    user_id uuid not null references user_accounts(id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone not null
);

alter table saved_sessions add column user_id uuid references user_accounts(id) on delete cascade;
alter table saved_battle_sessions add column user_id uuid references user_accounts(id) on delete cascade;

create index idx_auth_tokens_token_hash on auth_tokens(token_hash);
create index idx_auth_tokens_user_id on auth_tokens(user_id);
create index idx_saved_sessions_user_updated on saved_sessions(user_id, updated_at desc);
create index idx_saved_battle_sessions_user_updated on saved_battle_sessions(user_id, updated_at desc);
