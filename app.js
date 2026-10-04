/**
 * app.js
 * ----------------------------------------------------------------------
 * تمام کدهایی که با DOM سروکار دارند اینجا هستند. منطق محاسبه در
 * calc.js و داده‌ها در data.js است — این جدا‌سازی عمدی است تا اگر فقط
 * می‌خواهید عدد‌ها را به‌روز کنید، لازم نباشد سراغ کد DOM بروید.
 * ----------------------------------------------------------------------
 */

(function () {
  'use strict';

  const GROUP_ORDER = ['tajrobi', 'riazi', 'ensani', 'honar', 'zaban'];
  let currentGroupKey = 'tajrobi';

  const els = {
    groupTabs: document.getElementById('groupTabs'),
    formTitle: document.getElementById('formTitle'),
    subjectFields: document.getElementById('subjectFields'),
    calcForm: document.getElementById('calcForm'),
    errorMsg: document.getElementById('errorMsg'),
    advancedToggle: document.getElementById('advancedToggle'),
    advancedPanel: document.getElementById('advancedPanel'),
    candidatesInput: document.getElementById('candidatesInput'),
    meanInput: document.getElementById('meanInput'),
    sdInput: document.getElementById('sdInput'),
    results: document.getElementById('results'),
    rankValue: document.getElementById('rankValue'),
    resultSummary: document.getElementById('resultSummary'),
    sawabeghValue: document.getElementById('sawabeghValue'),
    sawabeghSub: document.getElementById('sawabeghSub'),
    konkurValue: document.getElementById('konkurValue'),
    konkurSub: document.getElementById('konkurSub'),
    finalValue: document.getElementById('finalValue'),
    percentValue: document.getElementById('percentValue'),
    percentSub: document.getElementById('percentSub'),
    tierLabel: document.getElementById('tierLabel'),
    tierText: document.getElementById('tierText')
  };

  /* ------------------------------ تب‌های گروه ------------------------------ */

  function renderGroupTabs() {
    els.groupTabs.innerHTML = '';
    GROUP_ORDER.forEach((key) => {
      const g = GROUPS[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'group-tab';
      btn.textContent = g.label;
      btn.dataset.group = key;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-pressed', key === currentGroupKey ? 'true' : 'false');
      btn.addEventListener('click', () => switchGroup(key));
      els.groupTabs.appendChild(btn);
    });
  }

  function switchGroup(key) {
    currentGroupKey = key;
    Array.from(els.groupTabs.children).forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.group === key ? 'true' : 'false');
    });
    const g = GROUPS[key];
    els.formTitle.textContent = 'نمرات ' + g.label;
    els.candidatesInput.placeholder = 'مثلاً ' + g.candidatesApprox;
    els.meanInput.placeholder = 'مثلاً ' + g.assumedMean;
    els.sdInput.placeholder = 'مثلاً ' + g.assumedSD;
    els.errorMsg.textContent = '';
    els.results.dataset.open = 'false';
    renderSubjectFields(g);
  }

  /* ------------------------------ فرم درس‌ها ------------------------------ */

  function renderSubjectFields(group) {
    els.subjectFields.innerHTML = '';

    if (group.kind === 'main') {
      const wrap = document.createElement('div');
      wrap.style.overflowX = 'auto';

      const table = document.createElement('table');
      table.className = 'subject-table';
      table.innerHTML =
        '<thead><tr>' +
        '<th>درس</th>' +
        '<th>نهایی یازدهم (از ۲۰)</th>' +
        '<th>نهایی دوازدهم (از ۲۰)</th>' +
        '<th>درصد کنکور (٪)</th>' +
        '<th>ضریب</th>' +
        '</tr></thead><tbody></tbody>';

      const tbody = table.querySelector('tbody');
      const allSubjects = [...group.general, ...group.specific];
      const specificIds = new Set(group.specific.map((s) => s.id));

      allSubjects.forEach((s) => {
        const tr = document.createElement('tr');
        const isSpecific = specificIds.has(s.id);

        tr.innerHTML =
          '<td class="subject-name">' + s.name + '</td>' +
          '<td data-label="نهایی یازدهم (از ۲۰)"><input type="number" min="0" max="20" step="0.05" data-role="g11" data-subject="' + s.id + '"></td>' +
          '<td data-label="نهایی دوازدهم (از ۲۰)"><input type="number" min="0" max="20" step="0.05" data-role="g12" data-subject="' + s.id + '"></td>' +
          '<td data-label="درصد کنکور (٪)">' + (isSpecific ? '<input type="number" min="-33.33" max="100" step="0.01" data-role="konkur" data-subject="' + s.id + '">' : '<span style="color:var(--ink-faint);font-size:.85rem">در آزمون تستی نیست</span>') + '</td>' +
          '<td data-label="ضریب"><input class="coef-input" type="number" min="0" max="20" step="1" value="' + s.coef + '" data-role="coef" data-subject="' + s.id + '"></td>';

        tbody.appendChild(tr);
      });

      wrap.appendChild(table);
      els.subjectFields.appendChild(wrap);
    } else {
      // گروه‌های هنر و زبان: فرم ساده‌شده
      const div = document.createElement('div');
      div.className = 'simple-fields';
      div.innerHTML =
        '<div>' +
        '<label class="field-label" for="simpleG11">میانگین نهایی یازدهم <span class="unit">(از ۲۰)</span></label>' +
        '<input type="number" id="simpleG11" min="0" max="20" step="0.05" data-role="simple-g11">' +
        '</div>' +
        '<div>' +
        '<label class="field-label" for="simpleG12">میانگین نهایی دوازدهم <span class="unit">(از ۲۰)</span></label>' +
        '<input type="number" id="simpleG12" min="0" max="20" step="0.05" data-role="simple-g12">' +
        '</div>' +
        '<div>' +
        '<label class="field-label" for="simpleKonkur">درصد کل دروس تخصصی کنکور <span class="unit">(٪، از ۱۰۰)</span></label>' +
        '<input type="number" id="simpleKonkur" min="-33.33" max="100" step="0.01" data-role="simple-konkur">' +
        '</div>';
      els.subjectFields.appendChild(div);

      const note = document.createElement('p');
      note.className = 'hint';
      note.style.marginTop = '14px';
      note.style.marginBottom = '0';
      note.textContent = 'چون دروس تخصصی این گروه بسته به زیرشاخه (مثلاً موسیقی، نقاشی، یا هر زبان خاص) خیلی فرق می‌کند، اینجا به‌جای درس‌به‌درس، یک درصد کلی برای بخش تخصصی کنکور می‌گیریم.';
      els.subjectFields.appendChild(note);
    }
  }

  /* -------------------------------- اعتبارسنجی -------------------------------- */

  function num(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? NaN : n;
  }

  function collectMainValues(group) {
    const values = {};
    let hasAnyInput = false;
    let rangeError = null;

    const allSubjects = [...group.general, ...group.specific];
    allSubjects.forEach((s) => {
      const g11El = els.subjectFields.querySelector('[data-role="g11"][data-subject="' + s.id + '"]');
      const g12El = els.subjectFields.querySelector('[data-role="g12"][data-subject="' + s.id + '"]');
      const konkurEl = els.subjectFields.querySelector('[data-role="konkur"][data-subject="' + s.id + '"]');
      const coefEl = els.subjectFields.querySelector('[data-role="coef"][data-subject="' + s.id + '"]');

      const g11 = num(g11El.value);
      const g12 = num(g12El.value);
      const konkur = konkurEl ? num(konkurEl.value) : null;
      const coef = num(coefEl.value);

      if (g11 !== null || g12 !== null || konkur !== null) hasAnyInput = true;

      if (g11 !== null && (Number.isNaN(g11) || g11 < 0 || g11 > 20)) rangeError = 'نمرهٔ نهایی «' + s.name + '» باید بین ۰ تا ۲۰ باشد.';
      if (g12 !== null && (Number.isNaN(g12) || g12 < 0 || g12 > 20)) rangeError = 'نمرهٔ نهایی «' + s.name + '» باید بین ۰ تا ۲۰ باشد.';
      if (konkur !== null && (Number.isNaN(konkur) || konkur < -33.33 || konkur > 100)) rangeError = 'درصد کنکور «' + s.name + '» باید بین ۳۳.۳۳- تا ۱۰۰ باشد.';

      values[s.id] = {
        g11: g11 !== null ? (g11 / 20) * 100 : null,
        g12: g12 !== null ? (g12 / 20) * 100 : null,
        konkur: konkur,
        coef: coef !== null && !Number.isNaN(coef) ? coef : s.coef
      };
    });

    return { values, hasAnyInput, rangeError };
  }

  function collectSimpleValues() {
    const g11El = document.getElementById('simpleG11');
    const g12El = document.getElementById('simpleG12');
    const konkurEl = document.getElementById('simpleKonkur');

    const g11 = num(g11El.value);
    const g12 = num(g12El.value);
    const konkur = num(konkurEl.value);

    let rangeError = null;
    if (g11 !== null && (Number.isNaN(g11) || g11 < 0 || g11 > 20)) rangeError = 'میانگین نهایی یازدهم باید بین ۰ تا ۲۰ باشد.';
    if (g12 !== null && (Number.isNaN(g12) || g12 < 0 || g12 > 20)) rangeError = 'میانگین نهایی دوازدهم باید بین ۰ تا ۲۰ باشد.';
    if (konkur !== null && (Number.isNaN(konkur) || konkur < -33.33 || konkur > 100)) rangeError = 'درصد کنکور باید بین ۳۳.۳۳- تا ۱۰۰ باشد.';

    const hasAnyInput = g11 !== null || g12 !== null || konkur !== null;

    return {
      simple: {
        g11: g11 !== null ? (g11 / 20) * 100 : null,
        g12: g12 !== null ? (g12 / 20) * 100 : null,
        konkur: konkur
      },
      hasAnyInput,
      rangeError
    };
  }

  function getOverrides() {
    return {
      candidates: els.candidatesInput.value,
      mean: els.meanInput.value,
      sd: els.sdInput.value
    };
  }

  /* --------------------------------- محاسبه --------------------------------- */

  els.calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    els.errorMsg.textContent = '';

    const group = GROUPS[currentGroupKey];
    let result;

    if (group.kind === 'main') {
      const { values, hasAnyInput, rangeError } = collectMainValues(group);
      if (rangeError) { els.errorMsg.textContent = rangeError; return; }
      if (!hasAnyInput) { els.errorMsg.textContent = 'حداقل نمرهٔ یک درس را وارد کنید.'; return; }
      result = computeMainGroupResult(group, values, getOverrides());
    } else {
      const { simple, hasAnyInput, rangeError } = collectSimpleValues();
      if (rangeError) { els.errorMsg.textContent = rangeError; return; }
      if (!hasAnyInput) { els.errorMsg.textContent = 'حداقل یکی از خانه‌ها را پر کنید.'; return; }
      result = computeSimpleGroupResult(group, simple, getOverrides());
    }

    renderResults(group, result);
  });

  function renderResults(group, r) {
    if (r.finalScore === null) {
      els.errorMsg.textContent = 'برای محاسبه، دست‌کم چند درصد یا نمرهٔ نهایی وارد کنید.';
      return;
    }

    els.rankValue.textContent = formatNumber(r.rankLow) + ' تا ' + formatNumber(r.rankHigh);
    els.resultSummary.textContent =
      'با فرض میانگین ' + formatNumber(r.mean, 1) + ' و انحراف‌معیار ' + formatNumber(r.sd, 1) +
      ' از ۱۰۰ در بین حدود ' + formatNumber(r.candidates) + ' داوطلب گروه «' + group.label + '».';

    els.sawabeghValue.textContent = formatNumber(r.sawabeghTotal, 1);
    els.sawabeghSub.textContent = 'از سهم ' + (group.kind === 'main' ? '۶۰' : '۳۰');

    els.konkurValue.textContent = r.konkurContribution !== null ? formatNumber(r.konkurContribution, 1) : '—';
    els.konkurSub.textContent = 'از سهم ' + (group.kind === 'main' ? '۴۰' : '۷۰');

    els.finalValue.textContent = formatNumber(r.finalScore, 1);

    els.percentValue.textContent = 'بین ' + formatNumber(r.topPercentLow, 2) + '٪ تا ' + formatNumber(r.topPercentHigh, 2) + '٪';
    els.percentSub.textContent = 'میانهٔ تخمین: ' + formatNumber(r.topPercentMid, 2) + '٪';

    if (r.tier) {
      els.tierLabel.textContent = r.tier.label;
      els.tierText.textContent = r.tier.text;
    }

    els.results.dataset.open = 'true';
    if (typeof els.results.scrollIntoView === 'function') {
      els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* -------------------------------- تنظیمات پیشرفته -------------------------------- */

  els.advancedToggle.addEventListener('click', () => {
    const open = els.advancedPanel.dataset.open === 'true';
    els.advancedPanel.dataset.open = open ? 'false' : 'true';
    els.advancedToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  /* ---------------------------------- آکاردئون ---------------------------------- */

  function wireAccordion(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.accordion-item').forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      const panel = item.querySelector('.accordion-panel');
      trigger.addEventListener('click', () => {
        const isOpen = item.dataset.open === 'true';
        item.dataset.open = isOpen ? 'false' : 'true';
        trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
      });
    });
  }

  /* ---------------------------------- شروع ---------------------------------- */

  renderGroupTabs();
  switchGroup(currentGroupKey);
  wireAccordion('methodAccordion');
  wireAccordion('faqAccordion');
})();
