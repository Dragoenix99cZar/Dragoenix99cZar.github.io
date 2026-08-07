/* ---------- nav / tabs ---------- */
const slots = document.querySelectorAll('.slot');
const panels = document.querySelectorAll('.panel');
slots.forEach(slot => {
  slot.addEventListener('click', () => {
    slots.forEach(s => { s.classList.remove('active'); s.removeAttribute('aria-current'); });
    slot.classList.add('active'); slot.setAttribute('aria-current', 'true');
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === slot.dataset.tool));
  });
});

document.querySelectorAll('[data-subtabs]').forEach(group => {
  const name = group.dataset.subtabs;
  const panel = group.parentElement;
  group.querySelectorAll('.subtab').forEach(tab => {
    tab.addEventListener('click', () => {
      group.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panel.querySelectorAll('.subpanel').forEach(sp => sp.classList.toggle('active', sp.dataset.subPanel === tab.dataset.sub));
    });
  });
});

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(() => t.classList.remove('show'), 1400);
}
function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => toast('Copied')).catch(() => toast('Copy failed'));
}

/* ---------- 01 color converter ---------- */
(function () {
  const pick = document.getElementById('colorPick');
  const hex = document.getElementById('colorHex');
  const rgb = document.getElementById('colorRgb');
  const hsl = document.getElementById('colorHsl');
  const readout = document.getElementById('colorReadout');
  const shadesEl = document.getElementById('paletteShades');
  const harmonyEl = document.getElementById('paletteHarmony');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function hslToRgb({ h, s, l }) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return {
      r: hue2rgb(p, q, h + 1 / 3) * 255,
      g: hue2rgb(p, q, h) * 255,
      b: hue2rgb(p, q, h - 1 / 3) * 255
    };
  }

  function setSwatchClick(el, hexVal) {
    el.style.background = hexVal;
    el.title = hexVal;
    el.addEventListener('click', () => copyText(hexVal));
  }

  function renderPalette(baseHex) {
    const baseRgb = hexToRgb(baseHex);
    const baseHsl = rgbToHsl(baseRgb);

    shadesEl.innerHTML = '';
    [-40, -20, 0, 20, 40].forEach(delta => {
      const l = clamp(baseHsl.l + delta, 4, 96);
      const h = rgbToHex(hslToRgb({ h: baseHsl.h, s: baseHsl.s, l }));
      const sw = document.createElement('div');
      sw.className = 'swatch';
      setSwatchClick(sw, h);
      shadesEl.appendChild(sw);
    });

    harmonyEl.innerHTML = '';
    [180, -30, 30, 150, -150].forEach(delta => {
      const h = ((baseHsl.h + delta) % 360 + 360) % 360;
      const hexVal = rgbToHex(hslToRgb({ h, s: baseHsl.s, l: baseHsl.l }));
      const sw = document.createElement('div');
      sw.className = 'swatch';
      setSwatchClick(sw, hexVal);
      harmonyEl.appendChild(sw);
    });
  }

  function update(source, hexVal) {
    const rgbVal = hexToRgb(hexVal);
    if (!rgbVal) return;
    const hslVal = rgbToHsl(rgbVal);
    if (source !== 'hex') hex.value = hexVal;
    if (source !== 'rgb') rgb.value = `${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}`;
    if (source !== 'hsl') hsl.value = `${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%`;
    pick.value = hexVal;
    readout.textContent = hexVal.toUpperCase();
    readout.style.color = hexVal;
    renderPalette(hexVal);
  }

  pick.addEventListener('input', () => update('pick', pick.value));
  hex.addEventListener('input', () => { if (hexToRgb(hex.value)) update('hex', hex.value.startsWith('#') ? hex.value : '#' + hex.value); });
  rgb.addEventListener('input', () => {
    const m = rgb.value.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (m) update('rgb', rgbToHex({ r: +m[1], g: +m[2], b: +m[3] }));
  });
  hsl.addEventListener('input', () => {
    const m = hsl.value.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (m) update('hsl', rgbToHex(hslToRgb({ h: +m[1], s: +m[2], l: +m[3] })));
  });

  update('init', pick.value);
})();

