// The list of games, used by the hub page and the contact form.
// status: "live" links to the game's folder; "soon" shows a teaser card.
// suggest: the hint shown in the contact form when this game is picked.
window.GAMES = [
  {
    id: "caesarle", name: "Caesarle", glyph: "FDHVDU", status: "live",
    blurb: "The word is hidden behind a Caesar cipher. Probe it, crack the shift, lock in.",
    suggest: "A word that should (or shouldn't) be an answer, a word that was wrongly rejected, a bug, an idea…",
  },
  {
    id: "haikudle", name: "Haikudle", glyph: "5·7·5", status: "live",
    blurb: "Eighteen word magnets, one haiku. Post yours, then like everyone else's.",
    suggest: "A word you'd love to see in the draw, a bug, an idea…",
  },
  {
    id: "wheres-waddle", name: "Where's Waddle?", glyph: "▶◀", status: "soon",
    blurb: "A new crowded scene every day. Find Waddle, the only penguin in a bowtie.",
    suggest: "A scene, a prop or a kind of penguin you'd like to see, or a hiding spot idea…",
  },
];

// Site settings.
window.SITE = {
  // Web3Forms access key for the contact form (free: web3forms.com, 250 messages/month).
  // It's safe to publish: it can only send messages to your inbox.
  // Leave empty and the form shows a "not set up yet" message instead of sending.
  contactKey: "",

  // Discord webhook URL for the contact form (Server Settings → Integrations →
  // Webhooks → New Webhook → Copy URL). Messages post into that channel.
  // Note: this URL is public in the page source, so anyone could post to the
  // channel with it. Use a private channel just for this, and if it's ever
  // abused, delete the webhook in Discord and make a new one.
  // If both this and contactKey are set, messages go to both.
  discordWebhook: "https://discord.com/api/webhooks/1570211760487792780/ja1GaJCivsiUwT089lqqGCcgO2HHQwIh7uxMCZFiidtkd5oMYn2fxNsbHUiUl2_Obpzm",

  // GoatCounter site code for visitor stats (free: goatcounter.com).
  // If your dashboard is https://romanserius.goatcounter.com, the code is "romanserius".
  // Leave empty to turn counting off. Test mode and localhost are never counted.
  goatcounter: "roman-serius",

  // Public address of the site, used for search engines and link previews.
  url: "https://romanserius.com/daily-games/",
};
