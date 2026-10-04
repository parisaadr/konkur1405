/**
 * calc.js
 * ----------------------------------------------------------------------
 * منطق محاسبه — بدون هیچ دستکاری در DOM. هر تابع خالص (pure) است تا هم
 * تست‌کردن دستی راحت باشد و هم اگر بعداً خواستید فرمول را عوض کنید،
 * فقط همین فایل کافی است.
 *
 * نکتهٔ مهم دربارهٔ صداقت محاسبه:
 * سازمان سنجش «تراز» واقعی را با میانگین و انحراف‌معیار واقعیِ نمرات
 * همهٔ داوطلبان همان سال محاسبه می‌کند؛ این آمار فقط داخل سازمان سنجش
 * موجود است و به‌صورت عمومی منتشر نمی‌شود. ما چنین دسترسی‌ای نداریم،
 * بنابراین این ابزار به‌جای «تراز رسمی» یک «نمرهٔ کل ترکیبی» (۰ تا ۱۰۰)
 * می‌سازد و سپس آن را با یک منحنی نرمالِ فرضی (قابل‌تنظیم توسط کاربر)
 * به «تخمین درصدی رتبه» تبدیل می‌کند. این تخمین، به‌خصوص برای امسال که
 * برگزاری کنکور با تأخیر و تحت‌تأثیر جنگ همراه بود و آمار تازه‌ای از
 * جامعهٔ داوطلبان منتشر نشده، را باید با احتیاط زیاد خواند.
 * ----------------------------------------------------------------------
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianDigits(input) {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

function formatNumber(n, decimals = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const rounded = Number(n).toFixed(decimals);
  const withCommas = decimals > 0
    ? rounded.replace(/\B(?=(\d{3})+(?!\d)(?=\.\d|$))/g, ',')
    : Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(withCommas);
}

/** تقریب Abramowitz-Stegun برای تابع خطا (erf) — برای CDF نرمال لازم است. */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
    a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/** درصد از جمعیت که زیر z قرار می‌گیرند (۰ تا ۱۰۰). */
function normalCDF(z) {
  return 50 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * میانگین وزنی یک لیست از دروس بر اساس یک کلید مقدار (مثلاً g12، g11،
 * konkur). دروسی که مقدار معتبر ندارند (خالی یا NaN) از محاسبه کنار
 * گذاشته می‌شوند تا خالی‌بودن یک خانه، نمرهٔ کل را مصنوعی پایین نیاورد.
 */
function weightedAverage(subjects, values, valueKey) {
  let sumCoef = 0;
  let sum = 0;
  subjects.forEach((s) => {
    const v = values[s.id] && values[s.id][valueKey];
    const coef = values[s.id] ? Number(values[s.id].coef) : s.coef;
    if (v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)) && coef > 0) {
      sum += Number(v) * coef;
      sumCoef += coef;
    }
  });
  return sumCoef > 0 ? sum / sumCoef : null;
}

/**
 * محاسبهٔ کامل نتیجه برای گروه‌های اصلی (ریاضی/تجربی/انسانی) که هر درس
 * به‌صورت جدا وارد می‌شود.
 *
 * @param {object} group   یکی از مقادیر GROUPS در data.js
 * @param {object} values  نگاشت subjectId -> { g11, g12, konkur, coef }
 * @param {object} overrides { mean, sd, candidates } اختیاری
 */
function computeMainGroupResult(group, values, overrides) {
  const allSubjects = [...group.general, ...group.specific];
  const score12 = weightedAverage(allSubjects, values, 'g12'); // درصد ۰-۱۰۰ از روی نمرهٔ ۲۰
  const score11 = weightedAverage(allSubjects, values, 'g11');
  const konkurScore = weightedAverage(group.specific, values, 'konkur');

  return finalizeResult(group, score11, score12, konkurScore, overrides);
}

/** نسخهٔ ساده‌شده برای گروه‌های هنر و زبان (یک عدد کلی به‌جای درس‌به‌درس). */
function computeSimpleGroupResult(group, simple, overrides) {
  const score12 = simple.g12 !== '' && simple.g12 !== null ? Number(simple.g12) : null;
  const score11 = simple.g11 !== '' && simple.g11 !== null ? Number(simple.g11) : null;
  const konkurScore = simple.konkur !== '' && simple.konkur !== null ? Number(simple.konkur) : null;

  return finalizeResult(group, score11, score12, konkurScore, overrides);
}

function finalizeResult(group, score11, score12, konkurScore, overrides) {
  const w = group.kind === 'main' ? WEIGHTS.main : WEIGHTS.artLang;

  let sawabeghTotal = null;
  if (score12 !== null) {
    const withoutEleven = (w.twelfth + w.eleventh) * (score12 / 100);
    if (score11 !== null) {
      const withEleven = w.twelfth * (score12 / 100) + w.eleventh * (score11 / 100);
      sawabeghTotal = Math.max(withEleven, withoutEleven);
    } else {
      sawabeghTotal = withoutEleven;
    }
  }

  const konkurContribution = konkurScore !== null ? (w.konkur / 100) * konkurScore : null;

  let finalScore = null;
  if (sawabeghTotal !== null || konkurContribution !== null) {
    finalScore = (sawabeghTotal || 0) + (konkurContribution || 0);
  }

  const mean = overrides && overrides.mean !== undefined && overrides.mean !== '' ? Number(overrides.mean) : group.assumedMean;
  const sd = overrides && overrides.sd !== undefined && overrides.sd !== '' && Number(overrides.sd) > 0 ? Number(overrides.sd) : group.assumedSD;
  const candidates = overrides && overrides.candidates !== undefined && overrides.candidates !== '' ? Number(overrides.candidates) : group.candidatesApprox;

  let percentile = null, topPercentMid = null, topPercentLow = null, topPercentHigh = null;
  let rankMid = null, rankLow = null, rankHigh = null;
  let tier = null;

  if (finalScore !== null) {
    const z = (finalScore - mean) / sd;
    percentile = normalCDF(z); // درصد داوطلبانی که زیر این نمره‌اند
    const topPercent = 100 - percentile; // چند درصد بالاترند (یعنی رتبهٔ نسبی)

    // بازهٔ عدم‌قطعیت: نیم انحراف‌معیار جابه‌جایی در z، برای نشان‌دادن
    // صادقانهٔ اینکه این یک بازهٔ تقریبی است نه عدد قطعی.
    const zLow = z + 0.35;
    const zHigh = z - 0.35;
    const topPercentLowRaw = 100 - normalCDF(zLow); // خوش‌بینانه‌تر (رتبهٔ بهتر)
    const topPercentHighRaw = 100 - normalCDF(zHigh); // محتاطانه‌تر (رتبهٔ ضعیف‌تر)

    topPercentMid = clamp(topPercent, 0.01, 100);
    topPercentLow = clamp(Math.min(topPercentLowRaw, topPercentHighRaw), 0.01, 100);
    topPercentHigh = clamp(Math.max(topPercentLowRaw, topPercentHighRaw), 0.01, 100);

    rankMid = Math.max(1, Math.round((topPercentMid / 100) * candidates));
    rankLow = Math.max(1, Math.round((topPercentLow / 100) * candidates));
    rankHigh = Math.max(1, Math.round((topPercentHigh / 100) * candidates));

    tier = group.tiers.find((t) => topPercentMid <= t.top) || group.tiers[group.tiers.length - 1];
  }

  return {
    score11, score12, sawabeghTotal, konkurScore, konkurContribution, finalScore,
    mean, sd, candidates,
    topPercentMid, topPercentLow, topPercentHigh,
    rankMid, rankLow, rankHigh,
    tier
  };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
