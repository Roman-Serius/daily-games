-- =====================================================================
-- Haikudle backend (Supabase / Postgres)
--
-- Paste this whole file into Supabase -> SQL Editor -> Run.
-- It is safe to re-run: it drops and rebuilds the functions, policies
-- and grants, and only creates tables that don't exist yet.
--
-- Rules it enforces (all on the server, so nobody can cheat from the browser):
--   * A day runs midnight-to-midnight at UTC-12, so it changes at 12:00 UTC
--     (4am Pacific / 7am Eastern in winter, an hour later in summer).
--     Day #1 = 2026-11-12, the same numbering as the rest of the site.
--   * Each day has a draw of words. You can't see a day's draw before it starts.
--   * A haiku is 3 lines of 5-7-5 syllables, built from word IDs.
--     Draw words: each one used at most once. Glue (filler) words: at most 7.
--   * One haiku per player per day.
--   * Other people's haiku for today stay hidden until you've posted yours.
--   * Likes: like as many as you want, never your own, toggle on/off.
--     Liking closes the moment the day changes over.
--   * At changeover, the top 3 by likes are saved (ties: earliest submitted wins).
--
-- Everything lives in its own schema, "haikudle", so other games can share
-- the same Supabase project. See README.md for the one setting that needs.
-- =====================================================================

create schema if not exists haikudle;
set search_path = haikudle, public;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- Every word the game knows: the big pool AND the filler words.
create table if not exists haikudle.words (
  id         serial primary key,
  text       text     not null,
  syllables  smallint not null check (syllables between 1 and 7),
  pos        text     not null default 'other'
             check (pos in ('noun', 'verb', 'adj', 'adv', 'other')),
  is_filler  boolean  not null default false,  -- filler words can be used any number of times
  active     boolean  not null default true    -- turn a word off without deleting it
);
create unique index if not exists words_text_unique on haikudle.words (lower(text));

-- One row per day: which pool words players get.
create table if not exists haikudle.draws (
  day           int        primary key check (day >= 1),
  word_ids      int[]      not null check (cardinality(word_ids) between 5 and 40),
  theme         text,                          -- optional, for your own notes / themed days
  rules_version smallint   not null default 1, -- bump if the rules change, so old haiku still make sense
  created_at    timestamptz not null default now()
);

-- (Endings were tried and removed; this cleans up the table if it was created.)
drop table if exists haikudle.forms;

-- Optional per-player info (anonymous players are fine; display_name is for later).
create table if not exists haikudle.players (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 30),
  created_at   timestamptz not null default now()
);

create table if not exists haikudle.haiku (
  id            bigint generated always as identity primary key,
  day           int    not null references haikudle.draws (day),
  author        uuid   not null references auth.users (id) on delete cascade,
  lines         jsonb  not null,   -- [[wordId, ...], [...], [...]]  (the source of truth)
  body          text   not null,   -- rendered text, lines separated by \n
  fingerprint   text   not null,   -- md5 of the lowercased body, to spot identical haiku
  like_count    int    not null default 0,
  report_count  int    not null default 0,
  hidden        boolean not null default false,  -- set true by hand to remove one
  created_at    timestamptz not null default now(),
  unique (day, author)             -- one haiku per player per day
);
create index if not exists haiku_day_likes  on haikudle.haiku (day, like_count desc, created_at, id);
create index if not exists haiku_day_time   on haikudle.haiku (day, created_at, id);
create index if not exists haiku_fingerprint on haikudle.haiku (day, fingerprint);

