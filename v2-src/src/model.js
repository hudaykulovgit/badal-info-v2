import raw from "./data/rows.json";

// Source: «форма бюджет сўрови 16.09.2026.xlsx», варақ «Расчёт 2027» (112 сатр, 43 тўловчи).
// Курс ва кросс-курслар ўша варақдан: 1 USD = 12 100 сўм; RUB 60 / USD; EUR 1,25 USD; CHF 1,3; ID 1,45; CAD 1,3.
export const FILE_RATE = 12100;
export const CROSS = { USD: 1, EUR: 1.25, CHF: 1.3, "ID (исл дин)": 1.45, CAD: 1.3, RUB: 60 };
export const CURRENCIES = ["USD", "EUR", "CHF", "RUB", "ID (исл дин)", "CAD", "сўм"];
export const CUR_SHORT = { "ID (исл дин)": "ID", "сўм": "сўм" };

// «Бюджет 2027» ва «СВОД 2027» варақлари (минг сўмда) → сўм
export const CEILING_2027 = 1225741460 * 1000; // Фискал стратегия прогнози (потолок)
export const BUDGET_2026 = 1182890651.88 * 1000; // 2026 йил бюджети

// «2. свод бюджет» варағи, млн сўм: 2027 лойиҳа ва асос
export const SVOD = [
  { name: "Халқаро ташкилотларга аъзолик бадали тўловлари", basis: "ПҚ-4756, 22.06.2020", y2027: 160731.05 },
  { name: "ЕОТБ қўшимча акциялари учун тўловлар", basis: "ПҚ-285, 16.09.2025", y2027: 1005911.12 },
  { name: "Янги тараққиёт банкининг қўшимча акциялари", basis: "лойиҳа", y2027: 38577.52, noBasis: true },
  { name: "ЕТТБ қўшимча акциялари учун тўловлар", basis: "ПҚ-7, 12.01.2026", y2027: 18797.27 },
  { name: "ИТБ қўшимча акциялари учун тўловлар", basis: "ПҚ-123, 18.04.2023", y2027: 1934.845 },
];

export const PT = {
  member: "Аъзолик бадали",
  shares: "Капитал қўйилма (акция, облигация)",
  voluntary: "Ихтиёрий бадал",
};

export const STATUS = {
  unpaid: { label: "Тўланмаган", tone: "unpaid" },
  sent: { label: "Ўтказилган", tone: "sent" },
  paid: { label: "Тўланган", tone: "paid" },
};

// What the report shows for each status (2-илова, 1-илова).
export const EXEC = {
  unpaid: "Бажарилмаган",
  sent: "Бажарилмаган · дебиторлик",
  paid: "Бажарилди",
};

export const FLAGS = {
  noBasis: { label: "Ҳуқуқий асос йўқ", hint: "«2. свод бюджет»да асос устунида «лойиҳа». Қарор қабул қилинмаган мажбурият.", severity: "error" },
  divErr: { label: "Формула хатоси", hint: "Манба файлда #DIV/0! — ҳисоб-китоб тугалланмаган.", severity: "error" },
  noAcct: { label: "Ҳисобрақам йўқ", hint: "Казначейлик лицевой ҳисобрақами киритилмаган.", severity: "warn" },
  noCur: { label: "Валюта йўқ", hint: "Валюта бирлиги кўрсатилмаган.", severity: "warn" },
  overForecast: { label: "Сўров прогноздан юқори", hint: "Ташкилот сўрови формула бўйича прогноздан 30 % дан ортиқ.", severity: "warn" },
};

const NDB = "Янги тараққиёт банки (БРИКС Банк)";

