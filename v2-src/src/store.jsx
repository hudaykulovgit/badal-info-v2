import { createContext, useContext, useMemo, useState } from "react";
import { FILE_RATE, ORGS, ROWS, bankFee, forecastBase, quarterOf, toUsd } from "./model";

// Demo staff: one chief accountant per payer, signed in with the UzASBO key.
// Access is never revoked by hand: the key's validity date decides it (edit request v6).
const NAMES = ["Каримов А.", "Юсупова Д.", "Рахимов Б.", "Абдуллаева Н.", "Тошпўлатов Ш.", "Салиева М.", "Назаров Ж.", "Қодирова Г."];
const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (n) => new Date(startOfDay(new Date()).getTime() + n * DAY);
function seedStaff() {
  return ORGS.map((o, i) => {
    // demo spread: a few expired, a few within 30 days, the rest valid for months
    const off = i % 11 === 6 ? -(3 + (i % 17)) : i % 9 === 4 ? 4 + (i % 20) : 60 + ((i * 37) % 340);
    // a blocked holder's last sign-in can only precede the key's expiry
    const last = i % 7 === 3 ? null : off < 0 ? addDays(off - 1 - (i % 5)) : addDays(-(1 + (i % 14)));
    // Demo: phone comes with the staff record from УзАСБО (ваколатли ходим карточкаси), not typed in BADAL.
    const phone = `+998 ${["71", "90", "93", "97", "99"][i % 5]} ${String(200 + ((i * 37) % 800)).padStart(3, "0")}-${String(10 + ((i * 53) % 90)).padStart(2, "0")}-${String(10 + ((i * 29) % 90)).padStart(2, "0")}`;
    return { org: o.org, name: NAMES[i % NAMES.length], post: "Бош бухгалтер", phone, expires: addDays(off), last: last && last.toLocaleDateString("ru-RU") };
  });
}
export const EXPIRING_DAYS = 30;
// Derived on every render: once the date passes, the user is blocked automatically.
export function keyState(s) {
  const days = Math.round((startOfDay(s.expires).getTime() - startOfDay(new Date()).getTime()) / DAY);
  const state = days < 0 ? "blocked" : days <= EXPIRING_DAYS ? "expiring" : "active";
  return { state, days };
}
export const fmtDate = (d) => d.toLocaleDateString("ru-RU");
// Demo: about two thirds of fully transferred lines already have agreed documents.
function seedApprovals() {
  const out = {};
  ROWS.forEach((r, i) => {
    if (r.paid26 && r.inv26 && r.paid26 >= r.inv26 * 0.99 && i % 3 !== 0) out[r.id] = { at: "демо", by: "Администратор" };
  });
  return out;
}
function seedDocs(approved) {
  const out = {};
  Object.keys(approved).forEach((id) => {
    out[id] = { invoice: { name: "invoice.pdf" }, payment: { name: "swift.pdf" }, receipt: { name: "confirmation-letter.pdf" }, sent: "демо" };
  });
  return out;
}
// «Рўйхат» as an editable register: organ blocks with their international organisations.
export const SOURCES = { budget: "Давлат бюджети", extra: "Бюджетдан ташқари маблағлар" };
function seedReg() {
  return ORGS.map((o) => ({
    key: o.org, no: o.no, org: o.org,
    items: ROWS.filter((r) => r.org === o.org).map((r) => ({ id: r.id, io: r.io, src: "budget", pt: r.pt, acct: r.acct || "" })),
  }));
}
function seedMessages() {
  return [
    { id: 1, org: "Ташқи ишлар вазирлиги", from: "admin", text: "БМТ бўйича 2026 йил тўлов ҳужжатини юклашингизни сўраймиз.", at: "14.11.2026 10:12" },
    { id: 2, org: "Ташқи ишлар вазирлиги", from: "organ", text: "SWIFT тасдиғи банкдан келди, бугун юкланади.", at: "14.11.2026 11:40" },
    { id: 3, org: "Соғлиқни сақлаш вазирлиги", from: "admin", text: "Ҳисоб рақамингиз 3 кундан кейин ёпилади: 2026 йил маълумотларини киритинг.", at: "16.11.2026 09:05", system: true },
  ];
}

