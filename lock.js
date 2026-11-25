/* Schermata PIN: decripta il contenuto e poi avvia l'app. */
(() => {
  const C = window.CONTENUTO;
  const LEN = 6;
  const KEY_STORE = "avvento:chiave";
  const TRIES = "avvento:tentativi";
  const $ = s => document.querySelector(s);
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const tob64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  let pin = "";
  let busy = false;

  async function derive(p) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(p), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(C.salt), iterations: C.iter, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
  }
  async function open(key) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(C.iv) }, key, b64(C.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  function start(dati) {
    Object.assign(window, dati);
    $("#lock").hidden = true;
    const s = document.createElement("script");
    s.src = "app.js";
    document.body.appendChild(s);
  }

  function dots() {
    $("#pin-dots").innerHTML = Array.from({ length: LEN }, (_, i) => `<i class="${i < pin.length ? "on" : ""}"></i>`).join("");
  }
  function msg(t, err) {
    const m = $("#pin-msg");
    m.textContent = t;
    m.classList.toggle("err", !!err);
  }
  function shake() {
    const d = $("#pin-dots");
    d.classList.remove("shake"); void d.offsetWidth; d.classList.add("shake");
  }

  function lockedFor() {
    const t = JSON.parse(ls.get(TRIES) || '{"n":0,"until":0}');
    return Math.max(0, t.until - Date.now());
  }

  async function check() {
    const wait = lockedFor();
    if (wait) { msg(`Troppi tentativi, riprova tra ${Math.ceil(wait / 1000)} secondi`, true); pin = ""; dots(); return; }
    busy = true;
    msg("Apro il calendario…");
    try {
      const key = await derive(pin);
      const dati = await open(key);
      ls.del(TRIES);
      if ($("#pin-remember").checked) ls.set(KEY_STORE, tob64(await crypto.subtle.exportKey("raw", key)));
      start(dati);
    } catch {
      const t = JSON.parse(ls.get(TRIES) || '{"n":0,"until":0}');
      t.n++;
      if (t.n >= 5) { t.n = 0; t.until = Date.now() + 30000; }
      ls.set(TRIES, JSON.stringify(t));
      shake();
      msg(t.until > Date.now() ? "Troppi tentativi, riprova tra 30 secondi" : "PIN sbagliato, riprova", true);
      pin = ""; dots();
    }
    busy = false;
  }

  function press(k) {
    if (busy) return;
    if (k === "del") pin = pin.slice(0, -1);
    else if (pin.length < LEN) pin += k;
    dots();
    if (pin.length === LEN) setTimeout(check, 120);
  }

  async function init() {
    if (!C || !window.crypto || !crypto.subtle) {
      msg("Questo browser non riesce ad aprire il calendario. Prova con Safari o Chrome aggiornati.", true);
      return;
    }
    // telefono già sbloccato in passato
    const saved = ls.get(KEY_STORE);
    if (saved) {
      try {
        const key = await crypto.subtle.importKey("raw", b64(saved), { name: "AES-GCM" }, false, ["decrypt"]);
        return start(await open(key));
      } catch { ls.del(KEY_STORE); }
    }
    $("#lock").hidden = false;
    dots();
    document.querySelectorAll("#keypad [data-k]").forEach(b => (b.onclick = () => press(b.dataset.k)));
    document.addEventListener("keydown", e => {
      if ($("#lock").hidden) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    });
  }
  init();
})();
