// Cipher wheel: a fixed outer alphabet (plain) and a rotating inner alphabet
// (cipher). Turning the inner ring sets a shift; the plain letter on the outside
// encodes to the cipher letter directly inside it.
//
//   const w = CipherWheel(containerEl, { onUse: (k) => ..., useLabel: "Use as shift" });
//   w.set(3); w.get();
//
// Reusable by any cipher game on the site. Purely a player tool: it knows
// nothing about today's answer.
(function () {
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const STEP = 360 / 26;
  const NS = "http://www.w3.org/2000/svg";

  function rot(word, k) {
    return [...word.toLowerCase()].map((c) =>
      /[a-z]/.test(c) ? String.fromCharCode(((c.charCodeAt(0) - 97 + k + 2600) % 26) + 97) : c
    ).join("");
  }

  window.CipherWheel = function (root, opts = {}) {
    let shift = 0;   // 0..25
    let angle = 0;   // continuous inner-ring rotation, so 25 -> 0 animates the short way

    root.classList.add("wheel");
    root.innerHTML = `
      <div class="wheel-head">
        <span class="wheel-title">Cipher wheel</span>
        <span class="wheel-shift">shift <b data-shift>0</b></span>
      </div>
      <div class="wheel-stage" tabindex="0" role="slider" aria-label="Cipher wheel shift"
           aria-valuemin="0" aria-valuemax="25" aria-valuenow="0"></div>
      <div class="wheel-buttons">
        <button class="icon-btn" data-step="-1" aria-label="Turn back one">◀</button>
        <span class="wheel-pair" data-pair>A → A</span>
        <button class="icon-btn" data-step="1" aria-label="Turn forward one">▶</button>
      </div>
      <label class="wheel-try">
        <span>Try a word</span>
        <input type="text" maxlength="12" spellcheck="false" autocomplete="off" placeholder="slate">
      </label>
      <div class="wheel-out">
        <div><small>encode</small><code data-enc>—</code></div>
        <div><small>decode</small><code data-dec>—</code></div>
      </div>
      ${opts.onUse ? `<button class="btn secondary wheel-use" data-use>${opts.useLabel || "Use this shift"}</button>` : ""}
      <p class="wheel-hint">Drag or scroll the inner ring. Outer = plain, inner = cipher.</p>`;

    // ---- build SVG ----
    const size = 240, c = size / 2;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("class", "wheel-svg");
    const el = (tag, attrs, parent = svg) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      parent.appendChild(e);
      return e;
    };

    el("circle", { cx: c, cy: c, r: 116, class: "w-outer" });
    // outer (plain) letters, fixed
    for (let i = 0; i < 26; i++) {
      const a = (i * STEP - 90) * (Math.PI / 180);
      const t = el("text", { x: c + Math.cos(a) * 102, y: c + Math.sin(a) * 102, class: "w-plain", "data-i": i });
      t.setAttribute("transform", `rotate(${i * STEP} ${c + Math.cos(a) * 102} ${c + Math.sin(a) * 102})`);
      t.textContent = ABC[i];
    }
    // inner (cipher) disk, rotates
    const inner = el("g", { class: "w-inner" });
    el("circle", { cx: c, cy: c, r: 88, class: "w-disk" }, inner);
    for (let i = 0; i < 26; i++) {
      const a = (i * STEP - 90) * (Math.PI / 180);
      el("line", {
        x1: c + Math.cos(a - STEP / 2 * Math.PI / 180) * 88, y1: c + Math.sin(a - STEP / 2 * Math.PI / 180) * 88,
        x2: c + Math.cos(a - STEP / 2 * Math.PI / 180) * 62, y2: c + Math.sin(a - STEP / 2 * Math.PI / 180) * 62,
        class: "w-tick",
      }, inner);
      const x = c + Math.cos(a) * 75, y = c + Math.sin(a) * 75;
      const t = el("text", { x, y, class: "w-cipher", transform: `rotate(${i * STEP} ${x} ${y})` }, inner);
      t.textContent = ABC[i].toLowerCase();
    }
    el("circle", { cx: c, cy: c, r: 58, class: "w-hub" }, inner);
    // fixed hub text + pointer for "A"
    const hubNum = el("text", { x: c, y: c + 4, class: "w-hubnum" });
    el("text", { x: c, y: c + 22, class: "w-hublabel" }).textContent = "shift";
    el("path", { d: `M ${c - 8} 1 L ${c + 8} 1 L ${c} 12 Z`, class: "w-pointer" });

    const stage = root.querySelector(".wheel-stage");
    stage.appendChild(svg);

    const $ = (sel) => root.querySelector(sel);
    const input = $("input");

    function paint() {
      inner.style.transform = `rotate(${angle}deg)`;
      $("[data-shift]").textContent = shift;
      hubNum.textContent = shift;
      stage.setAttribute("aria-valuenow", shift);
      $("[data-pair]").textContent = `A → ${ABC[shift]}`;
      svg.querySelectorAll(".w-plain").forEach((t) => t.classList.toggle("top", t.dataset.i === "0"));
      const w = input.value.replace(/[^a-z]/gi, "");
      $("[data-enc]").textContent = w ? rot(w, shift).toUpperCase() : "—";
      $("[data-dec]").textContent = w ? rot(w, -shift).toUpperCase() : "—";
      const use = $("[data-use]");
      if (use) use.disabled = shift === 0;
    }

    // Inner letter j sits under outer letter j - shift, so rotate by -shift steps.
    function set(k, animate = true) {
      const target = ((k % 26) + 26) % 26;
      let delta = target - shift;
      if (delta > 13) delta -= 26;
      if (delta < -13) delta += 26;
      shift = target;
      angle -= delta * STEP;
      inner.classList.toggle("instant", !animate);
      paint();
    }

    // ---- interaction ----
    root.querySelectorAll("[data-step]").forEach((b) =>
      b.addEventListener("click", () => set(shift + parseInt(b.dataset.step, 10)))
    );
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(shift + 1); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(shift - 1); }
    });
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      set(shift + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    // drag: follow the pointer, snap to letters
    let drag = null;
    const pointerAngle = (e) => {
      const r = svg.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };
    stage.addEventListener("pointerdown", (e) => {
      drag = { start: pointerAngle(e), angle0: angle, shift0: shift };
      stage.setPointerCapture(e.pointerId);
      inner.classList.add("instant");
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag) return;
      let d = pointerAngle(e) - drag.start;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.start = pointerAngle(e);
      angle += d;
      inner.style.transform = `rotate(${angle}deg)`;
      const k = Math.round(-(angle) / STEP);
      const s = ((k % 26) + 26) % 26;
      if (s !== shift) { shift = s; const keep = angle; paint(); angle = keep; inner.style.transform = `rotate(${angle}deg)`; }
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      inner.classList.remove("instant");
      angle = Math.round(angle / STEP) * STEP; // snap
      paint();
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);

    input.addEventListener("input", paint);
    const use = $("[data-use]");
    if (use) use.addEventListener("click", () => opts.onUse(shift));

    set(0, false);
    return { set: (k) => set(k), get: () => shift, rot };
  };
})();
