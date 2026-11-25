/* =========================================================
   CALENDARIO DELL'AVVENTO — LOGICA
   ========================================================= */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const params = new URLSearchParams(location.search);
  const PREVIEW = params.has("anteprima") || window.FORCE_PREVIEW === true;
  const KEY = "avvento" + CONFIG.anno + (PREVIEW ? "-anteprima" : "") + ":";

  /* ---------- salvataggio (con fallback in memoria) ---------- */
  const mem = {};
  const store = {
    get(k, def) {
      try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : def; }
      catch { return k in mem ? mem[k] : def; }
    },
    set(k, v) {
      try { localStorage.setItem(KEY + k, JSON.stringify(v)); }
      catch { mem[k] = v; }
    },
    clear() {
      try { Object.keys(localStorage).filter(k => k.startsWith(KEY)).forEach(k => localStorage.removeItem(k)); } catch {}
      Object.keys(mem).forEach(k => delete mem[k]);
    },
  };

  /* ---------- date ---------- */
  const unlockDate = d => new Date(CONFIG.anno, 11, d, 0, 0, 0);
  const isUnlocked = d => PREVIEW || new Date() >= unlockDate(d);
  const isToday = d => {
    const n = new Date();
    return n.getFullYear() === CONFIG.anno && n.getMonth() === 11 && n.getDate() === d;
  };
  const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  const saluto = d => {
    const g = GIORNI[unlockDate(d).getDay()];
    return `${g === "domenica" ? "Buona" : "Buon"} ${g}, ${CONFIG.nome}!`;
  };
  const greetHTML = (d, cls = "") =>
    BUONGIORNO[d] ? `<div class="greet ${cls}"><p class="greet-hi">${saluto(d)}</p><p>${BUONGIORNO[d].replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</p></div>` : "";
  const typeOf = d => (d === 7 ? "special" : BIRRE[d] ? "beer" : "wheel");

  /* ---------- layout griglia ---------- */
  const SPAN = { 1: "big", 4: "wide", 7: "big", 10: "tall", 13: "wide", 16: "tall", 19: "wide", 22: "wide", 25: "xl" };
  const PATTERNS = ["p-sg", "p-rf", "p-gs", "p-rd", "p-cr", "p-rs"];
  const DECO = { 1: "🍪", 4: "🎁", 10: "🧦", 13: "🔔", 16: "🎅", 19: "⭐", 22: "🦌", 25: "🎄" };
  const LOCK_SVG = '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  /* ---------- schermate ---------- */
  function show(id) {
    ["intro", "calendar", "diary"].forEach(s => ($("#" + s).hidden = s !== id));
    $("#nav").hidden = id === "intro";
    document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("active", b.dataset.go === id));
    if (id === "diary") renderDiary();
    if (id === "calendar") renderGrid();
    window.scrollTo(0, 0);
  }

  function initIntro() {
    $("#intro-name").textContent = CONFIG.nome;
    const snow = $(".snow");
    for (let i = 0; i < 22; i++) {
      const f = document.createElement("i");
      f.textContent = "❄";
      f.style.left = Math.random() * 100 + "%";
      f.style.fontSize = 10 + Math.random() * 16 + "px";
      f.style.animationDuration = 8 + Math.random() * 10 + "s";
      f.style.animationDelay = -Math.random() * 15 + "s";
      snow.appendChild(f);
    }
    $("#start-btn").onclick = () => { store.set("intro", true); show("calendar"); };
  }

  /* ---------- countdown ---------- */
  function todayGreeting() {
    const n = new Date();
    const el = $("#today-greet");
    if (n.getFullYear() === CONFIG.anno && n.getMonth() === 11 && BUONGIORNO[n.getDate()]) {
      el.innerHTML = greetHTML(n.getDate());
      el.hidden = false;
    } else el.hidden = true;
  }

  function tick() {
    const xmas = new Date(CONFIG.anno, 11, 25, 0, 0, 0);
    let diff = xmas - new Date();
    if (diff <= 0) {
      $("#cd-title").textContent = "Buon Natale!";
      $("#cd-row").innerHTML = '<span class="xmas-msg">🎄 è arrivato 🎄</span>';
      return;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);
    $("#cd-d").textContent = String(d).padStart(2, "0");
    $("#cd-h").textContent = String(h).padStart(2, "0");
    $("#cd-m").textContent = String(m).padStart(2, "0");
  }

  /* ---------- griglia ---------- */
  function renderGrid() {
    const grid = $("#grid");
    grid.innerHTML = "";
    const opened = store.get("opened", {});
    const wheels = store.get("wheels", {});
    const revealed = store.get("revealed", {});
    for (let d = 1; d <= 25; d++) {
      const t = document.createElement("button");
      t.type = "button";
      const type = typeOf(d);
      const pat = d === 7 ? "p-wine" : PATTERNS[(d * 7) % PATTERNS.length];
      t.className = `tile ${pat} ${SPAN[d] || ""}`;
      t.style.animationDelay = d * 25 + "ms";
      const kind = type === "beer" ? "🍺" : type === "special" ? "🍷" : "🎡";
      let html = `<span class="num">${d}</span><span class="kind">${kind}</span>`;
      if (DECO[d]) html += `<span class="deco">${DECO[d]}</span>`;
      if (!isUnlocked(d)) html += LOCK_SVG;
      t.innerHTML = html;

      if (type === "beer" && revealed[d]) {
        t.classList.add("opened-beer");
        t.style.backgroundImage = `url('${BIRRE[d].img}')`;
        const deco = t.querySelector(".deco"); if (deco) deco.remove();
      } else if (type === "beer" && opened[d]) {
        t.classList.add("teased");
        t.style.background = BIRRE[d].colore;
        t.style.setProperty("--tt", BIRRE[d].coloreTesto);
      }
      if ((type === "wheel" || type === "special") && wheels[d]) t.classList.add("done-wheel");
      if (isToday(d)) t.classList.add("today");
      t.setAttribute("aria-label", `Giorno ${d}`);
      t.onclick = () => openDay(d);
      grid.appendChild(t);
    }
  }

  function openDay(d) {
    if (!isUnlocked(d)) {
      const n = new Date();
      const days = Math.ceil((unlockDate(d) - n) / 864e5);
      toast(days > 1 ? `Pazienza! Si apre il ${d} dicembre 🎄 (tra ${days} giorni)` : `Pazienza! Si apre il ${d} dicembre 🎄`);
      return;
    }
    const type = typeOf(d);
    if (type === "beer") openBeer(d);
    else if (type === "special") openSpecial();
    else openWheel(d);
  }

  /* ---------- modale ---------- */
  const modal = $("#modal");
  function openModal(html, cls = "") {
    $("#sheet-body").innerHTML = html;
    const sheet = $(".sheet");
    sheet.className = "sheet " + cls;
    sheet.style.background = "";
    sheet.scrollTop = 0;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    renderGrid();
  }
  modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  /* ---------- birra ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const intensita = abv => {
    const v = parseFloat(String(abv).replace(",", "."));
    if (isNaN(v)) return { n: 2, t: "da scoprire" };
    return v < 5.5 ? { n: 1, t: "leggera" } : v < 7 ? { n: 2, t: "media" } : { n: 3, t: "importante" };
  };
  const tempHint = t => {
    const v = parseFloat(String(t));
    return v <= 5 ? "ben fredda ❄️" : v <= 7 ? "fresca" : "fresca, non gelata";
  };
  const canReveal = () => PREVIEW || new Date().getHours() >= (CONFIG.oraSvelamento ?? 18);

  function openBeer(d) {
    const revealed = store.get("revealed", {});
    if (revealed[d]) return openBeerFull(d, false);
    openTeaser(d);
  }

  function openTeaser(d) {
    const b = BIRRE[d];
    const seen = store.get("opened", {});
    const first = !seen[d];
    seen[d] = true; store.set("opened", seen);
    const it = intensita(b.abv);
    const ok = canReveal();
    const ora = CONFIG.oraSvelamento ?? 18;
    const html = `
      <div class="teaser" style="--tc:${b.colore};--tt:${b.coloreTesto}">
        ${greetHTML(d, "on-color")}
        <p class="day-label">${d} dicembre</p>
        <h3 class="teaser-title">La birra di stasera</h3>
        ${b.annuncio ? `<p class="teaser-annuncio">${esc(b.annuncio.toUpperCase())}</p>` : ""}
        ${b.intro ? `<div class="teaser-intro">${esc(b.intro)}</div>` : ""}
        <div class="words">${b.parole.map((w, i) => `<span style="animation-delay:${0.2 + i * 0.35}s">${esc(w)}</span>`).join("")}</div>
        <div class="hints">
          <div><em>Gradazione</em><b>${"●".repeat(it.n)}${"○".repeat(3 - it.n)}</b><small>${it.t}</small></div>
          <div><em>Da servire</em><b>🌡️</b><small>${tempHint(b.temp)}</small></div>
        </div>
        <p class="teaser-foot">Il nome lo scopri stasera, aprendola. 🍺</p>
        <button type="button" class="btn-reveal" id="reveal-btn" ${ok ? "" : "disabled"}>
          ${ok ? "L'ho aperta! Svela tutto" : `Si svela dalle ${ora}:00 🔒`}
        </button>
      </div>`;
    openModal(html, "teaser-sheet");
    $(".sheet").style.background = b.colore;
    const rb = $("#reveal-btn");
    if (ok) rb.onclick = () => {
      const r = store.get("revealed", {}); r[d] = true; store.set("revealed", r);
      openBeerFull(d, true);
    };
    if (first) confetti([b.colore, b.coloreTesto, "#f4efdf"]);
  }

  function openBeerFull(d, celebrate) {
    const b = BIRRE[d];
    $(".sheet").style.background = "";
    const rating = store.get("ratings", {})[d] || 0;
    const fact = (t, v) => (v ? `<div class="fact"><h4>${t}</h4><p>${esc(v)}</p></div>` : "");
    const html = `
      <div class="beer-hero">
        <div class="blur" style="background-image:url('${b.img}')"></div>
        <img src="${b.img}" alt="Etichetta ${esc(b.nome)}">
      </div>
      <div class="beer-body">
        <p class="day-label">${d} dicembre</p>
        <h3 class="beer-name">${esc(b.nome)}</h3>
        <p class="beer-brewery">${esc(b.birrificio)}</p>
        <div class="chips">
          <span class="chip">${esc(b.stile)}</span>
          ${b.abv ? `<span class="chip red">${esc(b.abv)} vol</span>` : ""}
          <span class="chip gold">🌡️ ${esc(b.temp)}</span>
          <span class="chip">${esc(b.formato)}</span>
        </div>
        <div class="facts">
          ${fact("Aspetto", b.aspetto)}
          ${fact("Al naso e in bocca", b.gusto)}
          ${fact("Da abbinare con", b.abbinamenti)}
          ${fact("Lo sapevi?", b.curiosita)}
        </div>
        ${b.nota ? `<div class="love-note">${esc(b.nota)}<small>— ${esc(CONFIG.firma)}</small></div>` : ""}
        <div class="rating">
          <p>Quanto ti è piaciuta?</p>
          <div class="stars">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${i}" class="${i <= rating ? "on" : ""}" aria-label="${i} stelle">🍺</button>`).join("")}</div>
        </div>
      </div>`;
    openModal(html);
    $("#sheet-body").querySelectorAll("[data-star]").forEach(btn => {
      btn.onclick = () => {
        const v = +btn.dataset.star;
        const r = store.get("ratings", {}); r[d] = v; store.set("ratings", r);
        $("#sheet-body").querySelectorAll("[data-star]").forEach(x => x.classList.toggle("on", +x.dataset.star <= v));
        toast(v >= 4 ? "Promossa a pieni voti! 🍻" : "Voto salvato ✍️");
      };
    });
    if (celebrate) confetti();
  }

  /* ---------- ruota ---------- */
  const SLICE_COLORS = ["#c8262e", "#2e5a1c", "#f4efdf", "#a8222b", "#5c8f3c", "#e9e1c6", "#7d1820", "#3a6925"];
  const TEXT_COLORS = { "#f4efdf": "#7d1820", "#e9e1c6": "#2e5a1c", "#5c8f3c": "#fff" };

  function wheelSVG(labels) {
    const n = labels.length, cx = 150, cy = 150, r = 146, seg = 360 / n;
    const pt = (a, rad) => [cx + rad * Math.sin(a * Math.PI / 180), cy - rad * Math.cos(a * Math.PI / 180)];
    let s = `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="149" fill="#c9a24a"/>`;
    labels.forEach((lab, i) => {
      const a0 = i * seg, a1 = (i + 1) * seg;
      const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
      const fill = SLICE_COLORS[i % SLICE_COLORS.length];
      s += `<path d="M150 150 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${fill}" stroke="#c9a24a" stroke-width="1.5"/>`;
      const mid = a0 + seg / 2;
      const tc = TEXT_COLORS[fill] || "#fff";
      const parts = lab.split("|");
      s += `<g transform="rotate(${mid} 150 150)">`;
      s += `<text x="150" y="${parts[1] ? 44 : 52}" text-anchor="middle" font-size="22">${parts[0]}</text>`;
      if (parts[1]) s += `<text x="150" y="68" text-anchor="middle" font-family="Poppins, sans-serif" font-size="${parts[1].length > 11 ? 8.5 : 10.5}" font-weight="600" fill="${tc}">${esc(parts[1])}</text>`;
      s += `</g>`;
    });
    // pallini dorati sul bordo
    for (let i = 0; i < n * 2; i++) { const [x, y] = pt(i * seg / 2, 141); s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#f4efdf"/>`; }
    return s + "</svg>";
  }

  function spinTo(rotEl, index, n, extraTurns = 6) {
    const seg = 360 / n;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = extraTurns * 360 + (360 - (index * seg + seg / 2)) + jitter;
    rotEl.classList.remove("no-anim");
    rotEl.style.transform = "rotate(0deg)";
    void rotEl.offsetWidth; // forza il browser a ripartire da zero prima di girare
    rotEl.style.transform = `rotate(${target}deg)`;
    return target;
  }

  function pickPrompt(level, cat) {
    const used = store.get("used", []);
    const pool = SFIDE[level][cat] || [];
    const fresh = pool.filter(p => !used.includes(p));
    const list = fresh.length ? fresh : pool;
    const p = list[Math.floor(Math.random() * list.length)];
    used.push(p); store.set("used", used);
    return p;
  }

  function openWheel(d) {
    const level = LIVELLI[d];
    const cats = SPICCHI[level].filter(c => (SFIDE[level][c] || []).length); // spicchi senza sfide vengono tolti
    const labels = cats.map(c => `${CATEGORIE[c].emoji}|${CATEGORIE[c].label}`);
    const saved = store.get("wheels", {})[d];

    const html = `
      <div class="wheel-body">
        ${greetHTML(d)}
        <p class="day-label">${d} dicembre</p>
        <h3 class="beer-name">Ruota della fortuna</h3>
        <span class="wheel-level">Livello: ${NOMI_LIVELLI[level]}</span>
        <div class="wheel-wrap">
          <div class="wheel-pointer"></div>
          <div class="wheel-rot" id="wheel-rot">${wheelSVG(labels)}</div>
          <div class="wheel-hub">🎄</div>
        </div>
        <div id="wheel-action"></div>
        <div id="wheel-result"></div>
      </div>`;
    openModal(html);
    const rot = $("#wheel-rot");

    const showResult = res => {
      $("#wheel-result").innerHTML = `<div class="result"><p class="cat">${CATEGORIE[res.cat].emoji} ${CATEGORIE[res.cat].label}</p><p>${esc(res.text)}</p></div>`;
      $("#wheel-action").innerHTML = PREVIEW ? `<button class="btn-ghost" type="button" id="respin">Rigira (solo anteprima)</button>` : "";
      const rb = $("#respin"); if (rb) rb.onclick = () => { const w = store.get("wheels", {}); delete w[d]; store.set("wheels", w); openWheel(d); };
    };

    if (saved) {
      rot.classList.add("no-anim");
      rot.style.transform = `rotate(${saved.rot}deg)`;
      showResult(saved);
      return;
    }
    $("#wheel-action").innerHTML = `<button class="btn-primary" type="button" id="spin">Gira la ruota!</button>`;
    $("#spin").onclick = () => {
      $("#wheel-action").innerHTML = "";
      const idx = Math.floor(Math.random() * cats.length);
      const target = spinTo(rot, idx, cats.length);
      const res = { cat: cats[idx], text: pickPrompt(level, cats[idx]), rot: target };
      setTimeout(() => {
        const w = store.get("wheels", {}); w[d] = res; store.set("wheels", w);
        showResult(res); confetti();
      }, 5100);
    };
  }

  /* ---------- giorno 7 ---------- */
  function openSpecial() {
    const g = GIORNO7;
    const saved = store.get("wheels", {})[7];
    const labels = g.spicchi.map(s => {
      const m = s.match(/^(.*?)\s*(\p{Extended_Pictographic})?$/u);
      return (m && m[2] ? m[2] : "🍷") + "|" + (m ? m[1] : s);
    });
    const html = `
      <div class="wine-body">
        ${greetHTML(7, "on-color")}
        <p class="day-label">7 dicembre</p>
        <h3>${esc(g.titolo)}</h3>
        <p class="wine-phrase">${esc(g.frase)}</p>
        <div class="wheel-wrap">
          <div class="wheel-pointer"></div>
          <div class="wheel-rot" id="wheel-rot">${wheelSVG(labels)}</div>
          <div class="wheel-hub">🍷</div>
        </div>
        <div id="wheel-action"></div>
        <div id="wheel-result"></div>
      </div>`;
    openModal(html, "wine");
    const rot = $("#wheel-rot");

    const showChallenge = () => {
      $("#wheel-result").innerHTML = `
        <div class="result">
          <p class="cat">${esc(g.sfida.titolo)}</p>
          <p>${esc(g.sfida.testo)}</p>
        </div>
        <div class="photo-grid" id="photo-grid"></div>
        <p class="photo-count" id="photo-count"></p>
        <div id="collage-action"></div>`;
      renderPhotos();
    };

    if (saved) {
      rot.classList.add("no-anim");
      rot.style.transform = `rotate(${saved.rot}deg)`;
      showChallenge();
      return;
    }
    $("#wheel-action").innerHTML = `<button class="btn-gold" type="button" id="spin">Gira la ruota fuori casa</button>`;
    $("#spin").onclick = () => {
      $("#wheel-action").innerHTML = "";
      const target = spinTo(rot, 0, labels.length); // sempre la sfida fotografica
      setTimeout(() => {
        const w = store.get("wheels", {}); w[7] = { cat: "foto", text: g.sfida.titolo, rot: target }; store.set("wheels", w);
        showChallenge(); confetti(["#c9a24a", "#f4e7c8", "#8e1a2c"]);
      }, 5100);
    };
  }

  let photoSlot = 0;
  function renderPhotos() {
    const photos = store.get("photos7", Array(9).fill(null));
    const grid = $("#photo-grid"); if (!grid) return;
    grid.innerHTML = photos.map((p, i) =>
      `<button type="button" class="photo-cell" data-slot="${i}" aria-label="Foto ${i + 1}">${p ? `<img src="${p}" alt="">` : i + 1}</button>`
    ).join("");
    grid.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => { photoSlot = +b.dataset.slot; $("#photo-input").click(); });
    const count = photos.filter(Boolean).length;
    $("#photo-count").textContent = count === 9 ? "Sfida completata! 🍷 Tocca una foto per cambiarla." : `${count} / 9 foto rosso vino`;
    $("#collage-action").innerHTML = count === 9 ? `<button class="btn-gold" type="button" id="collage-btn">Salva il collage</button>` : "";
    const cb = $("#collage-btn"); if (cb) cb.onclick = saveCollage;
  }

  $("#photo-input").addEventListener("change", e => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const S = 600, c = document.createElement("canvas");
      c.width = c.height = S;
      const m = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
      const data = c.toDataURL("image/jpeg", 0.72);
      URL.revokeObjectURL(url);
      const photos = store.get("photos7", Array(9).fill(null));
      const wasFull = photos.filter(Boolean).length === 9;
      photos[photoSlot] = data;
      store.set("photos7", photos);
      renderPhotos();
      if (!wasFull && photos.filter(Boolean).length === 9) confetti(["#c9a24a", "#f4e7c8", "#8e1a2c"]);
    };
    img.src = url;
  });

  function saveCollage() {
    const photos = store.get("photos7", []);
    const S = 400, pad = 12, band = 110, W = S * 3 + pad * 4;
    const c = document.createElement("canvas");
    c.width = W; c.height = W + band;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#4a1020"; ctx.fillRect(0, 0, c.width, c.height);
    let loaded = 0;
    photos.forEach((p, i) => {
      const im = new Image();
      im.onload = () => {
        ctx.drawImage(im, pad + (i % 3) * (S + pad), pad + Math.floor(i / 3) * (S + pad), S, S);
        if (++loaded === 9) finish();
      };
      im.src = p;
    });
    function finish() {
      ctx.fillStyle = "#c9a24a"; ctx.textAlign = "center";
      ctx.font = "44px Limelight, Georgia, serif";
      ctx.fillText("Sfida Rosso Vino", W / 2, W + 52);
      ctx.font = "26px Poppins, sans-serif"; ctx.fillStyle = "#f4e7c8";
      ctx.fillText(`7 dicembre ${CONFIG.anno} · Cantina Mottura & N'uovo`, W / 2, W + 90);
      c.toBlob(async blob => {
        const file = new File([blob], "sfida-rosso-vino.jpg", { type: "image/jpeg" });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Sfida Rosso Vino" }); return; }
        } catch (err) { if (err.name === "AbortError") return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, "image/jpeg", 0.9);
    }
  }

  /* ---------- diario ---------- */
  function renderDiary() {
    const opened = store.get("revealed", {});
    const teased = store.get("opened", {});
    const ratings = store.get("ratings", {});
    const wheels = store.get("wheels", {});
    const photos = store.get("photos7", []);
    let html = "";
    for (let d = 1; d <= 25; d++) {
      const type = typeOf(d);
      if (type === "beer" && opened[d]) {
        const b = BIRRE[d], r = ratings[d];
        html += `<div class="d-item"><div class="d-thumb" style="background-image:url('${b.img}')"></div>
          <div><h4>${d} dic · ${esc(b.nome)}</h4><p>${esc(b.stile)}${b.abv ? " · " + esc(b.abv) : ""}</p><p>${r ? "🍺".repeat(r) : "Ancora da votare"}</p></div></div>`;
      } else if (type === "beer" && teased[d]) {
        const b = BIRRE[d];
        html += `<div class="d-item"><div class="d-thumb" style="background:${b.colore};color:${b.coloreTesto}">?</div>
          <div><h4>${d} dic · Birra misteriosa</h4><p>${b.parole.map(esc).join(" · ")}</p><p>Si svela stasera</p></div></div>`;
      } else if (type === "wheel" && wheels[d]) {
        const w = wheels[d];
        html += `<div class="d-item"><div class="d-thumb">${CATEGORIE[w.cat].emoji}</div>
          <div><h4>${d} dic · ${CATEGORIE[w.cat].label}</h4><p>${esc(w.text)}</p></div></div>`;
      } else if (type === "special" && wheels[7]) {
        html += `<div class="d-item"><div class="d-thumb">🍷</div><div><h4>7 dic · Sfida Rosso Vino</h4><p>Cantina Mottura & N'uovo</p></div></div>`;
        const ph = photos.filter(Boolean);
        if (ph.length) html += `<div class="d-collage">${ph.map(p => `<img src="${p}" alt="">`).join("")}</div>`;
      }
    }
    $("#diary-list").innerHTML = html || `<p class="d-empty">Ancora niente qui.<br>Apri la prima casella per iniziare! 🎄</p>`;
  }

  /* ---------- effetti ---------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function confetti(colors = ["#c8262e", "#2e5a1c", "#f4efdf", "#c9a24a", "#5c8f3c"]) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  /* ---------- avvio ---------- */
  document.querySelectorAll("#nav button").forEach(b => (b.onclick = () => show(b.dataset.go)));
  if (PREVIEW) {
    $("#preview-banner").hidden = false;
    $("#reset-btn").onclick = e => {
      const b = e.currentTarget;
      if (b.dataset.sure) { store.clear(); location.reload(); return; }
      b.dataset.sure = "1"; b.textContent = "Sicura? Tocca ancora";
      setTimeout(() => { delete b.dataset.sure; b.textContent = "Azzera"; }, 3000);
    };
  }
  initIntro();
  tick(); setInterval(tick, 20000); todayGreeting();
  show(store.get("intro", false) ? "calendar" : "intro");
})();
