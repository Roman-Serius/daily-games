-- One-time change (Nov 12, 2026): make Nov 12 Haikudle day #1 instead of day #2,
-- matching the new launch date in shared/daily.js.
-- Every saved day moves down by one. Today's words stay the same; they become day #1.
-- Run ONCE in Supabase → SQL Editor. (Running it twice would shift everything again.)
begin;

-- Old day #1 (Nov 11) goes away. Its test haiku were already deleted.
delete from haikudle.daily_top where day = 1;
delete from haikudle.haiku     where day = 1;
delete from haikudle.draws     where day = 1;

-- Shift every day down by one (in two steps so no two rows ever share a number).
alter table haikudle.haiku drop constraint if exists haiku_day_fkey;
update haikudle.draws     set day = day + 99999;   -- 2 -> 100001, 3 -> 100002, ...
update haikudle.draws     set day = day - 100000;  -- 100001 -> 1, ...
update haikudle.haiku     set day = day - 1;
update haikudle.daily_top set day = day + 99999;
update haikudle.daily_top set day = day - 100000;
alter table haikudle.haiku add constraint haiku_day_fkey
  foreign key (day) references haikudle.draws (day);

-- The clock: Nov 12, 2026 is now day #1.
create or replace function haikudle.current_day()
returns int language sql stable set search_path = haikudle, public as $$
  select ((now() at time zone 'Etc/GMT+12')::date - date '2026-11-12') + 1;
$$;

commit;

-- Check: should show day 1 and today's 18 words.
select haikudle.today() -> 'day' as day,
       jsonb_array_length(haikudle.today() -> 'words') as words;