/* ---------- 02 base converter ---------- */
(function () {
  const bin = document.getElementById('baseBin');
  const oct = document.getElementById('baseOct');
  const dec = document.getElementById('baseDec');
  const hexF = document.getElementById('baseHex');
  const err = document.getElementById('baseError');

  function fromDec(n) {
    bin.value = n.toString(2);
    oct.value = n.toString(8);
    dec.value = n.toString(10);
    hexF.value = n.toString(16).toUpperCase();
    err.textContent = '';
  }
  function bind(el, base, re) {
    el.addEventListener('input', () => {
      const v = el.value.trim();
      if (v === '') { err.textContent = ''; return; }
      if (!re.test(v)) { err.textContent = `Invalid character for base ${base}.`; return; }
      const n = parseInt(v, base);
      if (isNaN(n)) { err.textContent = 'Could not parse value.'; return; }
      err.textContent = '';
      if (el !== bin) bin.value = n.toString(2);
      if (el !== oct) oct.value = n.toString(8);
      if (el !== dec) dec.value = n.toString(10);
      if (el !== hexF) hexF.value = n.toString(16).toUpperCase();
    });
  }
  bind(bin, 2, /^[01]+$/);
  bind(oct, 8, /^[0-7]+$/);
  bind(dec, 10, /^[0-9]+$/);
  bind(hexF, 16, /^[0-9a-fA-F]+$/);
  fromDec(255);
})();