create table if not exists haikudle.likes (
  haiku_id   bigint not null references haikudle.haiku (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (haiku_id, user_id)
);
create index if not exists likes_user on haikudle.likes (user_id);

create table if not exists haikudle.reports (
  haiku_id   bigint not null references haikudle.haiku (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  reason     text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (haiku_id, user_id)
);

-- Saved results: the top 3 of each finished day.
create table if not exists haikudle.daily_top (
  day        int      not null,
  rank       smallint not null check (rank between 1 and 3),
  haiku_id   bigint   not null references haikudle.haiku (id) on delete cascade,
  like_count int      not null,
  primary key (day, rank)
);

-- ---------------------------------------------------------------------
-- Day helpers
-- ---------------------------------------------------------------------

-- 'Etc/GMT+12' really is UTC-12 (the Etc/ names have the sign flipped)
-- and it never shifts for daylight saving.
create or replace function haikudle.current_day()
returns int language sql stable set search_path = haikudle, public as $$
  select ((now() at time zone 'Etc/GMT+12')::date - date '2026-11-12') + 1;
$$;

-- When the current day ends (the next changeover), as a timestamp.
create or replace function haikudle.day_ends_at()
returns timestamptz language sql stable set search_path = haikudle, public as $$
  select (((now() at time zone 'Etc/GMT+12')::date + 1)::timestamp) at time zone 'Etc/GMT+12';
$$;

-- Has the signed-in player posted a haiku for this day?
-- (security definer so RLS policies on haiku can call it without recursion)
create or replace function haikudle.has_submitted(p_day int)
returns boolean language sql stable security definer set search_path = haikudle, public as $$
  select exists (select 1 from haikudle.haiku where day = p_day and author = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- today(): everything the page needs on load, in one call
-- ---------------------------------------------------------------------
create or replace function haikudle.today()
returns jsonb language sql stable security definer set search_path = haikudle, public as $$
  select jsonb_build_object(
    'day',        haikudle.current_day(),
    'ends_at',    haikudle.day_ends_at(),
    'theme',      null,  -- themes stay secret; change to d.theme to reveal them
    'words',      coalesce((
                    select jsonb_agg(jsonb_build_object('id', w.id, 'text', w.text,
                                     'syllables', w.syllables, 'pos', w.pos) order by w.text)
                    from haikudle.words w where w.id = any (d.word_ids)), '[]'::jsonb),
    'max_fillers', 7,
    'fillers',    (select coalesce(jsonb_agg(jsonb_build_object('id', w.id, 'text', w.text,
                                     'syllables', w.syllables) order by w.id), '[]'::jsonb)
                    from haikudle.words w where w.is_filler and w.active),
    'submitted',  haikudle.has_submitted(haikudle.current_day()),
    'mine',       (select jsonb_build_object('id', h.id, 'body', h.body, 'lines', h.lines,
                                             'like_count', h.like_count, 'created_at', h.created_at)
                    from haikudle.haiku h
                    where h.day = haikudle.current_day() and h.author = auth.uid()),
    -- how many other players wrote the exact same haiku as you
    'same_as_mine', (select count(*) from haikudle.haiku o, haikudle.haiku m
                     where m.day = haikudle.current_day() and m.author = auth.uid()
                       and o.day = m.day and o.fingerprint = m.fingerprint
                       and o.id <> m.id and not o.hidden)
  )
  from (select 1) one
  left join haikudle.draws d on d.day = haikudle.current_day();
$$;

-- ---------------------------------------------------------------------
-- submit_haiku(lines): validate and save today's haiku
--   lines = [[wordId, ...], [wordId, ...], [wordId, ...]]
-- ---------------------------------------------------------------------
create or replace function haikudle.submit_haiku(p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = haikudle, public as $$
declare
  v_uid     uuid := auth.uid();
  v_day     int  := haikudle.current_day();
  v_draw    haikudle.draws;
  v_word    haikudle.words;
  v_targets int[] := array[5, 7, 5];
  v_line    jsonb;
  v_tile    jsonb;
  v_id      int;
  v_syl     int;
  v_used    int[] := '{}';
  v_draw_n  int := 0;
  v_fill_n  int := 0;
  v_ltext   text;
  v_body    text := '';
  v_row     haikudle.haiku;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select * into v_draw from haikudle.draws where day = v_day;
  if not found then
    raise exception 'There is no puzzle for today yet';
  end if;

  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) <> 3 then
    raise exception 'A haiku needs exactly 3 lines';
  end if;

  for i in 0..2 loop
    v_line := p_lines -> i;
    if jsonb_typeof(v_line) is distinct from 'array' or jsonb_array_length(v_line) = 0 then
      raise exception 'Line % is empty', i + 1;
    end if;

    v_syl := 0;
    v_ltext := '';
    for v_tile in select value from jsonb_array_elements(v_line) loop
      if jsonb_typeof(v_tile) is distinct from 'number' or v_tile::text !~ '^\d{1,9}$' then
        raise exception 'Bad tile in line %', i + 1;
      end if;
      v_id := v_tile::text::int;

      select * into v_word from haikudle.words where id = v_id and active;
      if not found then
        raise exception 'Unknown word (id %)', v_id;
      end if;

      if v_word.is_filler then
        v_fill_n := v_fill_n + 1;
      else
        if not (v_id = any (v_draw.word_ids)) then
          raise exception '"%" isn''t one of today''s words', v_word.text;
        end if;
        if v_id = any (v_used) then
          raise exception '"%" can only be used once', v_word.text;
        end if;
        v_used := v_used || v_id;
        v_draw_n := v_draw_n + 1;
      end if;

      v_syl := v_syl + v_word.syllables;
      v_ltext := v_ltext || case when v_ltext = '' then '' else ' ' end || v_word.text;
    end loop;

    if v_syl <> v_targets[i + 1] then
      raise exception 'Line % has % syllables; it needs %', i + 1, v_syl, v_targets[i + 1];
    end if;
    v_body := v_body || case when i = 0 then '' else E'\n' end || v_ltext;
  end loop;

  if v_fill_n > 7 then
    raise exception 'You can use at most 7 glue words (you used %)', v_fill_n;
  end if;

  insert into haikudle.players (id) values (v_uid) on conflict do nothing;

  begin
    insert into haikudle.haiku (day, author, lines, body, fingerprint)
    values (v_day, v_uid, p_lines, v_body, md5(lower(v_body)))
    returning * into v_row;
  exception when unique_violation then
    raise exception 'You''ve already posted today''s haiku';
  end;

  return jsonb_build_object('id', v_row.id, 'body', v_row.body, 'day', v_row.day,
                            'created_at', v_row.created_at);
end;
$$;

-- ---------------------------------------------------------------------
-- get_feed(sort, limit, offset): today's haiku, for liking
--   sort: 'newest' (default) | 'oldest' | 'most_liked' | 'least_liked'
--   Returns nothing until you've posted your own haiku.
--   Ties are always broken by earliest submitted.
-- ---------------------------------------------------------------------
create or replace function haikudle.get_feed(
  p_sort text default 'newest', p_limit int default 50, p_offset int default 0)
returns table (id bigint, body text, lines jsonb, like_count int,
               created_at timestamptz, liked_by_me boolean, is_mine boolean)
language sql stable security definer set search_path = haikudle, public as $$
  select h.id, h.body, h.lines, h.like_count, h.created_at,
         exists (select 1 from haikudle.likes l where l.haiku_id = h.id and l.user_id = auth.uid()),
         h.author = auth.uid()
  from haikudle.haiku h
  where h.day = haikudle.current_day()
    and not h.hidden
    and haikudle.has_submitted(haikudle.current_day())
  order by
    case when p_sort = 'most_liked'  then h.like_count end desc,
    case when p_sort = 'least_liked' then h.like_count end asc,
    case when p_sort = 'newest'      then h.created_at end desc,
    case when p_sort = 'newest'      then h.id end desc,
    h.created_at asc,
    h.id asc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------
-- toggle_like(haiku_id): like / unlike. Returns true if now liked.
-- ---------------------------------------------------------------------
create or replace function haikudle.toggle_like(p_haiku_id bigint)
returns boolean language plpgsql security definer set search_path = haikudle, public as $$
declare
  v_uid uuid := auth.uid();
  v_h   haikudle.haiku;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select * into v_h from haikudle.haiku where id = p_haiku_id for update;
  if not found or v_h.hidden then
    raise exception 'That haiku doesn''t exist';
  end if;
  if v_h.day <> haikudle.current_day() then
    raise exception 'Liking for that day has closed';
  end if;
  if v_h.author = v_uid then
    raise exception 'You can''t like your own haiku';
  end if;
  if not haikudle.has_submitted(v_h.day) then
    raise exception 'Post your own haiku first';
  end if;

  delete from haikudle.likes where haiku_id = p_haiku_id and user_id = v_uid;
  if found then
    update haikudle.haiku set like_count = like_count - 1 where id = p_haiku_id;
    return false;
  end if;

  insert into haikudle.likes (haiku_id, user_id) values (p_haiku_id, v_uid)
  on conflict do nothing;
  if found then
    update haikudle.haiku set like_count = like_count + 1 where id = p_haiku_id;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- report_haiku(haiku_id, reason): flag one for you to look at.
-- Nothing is hidden automatically; check reports and set hidden = true by hand.
-- ---------------------------------------------------------------------
create or replace function haikudle.report_haiku(p_haiku_id bigint, p_reason text default null)
returns void language plpgsql security definer set search_path = haikudle, public as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  insert into haikudle.reports (haiku_id, user_id, reason)
  values (p_haiku_id, auth.uid(), left(p_reason, 200))
  on conflict do nothing;
  if found then
    update haikudle.haiku set report_count = report_count + 1 where id = p_haiku_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- finalize_day(day): save the top 3 of a finished day.
-- Ties: earliest submitted wins. Safe to run more than once.
-- ---------------------------------------------------------------------
create or replace function haikudle.finalize_day(p_day int)
returns void language plpgsql security definer set search_path = haikudle, public as $$
begin
  if p_day >= haikudle.current_day() then
    raise exception 'Day % hasn''t finished yet', p_day;
  end if;
  insert into haikudle.daily_top (day, rank, haiku_id, like_count)
  select p_day, r.rank, r.id, r.like_count
  from (
    select h.id, h.like_count,
           row_number() over (order by h.like_count desc, h.created_at asc, h.id asc)::smallint as rank
    from haikudle.haiku h
    where h.day = p_day and not h.hidden
  ) r
  where r.rank <= 3
  on conflict (day, rank) do nothing;
end;
$$;

-- ---------------------------------------------------------------------
-- day_top(day): the saved top 3 for a finished day (default: yesterday).
-- If the scheduled job hasn't run yet, this saves the results first.
-- ---------------------------------------------------------------------
create or replace function haikudle.day_top(p_day int default null)
returns table (day int, rank smallint, haiku_id bigint, body text, like_count int)
language plpgsql security definer set search_path = haikudle, public as $$
#variable_conflict use_column
declare
  v_day int := coalesce(p_day, haikudle.current_day() - 1);
begin
  if v_day < 1 or v_day >= haikudle.current_day() then
    return;
  end if;
  if not exists (select 1 from haikudle.daily_top t where t.day = v_day) then
    perform haikudle.finalize_day(v_day);
  end if;
  return query
    select t.day, t.rank, t.haiku_id, h.body, t.like_count
    from haikudle.daily_top t
    join haikudle.haiku h on h.id = t.haiku_id
    where t.day = v_day
    order by t.rank;
end;
$$;

-- ---------------------------------------------------------------------
-- Row level security: what the public API can read directly.
-- All writes go through the functions above; nobody can insert/update
-- the tables directly.
-- ---------------------------------------------------------------------
alter table haikudle.words     enable row level security;
alter table haikudle.draws     enable row level security;
alter table haikudle.players   enable row level security;
alter table haikudle.haiku     enable row level security;
alter table haikudle.likes     enable row level security;
alter table haikudle.reports   enable row level security;
alter table haikudle.daily_top enable row level security;

drop policy if exists words_read on haikudle.words;
create policy words_read on haikudle.words for select using (true);

drop policy if exists draws_read_started on haikudle.draws;
create policy draws_read_started on haikudle.draws for select
  using (day <= haikudle.current_day());

drop policy if exists players_read_own on haikudle.players;
create policy players_read_own on haikudle.players for select using (id = auth.uid());

-- Your own haiku always; past days' haiku for everyone;
-- today's haiku only once you've posted yours.
drop policy if exists haiku_read on haikudle.haiku;
create policy haiku_read on haikudle.haiku for select using (
  author = auth.uid()
  or (not hidden and (
        day < haikudle.current_day()
        or (day = haikudle.current_day() and haikudle.has_submitted(day))
     ))
);

drop policy if exists likes_read_own on haikudle.likes;
create policy likes_read_own on haikudle.likes for select using (user_id = auth.uid());

drop policy if exists daily_top_read on haikudle.daily_top;
create policy daily_top_read on haikudle.daily_top for select using (true);
-- reports: no read policy, so only you (in the dashboard) can see them.

-- ---------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------
grant usage on schema haikudle to anon, authenticated;

revoke all on all tables    in schema haikudle from anon, authenticated, public;
revoke all on all sequences in schema haikudle from anon, authenticated, public;
revoke all on all functions in schema haikudle from anon, authenticated, public;

grant select on haikudle.words, haikudle.draws, haikudle.haiku, haikudle.daily_top
  to anon, authenticated;
grant select on haikudle.likes, haikudle.players to authenticated;

-- (Supabase anonymous sign-ins use the "authenticated" role.)
grant execute on function haikudle.current_day()                    to anon, authenticated;
grant execute on function haikudle.day_ends_at()                    to anon, authenticated;
grant execute on function haikudle.has_submitted(int)               to anon, authenticated;
grant execute on function haikudle.today()                          to anon, authenticated;
grant execute on function haikudle.day_top(int)                     to anon, authenticated;
grant execute on function haikudle.get_feed(text, int, int)         to authenticated;
grant execute on function haikudle.submit_haiku(jsonb)              to authenticated;
grant execute on function haikudle.toggle_like(bigint)              to authenticated;
grant execute on function haikudle.report_haiku(bigint, text)       to authenticated;
-- finalize_day is not granted: only the scheduled job (and day_top) run it.

-- ---------------------------------------------------------------------
-- Filler words (unlimited use, all one syllable)
-- ---------------------------------------------------------------------
insert into haikudle.words (text, syllables, pos, is_filler) values
  ('a',1,'other',true), ('an',1,'other',true), ('the',1,'other',true),
  ('I',1,'other',true), ('you',1,'other',true), ('it',1,'other',true),
  ('we',1,'other',true), ('they',1,'other',true), ('me',1,'other',true),
  ('my',1,'other',true), ('your',1,'other',true), ('its',1,'other',true),
  ('is',1,'other',true), ('are',1,'other',true), ('was',1,'other',true),
  ('be',1,'other',true),
  ('of',1,'other',true), ('to',1,'other',true), ('in',1,'other',true),
  ('on',1,'other',true), ('at',1,'other',true), ('by',1,'other',true),
  ('with',1,'other',true), ('from',1,'other',true), ('for',1,'other',true),
  ('through',1,'other',true),
  ('and',1,'other',true), ('but',1,'other',true), ('or',1,'other',true),
  ('as',1,'other',true), ('if',1,'other',true), ('so',1,'other',true),
  ('not',1,'other',true), ('no',1,'other',true), ('this',1,'other',true),
  ('that',1,'other',true), ('all',1,'other',true)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Scheduled job (optional but recommended)
-- Turn on the pg_cron extension first: Database -> Extensions -> pg_cron.
-- Then run these two lines once. It saves yesterday's top 3 one minute
-- after each changeover. (day_top() also does it on demand, so the site
-- works without this.)
-- ---------------------------------------------------------------------
-- select cron.schedule('haikudle-finalize', '1 12 * * *',
--   $$select haikudle.finalize_day(haikudle.current_day() - 1)$$);
