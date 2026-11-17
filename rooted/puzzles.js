// Rooted puzzles in PLAY ORDER: item 1 = Rooted #1 (the ROOTED_LAUNCH date below), item 2 = #2...
// Append only once launched; never reorder earlier items. Par is worked out by the game:
// the fewest moves using roots only (no prefix or suffix links), with words.js words.
// Every puzzle here has a roots-only par of 3 or 4. Check a pair with: node tools/check.js start target
// Rooted's own day 1: puzzle #1 is played on this date (local time), #2 the next
// day, and so on. Set it to the day you publish. Before that date it stays on #1.
window.ROOTED_LAUNCH = "2026-11-16";

window.ROOTED_PUZZLES = [
  ["automobile", "pericardium"],
  ["telescope", "artifice"],
  ["equinox", "unicorn"],
  ["uniform", "sacrifice"],
  ["psychopath", "microbe"],
  ["arthropod", "neuroscience"],
  ["democrat", "hydrophobia"],
  ["megalomania", "telekinesis"],
  ["metamorphosis", "podiatrist"],
  ["omnipotent", "manicure"],
  ["postscript", "homeopathy"],
  ["electrocardiogram", "oligopoly"],
  ["morphology", "absolve"],
  ["microcosm", "facsimile"],
  ["percent", "microbiome"],
  ["monochrome", "trivia"],
  ["divert", "quadruped"],
  ["polychrome", "grandfather"],
  ["chronic", "terrific"],
  ["protagonist", "oligarchy"],
  ["thermometer", "disaster"],
  ["pediatric", "tetrahedron"],
  ["euphony", "lieutenant"],
  ["autopsy", "sacrilege"],
  ["circumscribe", "centipede"],
  ["zoology", "leukemia"],
  ["principle", "monotone"],
  ["tripod", "technocrat"],
  ["magnificent", "gynecology"],
  ["chronology", "scientific"],
];
