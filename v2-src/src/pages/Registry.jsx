import { useState } from "react";
import * as XLSX from "xlsx";
import { Check, CornerUpLeft, FileSpreadsheet, Plus, Send, ShieldAlert, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SOURCES, useStore } from "../store";
import { CURRENCIES, PT, ROWS, cur } from "../model";
import { PageHeader } from "../ui";

const uid = () => `n${Date.now()}${Math.round(Math.random() * 1e4)}`;
const now = () => new Date().toLocaleString("ru-RU").slice(0, 17);

// «Рўйхат»: масъул органлар ва уларнинг рақами, халқаро ташкилотлар, бюджет манбаи, тури, шахсий ҳисоб рақами,
// plus «Фойдаланувчилар»: appointment letters that give a person access (555.docx, 1-банд).
export default function Registry() {
  const { role } = useStore();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Рўйхат" sub="Масъул органлар, халқаро ташкилотлар, бюджет манбаи ва тури; фойдаланувчиларга ваколат" />
      <Tabs defaultValue="orgs">
        <TabsList>
          <TabsTrigger value="orgs">Ташкилотлар</TabsTrigger>
          <TabsTrigger value="users" disabled>Фойдаланувчилар</TabsTrigger>
        </TabsList>
        <TabsContent value="orgs" className="mt-4">
          {role === "admin" ? <AdminOrgs /> : <OrganOrgs />}
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          {role === "admin" ? <AdminUsers /> : <OrganUsers />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Sel({ value, onChange, options, label }) {
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {Object.entries(options).map(([v, l]) => (
        <NativeSelectOption key={v} value={v}>
          {l}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function AdminOrgs() {
  const { reg, setReg, rows, suspended, setSuspended, setMessages } = useStore();
  const [parsed, setParsed] = useState(null);

  const patchBlock = (key, patch) => setReg((all) => all.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const patchItem = (key, id, patch) => setReg((all) => all.map((b) => (b.key === key ? { ...b, items: b.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : b)));
  const addExpense = (key, it) => patchItem(key, it.id, { expenseItems: [...(it.expenseItems || []), { id: uid(), value: "" }] });
  const patchExpense = (key, it, expenseId, value) =>
    patchItem(key, it.id, { expenseItems: (it.expenseItems || []).map((expense) => expense.id === expenseId ? { ...expense, value } : expense) });
  const dropExpense = (key, it, expenseId) =>
    patchItem(key, it.id, { expenseItems: (it.expenseItems || []).filter((expense) => expense.id !== expenseId) });
  const addAfter = (key, i) =>
    setReg((all) => all.map((b) => (b.key === key ? { ...b, items: [...b.items.slice(0, i + 1), { id: uid(), io: "", src: "budget", pt: "member", acct: "", fresh: true }, ...b.items.slice(i + 1)] } : b)));
  const drop = (key, id) => setReg((all) => all.map((b) => (b.key === key ? { ...b, items: b.items.filter((it) => it.id !== id) } : b)));
  const addOrgan = () => {
    const key = uid();
    setReg((all) => [...all, { key, no: String(all.length + 1), org: "", fresh: true, items: [{ id: uid(), io: "", src: "budget", pt: "member", acct: "" }] }]);
  };

  const read = async (file) => {
    const wb = XLSX.read(await file.arrayBuffer());
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
    const names = new Set(ROWS.map((r) => r.io));
    const texts = data.flat().filter((v) => typeof v === "string" && v.trim().length > 12).map((v) => v.replace(/\s+/g, " ").trim());
    setParsed({ file: file.name, rows: data.length, known: texts.filter((t) => names.has(t)).length });
  };

  const toggle = (org, on) => {
    setSuspended((s) => ({ ...s, [org]: on }));
    if (on) {
      setMessages((m) => [...m, { id: Date.now(), org, from: "admin", system: true, text: "ПҚ-4756 талаблари бажарилмаганлиги сабабли 4-гуруҳ харажатлари вақтинча тўхтатилди. УзАСБОга хабарнома юборилди.", at: now() }]);
      toast.warning("4-гуруҳ харажатлари тўхтатилди", { description: org });
    } else toast.success("4-гуруҳ харажатлари қайта очилди", { description: org });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-muted-foreground">Тури ва манбаи «Молиялаштириш таҳлили» фильтрлари ва ҳисоботни тақсимлайди. Шахсий ҳисоб рақамини фақат Администратор киритади.</p>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <FileSpreadsheet aria-hidden /> 1-иловани юклаш (.xlsx)
            <input type="file" accept=".xlsx,.xls" className="sr-only" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
          </label>
        </Button>
      </div>
      {parsed && (
        <div className="rounded-xl border border-signal/30 bg-signal-soft p-4">
          {parsed.file}: {parsed.rows} та сатр, {parsed.known} таси рўйхатга мос. Демода рўйхат файлдан ўзгармайди.
        </div>
      )}

      {reg.map((b) => {
        const items = rows.filter((r) => r.org === b.org);
        const unpaid = items.filter((r) => r.status === "unpaid" && !r.isNew).length;
        return (
          <section key={b.key} className="rounded-xl border bg-card">
            <header className="flex flex-wrap items-end gap-3 border-b p-4">
              <label className="flex w-20 flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">№</span>
                <Input value={b.no} onChange={(e) => patchBlock(b.key, { no: e.target.value })} className="tabular-nums" aria-label="Тартиб рақами" />
              </label>
              <label className="flex min-w-72 flex-1 flex-col gap-1.5 text-sm">
                <span className="text-muted-foreground">Масъул вазирлик ёки идора</span>
                <Input value={b.org} autoFocus={b.fresh} onChange={(e) => patchBlock(b.key, { org: e.target.value })} className="font-medium" placeholder="Номи" />
              </label>
              <div className="flex items-center gap-5 pb-2">
                {unpaid ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-unpaid">
                    <ShieldAlert className="size-4" aria-hidden /> {unpaid} та тўланмаган
                  </span>
                ) : null}
                <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                  <Switch checked={!!suspended[b.org]} onCheckedChange={(v) => toggle(b.org, v)} />
                  4-гуруҳ харажатларини тўхтатиш
                </label>
              </div>
            </header>
            <div className="flex flex-col gap-2 p-4">
              <div className="hidden grid-cols-[minmax(0,1fr)_165px_165px_240px_150px_125px_36px] gap-2 text-sm text-muted-foreground @5xl:grid">
                <span>Халқаро ташкилот</span>
                <span>Бюджет манбаи</span>
                <span>Тури</span>
                <span>Шахсий ҳисоб рақами</span>
                <span>Харажат моддаси</span>
                <span />
                <span />
              </div>
              {b.items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 gap-2 @5xl:items-start @5xl:grid-cols-[minmax(0,1fr)_165px_165px_240px_150px_125px_36px]">
                  <Input value={it.io} title={it.io} autoFocus={it.fresh} onChange={(e) => patchItem(b.key, it.id, { io: e.target.value })} placeholder="Халқаро ташкилот номи" aria-label="Халқаро ташкилот" />
                  <Sel label="Бюджет манбаи" value={it.src} onChange={(v) => patchItem(b.key, it.id, { src: v })} options={SOURCES} />
                  <Sel label="Тури" value={it.pt} onChange={(v) => patchItem(b.key, it.id, { pt: v })} options={PT} />
                  <Input value={it.acct} onChange={(e) => patchItem(b.key, it.id, { acct: e.target.value.replace(/\D/g, "") })} className="font-mono text-sm" inputMode="numeric" placeholder="27 рақам" aria-label="Шахсий ҳисоб рақами" />
                  <div className="flex flex-col gap-2">
                    {(it.expenseItems?.length ? it.expenseItems : [null]).map((expense, n) => (
                      <div key={expense?.id ?? "first"} className="flex items-center gap-1">
                        <Input
                          value={expense?.value ?? ""}
                          autoFocus={!!expense && !expense.value}
                          onChange={(e) => (expense ? patchExpense(b.key, it, expense.id, e.target.value) : patchItem(b.key, it.id, { expenseItems: [{ id: uid(), value: e.target.value }] }))}
                          placeholder="Харажат моддаси"
                          aria-label="Харажат моддаси"
                        />
                        {n > 0 && (
                          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => dropExpense(b.key, it, expense.id)} aria-label="Харажат моддасини ўчириш">
                            <Trash2 aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start @5xl:pl-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-full justify-start"
                      disabled={!!it.expenseItems?.length && !it.expenseItems[it.expenseItems.length - 1].value.trim()}
                      onClick={() => addExpense(b.key, it)}
                      aria-label="Харажат моддаси қўшиш"
                    >
                      <Plus aria-hidden /> {it.expenseItems?.length ? "Яна қўшиш" : "Белгилаш"}
                    </Button>
                  </div>
                  <div className="flex">
                    {b.items.length > 1 && !ROWS.some((r) => r.id === it.id) && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => drop(b.key, it.id)} aria-label="Ўчириш">
                        <Trash2 aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="self-start" onClick={() => addAfter(b.key, b.items.length - 1)}>
                <Plus aria-hidden /> Халқаро ташкилот қўшиш
              </Button>
            </div>
          </section>
        );
      })}
      <Button variant="outline" className="self-start" onClick={addOrgan}>
        <Plus aria-hidden /> Масъул орган қўшиш
      </Button>
    </div>
  );
}

function OrganOrgs() {
  const { rows, session, setReg } = useStore();
  const setCurrency = (id, currency) => setReg((all) => all.map((b) => b.org !== session.org ? b : {
    ...b,
    items: b.items.map((it) => it.id === id ? { ...it, registryCurrency: currency } : it),
  }));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Валютани масъул орган танлайди. Рўйхатдаги танлов мавжуд ҳисоб-китобларни автоматик ўзгартирмайди.</p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-5">№</TableHead>
              <TableHead>Халқаро ташкилот</TableHead>
              <TableHead>Бюджет манбаи</TableHead>
              <TableHead>Тури</TableHead>
              <TableHead>Шахсий ҳисоб рақами</TableHead>
              <TableHead>Харажат моддаси</TableHead>
              <TableHead className="pr-5">Валюта</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="pl-5 tabular-nums text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="max-w-xl whitespace-normal font-medium">{r.io}</TableCell>
                <TableCell className="whitespace-nowrap">{SOURCES[r.src || "budget"]}</TableCell>
                <TableCell className="whitespace-nowrap">{PT[r.pt]}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{r.acct || "—"}</TableCell>
                <TableCell className="whitespace-normal">{r.expenseItems.filter((e) => e.value.trim()).map((e) => e.value).join(", ") || "—"}</TableCell>
                <TableCell className="pr-5">
                  <NativeSelect value={r.registryCurrency} onChange={(e) => setCurrency(r.id, e.target.value)} aria-label={`${r.io}: валюта`}>
                    <NativeSelectOption value="">Танланг</NativeSelectOption>
                    {CURRENCIES.map((c) => <NativeSelectOption key={c} value={c}>{cur(c)}</NativeSelectOption>)}
                  </NativeSelect>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const LSTATE = {
  pending: { t: "Кўриб чиқилмоқда", c: "text-sent-ink" },
  approved: { t: "Ваколат берилди", c: "text-paid" },
  returned: { t: "Қайтарилди", c: "text-unpaid" },
};

function OrganUsers() {
  const { session, letters, setLetters } = useStore();
  const [f, setF] = useState({ name: "", post: "", phone: "", file: "" });
  const mine = letters.filter((l) => l.org === session.org);
  const ok = f.name.trim() && f.post.trim() && f.file;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex max-w-3xl flex-col gap-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Масъул шахсни тайинлаш</h2>
          <p className="mt-1 text-muted-foreground">Ташкилот хати билан масъул шахсни тайинланг: Администратор кўриб чиқиб ваколат беради.</p>
        </div>
        <div className="grid gap-3 @3xl:grid-cols-3">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ф.И.Ш." aria-label="Ф.И.Ш." />
          <Input value={f.post} onChange={(e) => setF({ ...f, post: e.target.value })} placeholder="Лавозими" aria-label="Лавозими" />
          <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Телефон" aria-label="Телефон" inputMode="tel" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              {f.file ? <Check aria-hidden /> : <Upload aria-hidden />} {f.file || "Тайинлаш хати (PDF)"}
              <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && setF({ ...f, file: e.target.files[0].name })} />
            </label>
          </Button>
          <Button
            disabled={!ok}
            onClick={() => {
              setLetters((all) => [...all, { id: uid(), org: session.org, ...f, state: "pending", at: now() }]);
              setF({ name: "", post: "", phone: "", file: "" });
              toast.success("Хат юборилди", { description: "Администратор ваколат бергач, ходим рўйхатда пайдо бўлади." });
            }}
          >
            <Send aria-hidden /> Юбориш
          </Button>
        </div>
      </section>
      {mine.length > 0 && <LettersTable list={mine} />}
    </div>
  );
}

function AdminUsers() {
  const { letters, setLetters, setStaff, setMessages } = useStore();
  const decide = (l, state) => {
    setLetters((all) => all.map((x) => (x.id === l.id ? { ...x, state } : x)));
    if (state === "approved") setStaff((all) => all.map((s) => (s.org === l.org ? { ...s, name: l.name, post: l.post, phone: l.phone || s.phone } : s)));
    setMessages((m) => [...m, { id: Date.now(), org: l.org, from: "admin", text: state === "approved" ? `${l.name}га тизимда ишлаш ваколати берилди.` : `${l.name} бўйича хат қайтарилди: маълумотларни текширинг.`, at: now() }]);
    toast(state === "approved" ? "Ваколат берилди" : "Қайтарилди");
  };
  return letters.length === 0 ? (
    <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">Тайинлаш хатлари йўқ. Масъул давлат органи ролида кириб, хат юборинг.</div>
  ) : (
    <LettersTable list={letters} decide={decide} />
  );
}

function LettersTable({ list, decide }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Масъул орган</TableHead>
            <TableHead>Ф.И.Ш., лавозими</TableHead>
            <TableHead>Хат</TableHead>
            <TableHead>Ҳолат</TableHead>
            <TableHead className="pr-5 text-right">{decide ? "Қарор" : "Юборилган"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="max-w-72 whitespace-normal pl-5">{l.org}</TableCell>
              <TableCell>
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-muted-foreground">
                  {l.post}
                  {l.phone && ` · ${l.phone}`}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{l.file}</TableCell>
              <TableCell className={cn("whitespace-nowrap text-sm font-medium", LSTATE[l.state].c)}>{LSTATE[l.state].t}</TableCell>
              <TableCell className="pr-5 text-right">
                {decide && l.state === "pending" ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => decide(l, "returned")}>
                      <CornerUpLeft aria-hidden /> Қайтариш
                    </Button>
                    <Button size="sm" onClick={() => decide(l, "approved")}>
                      <Check aria-hidden /> Ваколат бериш
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{l.at}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