/* ---------- 03 text case converter ---------- */
(function () {
  const input = document.getElementById('textInput');
  const list = document.getElementById('caseList');

  function words(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(/[\s_\-]+/)
      .filter(Boolean);
  }
  const converters = {
    'UPPERCASE': s => s.toUpperCase(),
    'lowercase': s => s.toLowerCase(),
    'Title Case': s => words(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '),
    'Sentence case': s => { const t = s.toLowerCase().trim(); return t ? t[0].toUpperCase() + t.slice(1) : t; },
    'camelCase': s => words(s).map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
    'PascalCase': s => words(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
    'snake_case': s => words(s).map(w => w.toLowerCase()).join('_'),
    'kebab-case': s => words(s).map(w => w.toLowerCase()).join('-'),
    'CONSTANT_CASE': s => words(s).map(w => w.toUpperCase()).join('_')
  };

  function render() {
    const src = input.value;
    list.innerHTML = '';
    Object.entries(converters).forEach(([label, fn]) => {
      const val = src ? fn(src) : '';
      const row = document.createElement('div');
      row.className = 'case-row';
      row.innerHTML = `<span class="case-label">${label}</span><span class="case-value"></span>`;
      row.querySelector('.case-value').textContent = val;
      const btn = document.createElement('button');
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => copyText(val));
      row.appendChild(btn);
      list.appendChild(row);
    });
  }
  input.addEventListener('input', render);
  render();
})();

/* ---------- 04 aspect ratio ---------- */
(function () {
  const w = document.getElementById('ratioW');
  const h = document.getElementById('ratioH');
  const readout = document.getElementById('ratioReadout');
  const newW = document.getElementById('ratioNewW');
  const scaled = document.getElementById('ratioScaled');
  const presetsEl = document.getElementById('ratioPresets');

  const gcd = (a, b) => b ? gcd(b, a % b) : a;

  function updateRatio() {
    const wv = parseFloat(w.value) || 0, hv = parseFloat(h.value) || 0;
    if (wv > 0 && hv > 0) {
      const g = gcd(Math.round(wv), Math.round(hv));
      readout.textContent = `${Math.round(wv / g)}:${Math.round(hv / g)}`;
    } else {
      readout.textContent = '—';
    }
    updateScaled();
  }
  function updateScaled() {
    const wv = parseFloat(w.value) || 0, hv = parseFloat(h.value) || 0, nw = parseFloat(newW.value) || 0;
    if (wv > 0 && hv > 0 && nw > 0) {
      const nh = Math.round((hv / wv) * nw);
      scaled.textContent = `${Math.round(nw)} \u00d7 ${nh}`;
    } else {
      scaled.textContent = '—';
    }
  }
  const presets = [['16:9', 1920, 1080], ['4:3', 1024, 768], ['1:1', 1080, 1080], ['21:9', 2560, 1080], ['9:16', 1080, 1920], ['3:2', 1500, 1000]];
  presets.forEach(([label, pw, ph]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', () => { w.value = pw; h.value = ph; updateRatio(); });
    presetsEl.appendChild(b);
  });

  w.addEventListener('input', updateRatio);
  h.addEventListener('input', updateRatio);
  newW.addEventListener('input', updateScaled);
  updateRatio();
})();

/* ---------- 05 BMI / calorie / tip ---------- */
(function () {
  const bmiH = document.getElementById('bmiHeight');
  const bmiW = document.getElementById('bmiWeight');
  const bmiOut = document.getElementById('bmiReadout');
  function bmiCat(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }
  function updateBmi() {
    const h = (parseFloat(bmiH.value) || 0) / 100, w = parseFloat(bmiW.value) || 0;
    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      bmiOut.textContent = `${bmi.toFixed(1)} — ${bmiCat(bmi)}`;
    } else bmiOut.textContent = '—';
  }
  bmiH.addEventListener('input', updateBmi);
  bmiW.addEventListener('input', updateBmi);
  updateBmi();

  const calSex = document.getElementById('calSex'), calAge = document.getElementById('calAge');
  const calHeight = document.getElementById('calHeight'), calWeight = document.getElementById('calWeight');
  const calActivity = document.getElementById('calActivity'), calOut = document.getElementById('calReadout');
  function updateCal() {
    const age = parseFloat(calAge.value) || 0, h = parseFloat(calHeight.value) || 0, w = parseFloat(calWeight.value) || 0;
    if (age > 0 && h > 0 && w > 0) {
      const base = 10 * w + 6.25 * h - 5 * age;
      const bmr = calSex.value === 'm' ? base + 5 : base - 161;
      const tdee = bmr * parseFloat(calActivity.value);
      calOut.textContent = `BMR ${Math.round(bmr)} kcal \u00b7 TDEE ${Math.round(tdee)} kcal`;
    } else calOut.textContent = 'BMR — · TDEE —';
  }
  [calSex, calAge, calHeight, calWeight, calActivity].forEach(el => el.addEventListener('input', updateCal));
  updateCal();

  const tipBill = document.getElementById('tipBill'), tipPct = document.getElementById('tipPct');
  const tipPeople = document.getElementById('tipPeople'), tipOut = document.getElementById('tipReadout');
  function updateTip() {
    const bill = parseFloat(tipBill.value) || 0, pct = parseFloat(tipPct.value) || 0, people = Math.max(1, parseInt(tipPeople.value) || 1);
    const tip = bill * pct / 100, total = bill + tip;
    tipOut.textContent = `Tip ${tip.toFixed(2)} \u00b7 Total ${total.toFixed(2)} \u00b7 Each ${(total / people).toFixed(2)}`;
  }
  [tipBill, tipPct, tipPeople].forEach(el => el.addEventListener('input', updateTip));
  updateTip();
})();

/* ---------- 06 loan / EMI / compound interest ---------- */
(function () {
  const p = document.getElementById('emiPrincipal'), r = document.getElementById('emiRate'), n = document.getElementById('emiMonths');
  const out = document.getElementById('emiReadout');
  function updateEmi() {
    const P = parseFloat(p.value) || 0, annual = parseFloat(r.value) || 0, N = parseFloat(n.value) || 0;
    if (P > 0 && N > 0) {
      const rate = annual / 12 / 100;
      let emi;
      if (rate === 0) emi = P / N;
      else emi = P * rate * Math.pow(1 + rate, N) / (Math.pow(1 + rate, N) - 1);
      const total = emi * N;
      out.textContent = `EMI ${emi.toFixed(2)} \u00b7 Total interest ${(total - P).toFixed(2)} \u00b7 Total payment ${total.toFixed(2)}`;
    } else out.textContent = 'EMI —';
  }
  [p, r, n].forEach(el => el.addEventListener('input', updateEmi));
  updateEmi();

  const cp = document.getElementById('ciPrincipal'), cr = document.getElementById('ciRate'), cy = document.getElementById('ciYears'), cf = document.getElementById('ciFreq');
  const cOut = document.getElementById('ciReadout');
  function updateCi() {
    const P = parseFloat(cp.value) || 0, annual = (parseFloat(cr.value) || 0) / 100, t = parseFloat(cy.value) || 0, freq = parseFloat(cf.value);
    if (P > 0 && t >= 0) {
      const amount = P * Math.pow(1 + annual / freq, freq * t);
      cOut.textContent = `Maturity ${amount.toFixed(2)} \u00b7 Interest earned ${(amount - P).toFixed(2)}`;
    } else cOut.textContent = 'Maturity —';
  }
  [cp, cr, cy, cf].forEach(el => el.addEventListener('input', updateCi));
  updateCi();
})();

