(() => {
  "use strict";

  const els = {
    loadError: document.getElementById("load-error"),
    tabs: document.getElementById("category-tabs"),
    input: document.getElementById("value-input"),
    inputError: document.getElementById("input-error"),
    clearBtn: document.getElementById("clear-btn"),
    fromSelect: document.getElementById("from-select"),
    resultsList: document.getElementById("results-list"),
    rowTemplate: document.getElementById("result-row-template"),
    installBtn: document.getElementById("install-btn"),
    offlinePill: document.getElementById("offline-pill"),
    developerInfo: document.getElementById("developer-info"),
  };

  const STORAGE_KEY = "uc:last-state";

  const state = {
    data: { categories: [] },
    categoryIdx: 0,
    fromIdx: 0,
  };

  // ---------- Data loading ----------

  async function loadUnits() {
    try {
      const res = await fetch("units.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = await res.json();

      if (!parsed || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
        throw new Error("units.json has no categories");
      }
      state.data = parsed;
    } catch (err) {
      showLoadError(
        `Couldn't load units.json (${err.message}). The converter can't run without unit data — try reloading, or check your connection if this is the first launch.`
      );
      state.data = { categories: [] };
    }
  }

  function showLoadError(message) {
    els.loadError.textContent = message;
    els.loadError.hidden = false;
  }

  // ---------- Conversion math (mirrors the original ratio/formula logic) ----------

  function convertSingle(val, category, fromIdx, toIdx) {
    if (category.type === "formula") {
      // Source -> Celsius base
      let celsius;
      switch (fromIdx) {
        case 0: celsius = val; break;                      // °C
        case 1: celsius = (val - 32) * 5 / 9; break;        // °F
        case 2: celsius = val - 273.15; break;              // K
        default: celsius = val;
      }
      // Celsius base -> target
      switch (toIdx) {
        case 0: return celsius;                             // °C
        case 1: return (celsius * 9) / 5 + 32;               // °F
        case 2: return celsius + 273.15;                     // K
        default: return celsius;
      }
    }

    const fromRatio = category.units[fromIdx]?.ratio ?? 1;
    const toRatio = category.units[toIdx]?.ratio ?? 1;
    if (toRatio === 0) return NaN;
    return (val * fromRatio) / toRatio;
  }

  function formatValue(n) {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) < 0.00001 && n !== 0) {
      return n.toExponential(6);
    }
    let s = n.toFixed(6);
    if (s.includes(".")) {
      s = s.replace(/0+$/, "").replace(/\.$/, "");
    }
    return s;
  }

  // ---------- Rendering ----------

  function renderTabs() {
    els.tabs.innerHTML = "";
    state.data.categories.forEach((cat, idx) => {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.type = "button";
      btn.textContent = cat.name;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(idx === state.categoryIdx));
      btn.addEventListener("click", () => {
        if (state.categoryIdx !== idx) {
          state.categoryIdx = idx;
          state.fromIdx = 0;
          renderTabs();
          renderFromSelect();
          renderResults();
          saveState();
        }
      });
      els.tabs.appendChild(btn);
    });
  }

  function currentCategory() {
    return state.data.categories[state.categoryIdx] || null;
  }

  function renderFromSelect() {
    const cat = currentCategory();
    els.fromSelect.innerHTML = "";
    if (!cat) return;

    if (state.fromIdx >= cat.units.length) state.fromIdx = 0;

    cat.units.forEach((u, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = u.name;
      if (idx === state.fromIdx) opt.selected = true;
      els.fromSelect.appendChild(opt);
    });
  }

  function renderResults() {
    const cat = currentCategory();
    els.resultsList.innerHTML = "";
    if (!cat) return;

    const raw = els.input.value.trim();
    const val = parseFloat(raw);
    const isValid = raw !== "" && Number.isFinite(val) && /^[+-]?[\d.]+([eE][+-]?\d+)?$/.test(raw);

    els.inputError.hidden = isValid;
    els.input.classList.toggle("invalid", !isValid);

    if (!isValid) return;

    cat.units.forEach((unit, idx) => {
      const converted = convertSingle(val, cat, state.fromIdx, idx);
      const formatted = formatValue(converted);

      const frag = els.rowTemplate.content.cloneNode(true);
      const row = frag.querySelector(".ledger-row");
      const unitEl = frag.querySelector(".ledger-unit");
      const valueEl = frag.querySelector(".ledger-value");
      const copyBtn = frag.querySelector(".copy-btn");

      const isSource = idx === state.fromIdx;
      if (isSource) row.classList.add("is-source");
      unitEl.textContent = isSource ? `${unit.name} (Source)` : unit.name;
      valueEl.textContent = formatted;

      copyBtn.addEventListener("click", () => copyValue(formatted, copyBtn));

      els.resultsList.appendChild(frag);
    });
  }

  async function copyValue(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without Clipboard API access
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    btn.classList.add("copied");
    setTimeout(() => btn.classList.remove("copied"), 900);
  }

  // ---------- Persistence ----------

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ categoryIdx: state.categoryIdx, fromIdx: state.fromIdx, value: els.input.value })
      );
    } catch {
      /* storage unavailable — ignore */
    }
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Number.isInteger(saved.categoryIdx) && saved.categoryIdx < state.data.categories.length) {
        state.categoryIdx = saved.categoryIdx;
      }
      const cat = currentCategory();
      if (cat && Number.isInteger(saved.fromIdx) && saved.fromIdx < cat.units.length) {
        state.fromIdx = saved.fromIdx;
      }
      if (typeof saved.value === "string" && saved.value.trim() !== "") {
        els.input.value = saved.value;
      }
    } catch {
      /* ignore malformed saved state */
    }
  }

  // ---------- Events ----------

  els.input.addEventListener("input", () => {
    renderResults();
    saveState();
  });

  els.clearBtn.addEventListener("click", () => {
    els.input.value = "0";
    renderResults();
    saveState();
    els.input.focus();
  });

  els.fromSelect.addEventListener("change", () => {
    state.fromIdx = Number(els.fromSelect.value);
    renderResults();
    saveState();
  });

  // ---------- Offline indicator ----------

  function updateOfflinePill() {
    els.offlinePill.hidden = navigator.onLine;
  }
  window.addEventListener("online", updateOfflinePill);
  window.addEventListener("offline", updateOfflinePill);

  // ---------- Developer info (from manifest.json) ----------

  async function loadDeveloperInfo() {
    try {
      const res = await fetch("manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const manifest = await res.json();
      const dev = manifest.developer;
      if (!dev || !dev.name) return;

      els.developerInfo.textContent = `by ${dev.name}`;
      if (dev.url) {
        els.developerInfo.href = dev.url;
      } else {
        els.developerInfo.removeAttribute("href");
        els.developerInfo.removeAttribute("target");
        els.developerInfo.removeAttribute("rel");
      }
      els.developerInfo.hidden = false;
    } catch {
      // No developer info available — leave the footer link hidden.
    }
  }

  // ---------- Install prompt ----------

  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    els.installBtn.hidden = false;
  });
  els.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installBtn.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    els.installBtn.hidden = true;
  });

  // ---------- Service worker ----------

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        /* offline support just won't be available — app still works online */
      });
    });
  }

  // ---------- Boot ----------

  (async function init() {
    await loadUnits();
    if (state.data.categories.length === 0) {
      els.tabs.hidden = true;
      document.querySelector(".input-row").hidden = true;
      document.querySelector(".from-row").hidden = true;
      els.resultsList.innerHTML = "";
      return;
    }
    restoreState();
    renderTabs();
    renderFromSelect();
    renderResults();
    updateOfflinePill();
    loadDeveloperInfo();
  })();
})();
