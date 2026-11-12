-- =====================================================================
-- Haikudle DEV SEED: a tiny sample word pool + random draws for days 1-60.
-- For testing only. The real pool and draws will come from a generator
-- script; delete these first (see the bottom of this file).
-- Run after schema.sql.
-- =====================================================================

insert into haikudle.words (text, syllables, pos) values
  -- nouns
  ('moth',1,'noun'), ('rain',1,'noun'), ('kettle',2,'noun'), ('lantern',2,'noun'),
  ('river',2,'noun'), ('window',2,'noun'), ('mountain',2,'noun'), ('sparrow',2,'noun'),
  ('cathedral',3,'noun'), ('cinnamon',3,'noun'), ('umbrella',3,'noun'), ('library',3,'noun'),
  ('stone',1,'noun'), ('moon',1,'noun'), ('frost',1,'noun'), ('train',1,'noun'),
  ('autumn',2,'noun'), ('candle',2,'noun'), ('harbor',2,'noun'), ('honey',2,'noun'),
  ('telephone',3,'noun'), ('afternoon',3,'noun'), ('salamander',4,'noun'), ('ocean',2,'noun'),
  -- verbs
  ('drift',1,'verb'), ('hum',1,'verb'), ('fall',1,'verb'), ('burn',1,'verb'),
  ('whisper',2,'verb'), ('linger',2,'verb'), ('scatter',2,'verb'), ('settle',2,'verb'),
  ('wander',2,'verb'), ('remember',3,'verb'), ('disappear',3,'verb'), ('glimmer',2,'verb'),
  ('sleep',1,'verb'), ('wait',1,'verb'), ('sing',1,'verb'),
  -- adjectives
  ('cold',1,'adj'), ('soft',1,'adj'), ('blue',1,'adj'), ('old',1,'adj'),
  ('quiet',2,'adj'), ('golden',2,'adj'), ('hollow',2,'adj'), ('silver',2,'adj'),
  ('electric',3,'adj'), ('forgotten',3,'adj'), ('beautiful',3,'adj'),
  -- adverbs
  ('slowly',2,'adv'), ('again',2,'adv'), ('always',2,'adv'), ('tonight',2,'adv')
on conflict do nothing;

-- Random 18-word draws for days 1-60: 7 nouns, 5 verbs, 4 adjectives, 2 adverbs.
insert into haikudle.draws (day, word_ids, theme)
select d,
  (select array_agg(id) from (
     (select id from haikudle.words where pos = 'noun' and not is_filler order by md5(id::text || d) limit 7)
     union all
     (select id from haikudle.words where pos = 'verb' and not is_filler order by md5(id::text || d) limit 5)
     union all
     (select id from haikudle.words where pos = 'adj'  and not is_filler order by md5(id::text || d) limit 4)
     union all
     (select id from haikudle.words where pos = 'adv'  and not is_filler order by md5(id::text || d) limit 2)
  ) picked),
  'dev seed'
from generate_series(1, 60) d
on conflict (day) do nothing;

-- To remove the dev data later (this also deletes any haiku posted on those days):
--   delete from haikudle.haiku where day in (select day from haikudle.draws where theme = 'dev seed');
--   delete from haikudle.draws where theme = 'dev seed';
--   delete from haikudle.words where not is_filler;