// Demo: SWIFT value date per transferred line. Source forms carry no dates; in production it comes from УзАСБО / ДМБАТ.
// Spread deterministic, weighted to I–II чорак (most fees are invoiced in January), never after 17.11.2026.
const Q_END = [[3, 31], [6, 30], [9, 30], [11, 17]];
function demoSwiftDate(i) {
  const h = (i * 2654435761) % 100;
  const q = h < 42 ? 0 : h < 70 ? 1 : h < 88 ? 2 : 3;
  const [m, dMax] = Q_END[q];
  const month = q * 3 + 1 + ((i * 7) % (q === 3 ? 2 : 3));
  const day = 1 + ((i * 13) % (month === m ? dMax : 28));
  return new Date(2026, month - 1, Math.min(day, 28));
}
export const quarterOf = (d) => Math.floor(d.getMonth() / 3) + 1;

export const ROWS = raw.map((r, i) => {
  const flags = [...r.flags];
  if (r.io === NDB) flags.unshift("noBasis");
  // SWIFT data from УзАСБО / ДМБАТ only means «Ўтказилган»: the sum stays a receivable there.
  // «Тўланган» is set later, only when the Administrator agrees the ministry's confirming documents.
  const status = r.paid26 ? "sent" : "unpaid";
  return { ...r, flags, status, swiftDate: r.paid26 ? demoSwiftDate(i) : null };
});

export const ORGS = (() => {
  const seen = new Map();
  ROWS.forEach((r) => {
    if (!seen.has(r.org)) seen.set(r.org, { org: r.org, no: r.no, ids: [] });
    seen.get(r.org).ids.push(r.id);
  });
  return [...seen.values()];
})();

// Amount in its own currency → USD equivalent, using the file's 2027 cross rates.
export function toUsd(amount, cur, rate = FILE_RATE) {
  if (amount == null || !cur) return 0;
  if (cur === "сўм") return amount / rate;
  // «Расчёт 2027», столбец Y: EUR, CHF, ID умножаются; RUB, CAD (единиц за 1 USD) делятся.
  if (cur === "RUB" || cur === "CAD") return amount / CROSS[cur];
  return amount * (CROSS[cur] ?? 0);
}

// Столбец Z: прочие расходы (услуги банка), USD.
export const bankFee = (usd) => (usd <= 0 ? 0 : usd <= 99000 ? 50 : 100);
// Столбец AB: сумовая часть, округление до тысяч.
export const toSum = (usdTotal, rate) => Math.round((rate * usdTotal) / 1000) * 1000;

// Столбец U без запроса: база (инвойс N+1 или инвойс N × рост) + долг − переплата.
export function forecastBase(r, hasInv, inv27) {
  return hasInv ? Number(inv27) || 0 : (r.inv26 || r.pr26 || 0) * (1 + Math.max(0, r.growth || 0) / 100);
}

// Form-driven forecast: empty string means "not entered".
export function forecastFrom(r, f) {
  const n = (v) => (v === "" || v == null ? null : Number(v));
  const base = n(f.inv27) ?? (r.inv26 || 0) * (1 + (r.growth || 0) / 100);
  return base + (n(f.debtPast) || 0) - (n(f.overpay) || 0);
}

export function forecast2027(r, o = {}) {
  const inv27 = o.inv27 ?? r.inv27;
  const debt = o.debtPast ?? r.debtPast ?? 0;
  const over = o.overpay ?? r.overpay ?? 0;
  const base = inv27 != null && inv27 !== "" ? Number(inv27) : (r.inv26 || 0) * (1 + (r.growth || 0) / 100);
  return base + Number(debt || 0) - Number(over || 0);
}

const nf0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmt = (n) => (n == null || Number.isNaN(n) ? "—" : nf0.format(n));
export const fmt1 = (n) => (n == null || Number.isNaN(n) ? "—" : nf1.format(n));
export const fmt2 = (n) => (n == null || Number.isNaN(n) ? "—" : nf2.format(n));
export const pct = (n) => (n == null || Number.isNaN(n) ? "—" : `${nf1.format(n)} %`);
export const mlnUsd = (n) => `${nf2.format(n / 1e6)} млн $`;
export const mlrdSum = (n) => `${nf2.format(n / 1e9)} млрд сўм`;
export const cur = (c) => CUR_SHORT[c] ?? c ?? "";
