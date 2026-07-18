delete from saved_sessions where user_id is null;
delete from saved_battle_sessions where user_id is null;

delete from saved_sessions
where id in (
    select id
    from (
        select
            id,
            row_number() over (
                partition by user_id
                order by updated_at desc, created_at desc, id
            ) as row_rank
        from saved_sessions
    ) ranked_sessions
    where row_rank > 1
);

delete from saved_battle_sessions
where id in (
    select id
    from (
        select
            id,
            row_number() over (
                partition by user_id
                order by updated_at desc, created_at desc, id
            ) as row_rank
        from saved_battle_sessions
    ) ranked_sessions
    where row_rank > 1
);

alter table saved_sessions add column revision bigint not null default 0;
alter table saved_battle_sessions add column revision bigint not null default 0;

create unique index uq_saved_sessions_user_id on saved_sessions(user_id);
create unique index uq_saved_battle_sessions_user_id on saved_battle_sessions(user_id);