// Demo: 2027 budget requests already sent by ministries, so the Administrator's approvals module is not empty.
// None is pre-approved: approved requests would change the «Бюджет сўрови» totals taken from the source file.
function seedSubmissions() {
  const demo = [
    { id: "r41", hasInv: false, inv27: "", debtPast: "", overpay: "", files: { request: "валюта-сўрови-БМТ.pdf" }, state: "pending", at: "12.11.2026 10:24" },
    { id: "r14", hasInv: true, inv27: "72000", debtPast: "", overpay: "", files: { inv27: "Interpol-invoice-2027.pdf", request: "валюта-сўрови-Интерпол.pdf" }, state: "pending", at: "13.11.2026 15:02" },
    { id: "r9", hasInv: false, inv27: "", debtPast: "162400", overpay: "", files: { debt: "қарздорлик-далолатномаси.pdf", request: "валюта-сўрови-АТМ.pdf" }, state: "pending", at: "14.11.2026 09:47" },
    { id: "r64", hasInv: true, inv27: "170320", debtPast: "", overpay: "", files: { inv27: "WHO-assessment-2027.pdf", request: "валюта-сўрови-ЖССТ.pdf" }, state: "pending", at: "16.11.2026 11:18" },
    { id: "r46", hasInv: false, inv27: "", debtPast: "", overpay: "", files: { request: "валюта-сўрови-ТДТ.pdf" }, state: "returned", note: "2027 йил инвойси келган: прогноз ўрнига инвойс асосида қайта юборинг.", at: "15.11.2026 16:35" },
  ];
  const out = {};
  demo.forEach(({ id, ...s }) => {
    const r = ROWS.find((x) => x.id === id);
    if (!r) return;
    const total = forecastBase(r, s.hasInv, s.inv27) + (Number(s.debtPast) || 0) - (Number(s.overpay) || 0);
    out[id] = { ...s, req: String(Math.round(total)) };
  });
  return out;
}

const Ctx = createContext(null);