/* ---------- 07 word / character counter ---------- */
(function () {
  const input = document.getElementById('wordsInput');
  const stats = document.getElementById('wordsStats');
  function render() {
    const text = input.value;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const wordCount = (text.trim().match(/\S+/g) || []).length;
    const sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const readMin = Math.max(1, Math.ceil(wordCount / 200));
    const data = [
      [chars, 'Characters'],
      [charsNoSpace, 'No spaces'],
      [wordCount, 'Words'],
      [sentences, 'Sentences'],
      [paragraphs, 'Paragraphs'],
      [wordCount ? `${readMin}m` : '0m', 'Reading time']
    ];
    stats.innerHTML = '';
    data.forEach(([num, lbl]) => {
      const el = document.createElement('div');
      el.className = 'stat';
      el.innerHTML = `<div class="num">${num}</div><div class="lbl">${lbl}</div>`;
      stats.appendChild(el);
    });
  }
  input.addEventListener('input', render);
  render();
})();

/* ---------- 08 QR generate / scan ---------- */
(function () {
  const qrText = document.getElementById('qrText');
  const wrap = document.getElementById('qrCanvasWrap');
  const downloadBtn = document.getElementById('qrDownload');
  let qrInstance = null;

  function renderQr() {
    wrap.innerHTML = '';
    if (typeof QRCode === 'undefined') { wrap.textContent = 'QR library unavailable offline until first online load.'; return; }
    qrInstance = new QRCode(wrap, {
      text: qrText.value || ' ',
      width: 220, height: 220,
      colorDark: '#14181D', colorLight: '#ffffff'
    });
  }
  qrText.addEventListener('input', renderQr);
  downloadBtn.addEventListener('click', () => {
    const img = wrap.querySelector('img');
    const canvas = wrap.querySelector('canvas');
    const src = canvas ? canvas.toDataURL('image/png') : (img ? img.src : null);
    if (!src) { toast('Nothing to download yet'); return; }
    const a = document.createElement('a');
    a.href = src; a.download = 'qr-code.png'; a.click();
  });
  renderQr();

  /* scanning */
  const video = document.getElementById('qrVideo');
  const canvas = document.getElementById('qrScanCanvas');
  const startBtn = document.getElementById('qrScanStart');
  const fileInput = document.getElementById('qrFileInput');
  const result = document.getElementById('qrResult');
  let stream = null, scanning = false;

  async function startCamera() {
    if (typeof jsQR === 'undefined') { toast('Scanner unavailable offline until first online load'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      await video.play();
      scanning = true;
      startBtn.textContent = 'Stop camera';
      requestAnimationFrame(scanLoop);
    } catch (e) {
      toast('Camera unavailable');
    }
  }
  function stopCamera() {
    scanning = false;
    if (stream) stream.getTracks().forEach(t => t.stop());
    startBtn.textContent = 'Start camera';
  }
  startBtn.addEventListener('click', () => { scanning ? stopCamera() : startCamera(); });

  function scanLoop() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        result.textContent = code.data;
        toast('QR code detected');
      }
    }
    requestAnimationFrame(scanLoop);
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || typeof jsQR === 'undefined') return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      result.textContent = code ? code.data : 'No QR code found in image';
    };
    img.src = URL.createObjectURL(file);
  });
})();

/* ---------- PWA: service worker + install prompt ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });
