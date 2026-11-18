import * as XLSX from "xlsx";
import { EXEC, cur, forecast2027, toSum, toUsd } from "./model";
import { sliceAcct } from "./ui";

function save(aoa, sheet, file) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = aoa[0].map((_, i) => ({ wch: i < 3 ? 42 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
}

// 1-илова «Форма анализа отчёта» tuzilmasi bo‘yicha
export function exportAnalysis(rows, rate) {
  const head = ["№", "Масъул орган", "Халқаро ташкилот", "Казначейлик ҳисобрақами", "Бўлим", "Кичик бўлим", "Боб", "Валюта", "2026 прогнози", "Инвойс 2026", "Ўтказилган (SWIFT)", "Тўланган (келишилган)", "Дебиторлик", "Қолдиқ", "Тўланган, USD экв.", "Тўланган, сўм", "Қарздорлик, жамланма", "Ҳақдорлик, жамланма", "Ижро"];
  const body = rows.map((r, i) => {
    const a = sliceAcct(r.acct) || {};
    const usd = toUsd(r.paidOk, r.cur, rate);
    return [i + 1, r.org, r.io, r.acct || "", a.razdel || "", a.podrazdel || "", a.glava || "", cur(r.cur), r.pr26 ?? "", r.inv26 ?? "", r.swift || 0, r.paidOk || 0, r.receivable || 0, r.inv26 != null ? Math.max((r.inv26 || 0) - (r.swift || 0), 0) : "", Math.round(usd), Math.round(usd * rate), Math.round(r.debtBal || 0), Math.round(r.creditBal || 0), EXEC[r.status]];
  });
  save([head, ...body], "1-илова", "BADAL_1-илова_таҳлил_2026.xlsx");
}

const COLS = ["USD", "EUR", "CHF", "RUB", "сўм", "CAD", "ID (исл дин)"];

// 2-илова «МАЪЛУМОТ»: тўланган аъзолик бадаллари, валюталар кесимида (ID устуни қўшилган)
export function exportReport(rows, period, quarterEmpty = false) {
  const head = ["Т/р", "Тўловчилар номи", "Халқаро шартнома, халқаро ташкилот", "АҚШ доллари", "Евро", "Швейцария франки", "Россия рубли", "Ўзбек сўми (млн сўм)", "Канада доллари", "Ислом динори"];
  const body = rows.map((r, i) => [i + 1, r.org, r.io, ...COLS.map((c) => (quarterEmpty ? 0 : r.cur === c ? (c === "сўм" ? (r.paidOk || 0) / 1e6 : r.paidOk || 0) : 0))]);
  save([[`2026 йил, ${period}: тўланган аъзолик бадаллари тўғрисида МАЪЛУМОТ`], [], head, ...body], "2-илова", `BADAL_2-илова_${period}_2026.xlsx`);
}

export function exportBudget(rows, rate, overrides = {}) {
  const head = ["Масъул орган", "Халқаро ташкилот", "Валюта", "Инвойс 2026", "Прогноз ўсиш, %", "Инвойс 2027", "Ўтган йиллар қарзи", "Ортиқча тўлов", "Прогноз 2027", "Ташкилот сўрови", "Кросс-курс", "Жами, USD", "Жами, сўм"];
  const body = rows.map((r) => [r.org, r.io, cur(r.cur), r.inv26 ?? "", r.growth ?? "", r.inv27 ?? "", r.debtPast ?? "", r.overpay ?? "", Math.round(forecast2027(r, overrides[r.id])), r.req ?? "", r.cross ?? "", Math.round(r.totusd || 0), toSum(r.totusd || 0, rate)]);
  save([head, ...body], "Бюджет сўрови 2027", "BADAL_бюджет_сўрови_2027.xlsx");
}