export const ROLES = {
  admin: { label: "Администратор", who: "ИМВ Халқаро муносабатлар департаменти", key: "IM ID", note: "Тўлиқ ваколат: база, тасдиқлаш, 4-гуруҳ харажатларини тўхтатиш" },
  organ: { label: "Масъул давлат органи", who: "Бош бухгалтер, ПҚ-4756 1-иловасидаги тўловчи", key: "УзАСБО калити", note: "Ўз халқаро ташкилотлари бўйича маълумот киритади" },
  observer: { label: "Кузатувчи", who: "ВМ, ИМВ, ТИВ, Марказий банк", key: "OneID", note: "Барча маълумотларни ўзгартириш имкониятисиз кўради" },
};

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null); // { role, org }
  const [page, setPage] = useState("financing");
  const [rate, setRate] = useState(FILE_RATE);
  const [approvals, setApprovals] = useState(() => seedApprovals()); // rowId -> { at, by }: Administrator agreed the documents
  const [docs, setDocs] = useState(() => seedDocs(seedApprovals())); // rowId -> { invoice, payment, receipt: { name } }
  const [submissions, setSubmissions] = useState(() => seedSubmissions()); // rowId -> { inv27, debtPast, overpay, req, files, state: pending|approved|rejected, at }
  const [results, setResults] = useState({}); // rowId -> { target, grants, note }
  const [debts, setDebts] = useState({}); // rowId -> { debtPaid, debtFile, credit, creditFile, confirmed }
  const [payments, setPayments] = useState({}); // rowId -> { amount, date }
  const [reports, setReports] = useState({}); // org -> { period, text, file, at }
  const [suspended, setSuspended] = useState({}); // org -> true
  const [staff, setStaff] = useState(() => seedStaff());
  const [messages, setMessages] = useState(() => seedMessages());
  const [reg, setReg] = useState(() => seedReg());
  const [letters, setLetters] = useState(() => [
    { id: "l1", org: "Ташқи ишлар вазирлиги", name: "Мирзаев Т.", post: "Халқаро ташкилотлар бошқармаси бошлиғи", phone: "+998 71 233-41-07", file: "тайинлаш-хати.pdf", state: "pending", at: "16.11.2026 15:20" },
  ]); // { id, org, name, post, phone, file, state: pending|approved|returned, at }

  const value = useMemo(() => {
    const role = session?.role;
    // Register edits flow into every page: name, numbering, source, payment type, account; new lines appear empty.
    const base = new Map(ROWS.map((r) => [r.id, r]));
    const all = reg.flatMap((b) =>
      b.items.filter((it) => it.io.trim()).map((it) => ({
        ...(base.get(it.id) || { id: it.id, flags: [], status: "unpaid", cur: null, inv26: null, paid26: null, isNew: true }),
        org: b.org, no: b.no, io: it.io, src: it.src, pt: it.pt, acct: it.acct,
        expenseItems: it.expenseItems || [], registryCurrency: it.registryCurrency ?? base.get(it.id)?.cur ?? "",
      })),
    );
    const scoped = role === "organ" ? all.filter((r) => r.org === session.org) : all;
    // Approved submissions replace the organisation's request in the budget table.
    const applyApproved = (r) => {
      const s = submissions[r.id];
      if (!s || s.state !== "approved") return r;
      const req = Number(s.req);
      const other = bankFee(toUsd(req, r.cur, FILE_RATE));
      return {
        ...r, req, approved: true,
        inv27: s.inv27 === "" ? r.inv27 : Number(s.inv27),
        debtPast: s.debtPast === "" ? r.debtPast : Number(s.debtPast),
        overpay: s.overpay === "" ? r.overpay : Number(s.overpay),
        totusd: toUsd(req, r.cur, FILE_RATE) + other,
      };
    };
    // Status chain (решение заказчика 17.11.2026):
    //   SWIFT from УзАСБО / ДМБАТ  → «Ўтказилган», receivable stays open in УзАСБО / ДМБАТ;
    //   ministry uploads the IO's confirming documents → Administrator agrees («Келишиш»)
    //   → «Тўланган», receivable closed, report shows «Бажарилди».
    const withDocs = (r) => {
      const d = docs[r.id] || {};
      const a = approvals[r.id];
      const transferred = r.paid26 || (d.payment?.name ? r.inv26 || 0 : 0);
      // Debt / credit roll forward (555.docx): opening balance + invoice − paid, unless the ministry ticks
      // «ўзим киритаман», enters its own figures with a document and the Administrator agrees them.
      const own = debts[r.id];
      const net = (r.debtPast || 0) - (r.overpay || 0) + (r.inv26 || 0) - (transferred || 0);
      const bal = own?.manual && own.confirmed ? { debtBal: Number(own.debt) || 0, creditBal: Number(own.credit) || 0, balOwn: true } : { debtBal: Math.max(net, 0), creditBal: Math.max(-net, 0), balOwn: false };
      // Quarter of the transfer: SWIFT value date, or today for a payment document uploaded by hand.
      const q = r.swiftDate ? quarterOf(r.swiftDate) : transferred ? quarterOf(new Date()) : null;
      if (a) return { ...r, ...bal, q, status: "paid", swift: transferred, paidOk: transferred, receivable: 0, approvedAt: a.at };
      const status = transferred ? "sent" : "unpaid";
      return { ...r, ...bal, q, status, swift: transferred, paidOk: 0, receivable: transferred, manual: !r.paid26 && !!d.payment?.name };
    };
    return {
      session, setSession, role, page, setPage, rate, setRate,
      docs, setDocs, approvals, setApprovals, submissions, setSubmissions, results, setResults,
      debts, setDebts, payments, setPayments, reports, setReports, suspended, setSuspended,
      staff, setStaff, messages, setMessages, reg, setReg, letters, setLetters,
      rows: scoped.map(withDocs).map(applyApproved),
      canEdit: role === "admin",
    };
  }, [session, page, rate, docs, approvals, submissions, results, debts, payments, reports, suspended, staff, messages, reg, letters]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
