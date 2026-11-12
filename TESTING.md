# Caesarle test checklist

Test mode is on while `TEST_MODE = true` in `shared/daily.js`. The red panel
(bottom right) shows the answer, shift and cipher, and lets you jump days,
play a custom word + shift, reset the puzzle, or clear test data.
Test saves and stats never touch real ones.

Most tests use the custom puzzle **PASTE, shift 1** (cipher QBTUF).

## 1. Probe acceptance
- [ ] `slate` + any shift → accepted (real word)
- [ ] `tmbuf` + any shift → accepted (SLATE in today's shift)
- [ ] `uncvg` → rejected, toast shows −5, row not used
- [ ] `zzzzz` → rejected, −5
- [ ] 4 letters + Enter → "Not enough letters", no penalty
- [ ] 5 letters, no shift + Enter → accepted, badge shows —, no arrow
- [ ] A real word that's also valid in cipher still counts as one row

## 2. Colours (against the cipher QBTUF)
- [ ] `tmbuf` → T yellow, M grey, B yellow, U green, F green
- [ ] `slate` → only T yellow
- [ ] Double letters: try `fluff` / `tuffs`: only as many yellows as the cipher has
- [ ] Keyboard keys take the best colour seen and never downgrade (green stays green)

## 3. Shift arrows
- [ ] Shift 1 → ✓ ; any 2–25 → ↓  (on PASTE/1)
- [ ] Custom puzzle with shift 13: 5 → ↑, 20 → ↓, 13 → ✓
- [ ] Digit typing: `1` `7` → 17; `3` `7` → 7; `0` alone does nothing; Backspace deletes digits before letters
- [ ] On-screen number row works the same

## 4. Final answer
- [ ] Tab / tapping the final row switches focus; tapping the board switches back
- [ ] Non-word in final row → "must be a real word", no confirm
- [ ] Confirm pop-up appears; "Keep probing" cancels; Enter confirms
- [ ] Correct → tiles green, "Cipher cracked"; wrong → red, "The legions are lost"
- [ ] After 6 probes the final row is forced and probing stops
- [ ] After the game ends, typing does nothing

## 5. Points (check the end-screen breakdown)
- [ ] Win with 0 probes → 210 (100 + 60 Veni vidi vici + 50 No shift checks)
- [ ] Win after `slate` and `tmbuf` with no shifts → 100 + 20 + 15 + 50 = 185
- [ ] Any shift entered on any row → no +50; a blank-shift row never counts as Ignored the signs
- [ ] Win after probing `tmbuf` and `slate`, both with shift 1 → 100 + 20 + 25 + 15 = 160
- [ ] Row bonus by probes used: 1 → +30, 2 → +20, 3 → +10, 4 → 0, 5 → −10, 6 → −20
- [ ] Probe shift 20 (↓), then 22 → Ignored the signs −10
- [ ] After a ✓, any different shift → Ignored the signs
- [ ] Probe the real answer `paste` as a row → Et tu? −15
- [ ] Each rejection → −5 on win and on loss
- [ ] Wrong final with 2 rejections → −35

## 6. Saving and stats
- [ ] Reload mid-game → probes, colours, keyboard and penalties all restored
- [ ] Reload after finishing → end screen reopens, can't play again
- [ ] Stats: played / win % / streak / avg pts / best pts update once per game
- [ ] Probes-used chart highlights today's bar
- [ ] Share copies text with the grid, arrows, badges and points; it doesn't reveal the word
- [ ] Countdown ticks to local midnight

## 7. Cipher wheel
- [ ] Drag, scroll, ◀ ▶ and arrow keys all turn it; it snaps to letters
- [ ] Shift 1: outer A sits over inner b; "A → B"
- [ ] Turning 25 → 0 goes the short way (no full spin)
- [ ] Try a word: SLATE at 1 → encode TMBUF, decode RKZSD
- [ ] "Use as my shift guess" fills the current row's shift
- [ ] Typing in the wheel box doesn't type into the board
- [ ] Width > 1120px: wheel on the left, game centred. Narrower: ◎ drawer, closes on outside tap or Esc

## 8. Devices
- [ ] Phone (same Wi-Fi, `ipconfig getifaddr en0`): everything fits, no zoom on tap, keyboard reachable, test panel collapses
- [ ] Safari and Chrome on desktop
- [ ] Phone Share button opens the share sheet

## 9. Daily rollover
- [ ] ◀ day / day ▶ give different words and shifts; same day always gives the same puzzle
- [ ] `?test=0` → real mode: no panel, real stats; today's puzzle matches test-mode "today"

## Before launch
- [ ] Set `TEST_MODE = false` in `shared/daily.js`
- [ ] Run `localStorage.clear()` once in your own browser
