(() => {
  "use strict";

  const els = {
    loadError: document.getElementById("load-error"),
    tabs: document.getElementById("category-tabs"),
    categoryLabel: document.getElementById("category-label"),
    input: document.getElementById("value-input"),
    inputError: document.getElementById("input-error"),
    clearBtn: document.getElementById("clear-btn"),
    fromSelect: document.getElementById("from-select"),
    rateInput: document.getElementById("rate-input"),
    rateError: document.getElementById("rate-error"),
    toSelect: document.getElementById("to-select"),
    rateResult: document.getElementById("rate-result"),
    rateCopyBtn: document.getElementById("rate-copy-btn"),
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
    toIdx: 0,
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

  function withThousandsSeparators(numStr) {
    const negative = numStr.startsWith("-");
    const unsigned = negative ? numStr.slice(1) : numStr;
    const [intPart, decPart] = unsigned.split(".");
    const groupedInt = groupIndianStyle(intPart);
    return (negative ? "-" : "") + groupedInt + (decPart ? "." + decPart : "");
  }

  // Indian/Nepali digit grouping: the last 3 digits form one group,
  // then every group to the left is 2 digits — e.g. 100000 -> 1,00,000
  // (one lakh), 10000000 -> 1,00,00,000 (one crore).
  function groupIndianStyle(digits) {
    if (digits.length <= 3) return digits;
    const lastThree = digits.slice(-3);
    const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return `${rest},${lastThree}`;
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
    return withThousandsSeparators(s);
  }

  // ---------- Rendering ----------

  function renderCategoryLabel() {
    const cat = currentCategory();
    els.categoryLabel.textContent = cat ? cat.name : "";
  }

  function renderTabs() {
    els.tabs.innerHTML = "";
    renderCategoryLabel();
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
          state.toIdx = 0;
          renderTabs();
          renderFromSelect();
          renderToSelect();
          renderResults();
          renderRateResult();
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

  function renderToSelect() {
    const cat = currentCategory();
    els.toSelect.innerHTML = "";
    if (!cat) return;

    if (state.toIdx >= cat.units.length) state.toIdx = 0;

    cat.units.forEach((u, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = u.name;
      if (idx === state.toIdx) opt.selected = true;
      els.toSelect.appendChild(opt);
    });
  }

  // Result (In रु) = Converted units * (रु rate of a single unit)
  //
  // Unlike the automatic ledger below (which just shows the value
  // converted into every unit), this takes the value, converts it into
  // whichever unit is chosen in "To", then multiplies that converted
  // amount by a per-unit dollar rate the user supplies — e.g. convert
  // 10 m to feet, then multiply by a $/ft price to get a total cost.
  function renderRateResult() {
    const cat = currentCategory();
    if (!cat) {
      els.rateResult.textContent = "—";
      return;
    }

    const rawValue = els.input.value.trim();
    const rawRate = els.rateInput.value.trim();
    const val = parseFloat(rawValue);
    const rate = parseFloat(rawRate);

    const numberPattern = /^[+-]?[\d.]+([eE][+-]?\d+)?$/;
    const isValueValid = rawValue !== "" && Number.isFinite(val) && numberPattern.test(rawValue);
    const isRateValid = rawRate !== "" && Number.isFinite(rate) && numberPattern.test(rawRate);

    els.rateError.hidden = isRateValid;
    els.rateInput.classList.toggle("invalid", !isRateValid);

    if (!isValueValid || !isRateValid) {
      els.rateResult.textContent = "—";
      return;
    }

    const converted = convertSingle(val, cat, state.fromIdx, state.toIdx);
    if (!Number.isFinite(converted)) {
      els.rateResult.textContent = "—";
      return;
    }

    const result = converted * rate;
    els.rateResult.textContent = `रु ${formatValue(result)}`;
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
        JSON.stringify({
          categoryIdx: state.categoryIdx,
          fromIdx: state.fromIdx,
          toIdx: state.toIdx,
          value: els.input.value,
          rate: els.rateInput.value,
        })
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
      if (cat && Number.isInteger(saved.toIdx) && saved.toIdx < cat.units.length) {
        state.toIdx = saved.toIdx;
      }
      if (typeof saved.value === "string" && saved.value.trim() !== "") {
        els.input.value = saved.value;
      }
      if (typeof saved.rate === "string" && saved.rate.trim() !== "") {
        els.rateInput.value = saved.rate;
      }
    } catch {
      /* ignore malformed saved state */
    }
  }

  // ---------- Events ----------

  els.input.addEventListener("input", () => {
    renderResults();
    renderRateResult();
    saveState();
  });

  els.clearBtn.addEventListener("click", () => {
    els.input.value = "0";
    els.rateInput.value = "0";
    renderResults();
    renderRateResult();
    saveState();
    els.input.focus();
  });

  els.fromSelect.addEventListener("change", () => {
    state.fromIdx = Number(els.fromSelect.value);
    renderResults();
    renderRateResult();
    saveState();
  });

  els.rateInput.addEventListener("input", () => {
    renderRateResult();
    saveState();
  });

  els.toSelect.addEventListener("change", () => {
    state.toIdx = Number(els.toSelect.value);
    renderRateResult();
    saveState();
  });

  els.rateCopyBtn.addEventListener("click", () => {
    const text = els.rateResult.textContent.trim();
    if (!text || text === "—") return;
    copyValue(text, els.rateCopyBtn);
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
      els.categoryLabel.hidden = true;
      document.querySelector(".input-row").hidden = true;
      document.querySelector(".from-row").hidden = true;
      document.querySelector(".rate-row").hidden = true;
      els.resultsList.innerHTML = "";
      return;
    }
    restoreState();
    renderTabs();
    renderFromSelect();
    renderToSelect();
    renderResults();
    renderRateResult();
    updateOfflinePill();
    loadDeveloperInfo();
  })();
})();
