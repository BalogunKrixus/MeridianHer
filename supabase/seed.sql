-- Launch spaces (PRD section 6.2) and default settings (PRD sections 8 and 9.10).
-- Admins edit all of this later without a deploy. Icons are lucide names.

insert into public.spaces
  (slug, name, description, icon, accent_color, rules, tags, min_age, ask_expert_enabled, show_crisis_card, sort_order)
values
  ('periods', 'Periods and cycles',
   'First periods, irregular cycles, period pain and everything in between.',
   'droplet', 'periods', '{}',
   '{"First period","Irregular cycles","Period pain","Heavy bleeding","Spotting","PMS"}', null, true, false, 10),
  ('fertility', 'Fertility and TTC',
   'Trying to conceive, fertility tests, IVF and pregnancy loss. Kind words only; everyone here is waiting for something.',
   'sprout', 'fertility', '{"Add a pregnancy loss content warning when you write about a loss.","No pregnancy announcements without a content warning."}',
   '{"Trying to conceive","Ovulation","IVF","Fertility tests","Pregnancy loss"}', null, true, false, 20),
  ('pregnancy', 'Pregnancy',
   'Trimester by trimester, from the first test to the last weeks.',
   'baby', 'pregnancy', '{}',
   '{"First trimester","Second trimester","Third trimester","Scans","Nausea","Birth plans"}', null, true, false, 30),
  ('postpartum', 'Postpartum',
   'Recovery, feeding, sleep and your mental health after birth.',
   'heart-handshake', 'postpartum', '{}',
   '{"Recovery","Feeding","Sleep","Pelvic floor","Low mood"}', null, true, true, 40),
  ('menopause', 'Menopause',
   'Perimenopause through postmenopause. Hot flushes, sleep, mood, HRT and finding the words for what is happening.',
   'sunset', 'menopause', '{}',
   '{"Perimenopause","Hot flushes","HRT","Sleep","Mood"}', null, true, false, 50),
  ('conditions', 'PCOS and endometriosis',
   'Conditions, diagnosis journeys and managing day to day.',
   'activity', 'conditions', '{}',
   '{"PCOS","Endometriosis","Adenomyosis","Fibroids","Diagnosis"}', null, true, false, 60),
  ('sexual-health', 'Sexual health',
   'Contraception, STIs, pain during sex and libido. For members aged 18 and over.',
   'heart', 'sexual', '{"Talk about health, not explicit experiences."}',
   '{"Contraception","STIs","Painful sex","Libido","Vaginal health"}', 18, true, false, 70),
  ('mental-health', 'Mental health',
   'Hormones and mood, PMDD, anxiety and feeling like yourself again. Help is always one tap away.',
   'brain', 'mind', '{"If someone may be in danger, report the post so a moderator sees it quickly."}',
   '{"PMDD","Anxiety","Low mood","Hormones and mood"}', null, true, true, 80),
  ('nutrition', 'Nutrition by CyclePlate',
   'Cycle syncing, cravings and eating for each phase, with the CyclePlate team.',
   'salad', 'nutrition', '{}',
   '{"Cycle syncing","Cravings","Iron","Recipes"}', null, true, false, 90),
  ('body', 'Body and skin',
   'Hair, skin, weight, breasts and discharge. The questions you have been wondering about.',
   'sparkles', 'body', '{}',
   '{"Skin","Hair","Breasts","Discharge","Weight"}', null, true, false, 100);

insert into public.settings (key, value) values
  ('crisis_resources', '[
    {"country": "United Kingdom", "resources": [
      {"name": "Samaritans", "detail": "Any time, day or night", "phone": "116 123"},
      {"name": "NHS 111", "detail": "Urgent medical help", "phone": "111"}
    ]},
    {"country": "Nigeria", "resources": [
      {"name": "Emergency services", "phone": "112"},
      {"name": "Mentally Aware Nigeria Initiative", "detail": "Mental health support"}
    ]}
  ]'),
  ('allowed_link_domains', '["nhs.uk", "who.int", "acog.org", "nice.org.uk", "hellocycleplate.com"]'),
  ('blocked_words', '[]'),
  ('new_account_hold', '{"hours": 24, "items": 2}'),
  ('rate_limits', '{"posts_per_hour": 5, "replies_per_hour": 30}'),
  ('report_auto_hide_threshold', '3');
