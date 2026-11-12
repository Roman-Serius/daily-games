// Haikudle backend connection (Supabase).
// Both values are meant to be public: the database rules in supabase/schema.sql
// are what protect the data. Never put the database password or a "secret" /
// "service_role" key here.
window.HAIKUDLE_CONFIG = {
  url: "https://tmitjoctttzeikxpyljg.supabase.co",
  key: "sb_publishable_UsL9Zcjtbdenk6vzHrQs7Q_Psgq1rRi",
  // Cloudflare Turnstile site key (public). The matching secret key lives only in
  // Supabase → Authentication → Attack Protection. Leave empty to skip the CAPTCHA.
  turnstile: "0x4AAAAAAF-nt_e42HwaP1u7",
};
