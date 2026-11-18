import { useState } from "react";
import { Check, CornerUpLeft, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useStore } from "../store";
import { CROSS, ROWS, bankFee, cur, fmt, fmt1, fmt2, forecastBase, toSum, toUsd } from "../model";
import { PageHeader, Panel, Pick } from "../ui";

const STATE = { pending: "Кўриб чиқилмоқда", approved: "Келишилган", returned: "Қайтарилган" };
const now = () => new Date().toLocaleString("ru-RU").slice(0, 17);

// One place for the «Дастархан» (Расчёт 2027) chain, so the form and the approvals table agree.
export function calc(r, f, rate) {
  const base = forecastBase(r, f.hasInv, f.inv27);
  const total = base + (Number(f.debtPast) || 0) - (Number(f.overpay) || 0); // U = V
  const usd = toUsd(total, r.cur, rate); // Y
  const fee = bankFee(usd); // Z
  return { base, total, usd, fee, all: usd + fee, sum: toSum(usd + fee, rate) }; // AA, AB
}

export default function Submit() {
  const { role } = useStore();
  return role === "admin" ? <Approvals /> : <OrganForm />;
}

function OrganForm() {
  const { rows, submissions, setSubmissions, rate } = useStore();
  const [id, setId] = useState(rows[0]?.id);
  const r = rows.find((x) => x.id === id) || rows[0];
  const prev = submissions[r?.id];
  const blank = () => ({ hasInv: false, inv27: "", debtPast: "", overpay: "", files: {} });
  const [form, setForm] = useState(blank);
  if (!r) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const file = (k, n) => setForm((f) => ({ ...f, files: { ...f.files, [k]: n } }));
  const c = calc(r, form, rate);
  const need = [
    form.hasInv && !form.files.inv27 && "инвойс PDF",
    Number(form.debtPast) > 0 && !form.files.debt && "қарздорлик ҳужжати",
    Number(form.overpay) > 0 && !form.files.overpay && "ортиқча тўлов ҳужжати",
    !form.files.request && "валюта сўрови шакли",
  ].filter(Boolean);
  const canSend = c.total > 0 && need.length === 0 && prev?.state !== "pending" && prev?.state !== "approved";

  const send = () => {
    setSubmissions((s) => ({ ...s, [r.id]: { ...form, inv27: form.hasInv ? form.inv27 : "", req: String(Math.round(c.total)), state: "pending", at: now() } }));
    toast.success("Кўриб чиқишга юборилди", { description: "Администратор келишгач, сўмдаги қисми тизимда кўринади." });
    setForm(blank());
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Кейинги йил учун бюджет сўровини юбориш" sub="2027 йил · фақат ўз ташкилотларингиз бўйича" />
      <div className="grid gap-6 @5xl:grid-cols-[1.3fr_1fr]">
        <Panel>
          <div className="flex flex-col gap-6">
            <Pick
              label="Халқаро ташкилот"
              value={r.id}
              onChange={(v) => { setId(v); setForm(blank()); }}
              options={rows.map((x) => ({ value: x.id, label: x.io }))}
            />
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 text-sm @3xl:grid-cols-4">
              <Ctx k="Валюта" v={cur(r.cur) || "—"} />
              <Ctx k="Инвойс 2026" v={fmt(r.inv26)} />
              <Ctx k="Тўланган 2026 (SWIFT)" v={fmt(r.swift)} />
              <Ctx k="Прогноз ўсиш" v={r.growth != null ? `${fmt1(r.growth)} %` : "—"} />
            </div>

            <section className="flex flex-col gap-3">
              <label className="flex items-center gap-3">
                <Checkbox checked={form.hasInv} onCheckedChange={(v) => set("hasInv", !!v)} />
                <span className="font-medium">2027 йил инвойси мавжуд</span>
              </label>
              {form.hasInv ? (
                <Field label="Инвойс 2027" hint="қарз ва ортиқча тўловсиз" value={form.inv27} onChange={(v) => set("inv27", v)} file={form.files.inv27} onFile={(n) => file("inv27", n)} />
              ) : (
                <p className="text-muted-foreground">
                  Прогноз суммаси автоматик: {fmt(r.inv26 || r.pr26)} × (1 + {fmt1(Math.max(0, r.growth || 0))} %) = <b className="text-foreground tabular-nums">{fmt(c.base)} {cur(r.cur)}</b>
                </p>
              )}
            </section>

            <div className="grid gap-4 @3xl:grid-cols-2">
              <Field label="Қарздорлик (ўтган йиллар)" value={form.debtPast} onChange={(v) => set("debtPast", v)} file={form.files.debt} onFile={(n) => file("debt", n)} optional />
              <Field label="Ортиқча тўлов / тежалган маблағ" value={form.overpay} onChange={(v) => set("overpay", v)} file={form.files.overpay} onFile={(n) => file("overpay", n)} optional />
            </div>

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <div className="font-medium">
                  Валюта сўровини тасдиқловчи шакл <span className="text-unpaid">*</span>
                </div>
                <div className="text-sm text-muted-foreground">Ҳисоб-китоб тайёр бўлгач юкланг</div>
              </div>
              <PdfButton name={form.files.request} onFile={(n) => file("request", n)} />
            </section>
          </div>
        </Panel>

        <Panel title="Ҳисоб-китоб">
          <dl className="flex flex-col gap-3">
            <Row k={form.hasInv ? "Инвойс 2027" : "Прогноз (инвойс 2026 × ўсиш)"} v={`${fmt(c.base)} ${cur(r.cur)}`} />
            <Row k="+ Қарздорлик" v={fmt(Number(form.debtPast) || 0)} small />
            <Row k="− Ортиқча тўлов" v={fmt(Number(form.overpay) || 0)} small />
            <Row k="Жами прогноз сумма 2027" v={`${fmt(c.total)} ${cur(r.cur)}`} strong />
            <Row k="Кросс-курс" v={r.cur === "сўм" ? "—" : fmt1(CROSS[r.cur] ?? 0)} small />
            <Row k="АҚШ долларида" v={`${fmt(c.usd)} $`} />
            <Row k="Бошқа харажатлар (банк хизмати)" v={`${fmt(c.fee)} $`} small />
            <Row k="Жами, АҚШ долларида" v={`${fmt(c.all)} $`} strong />
            <Row k="Сўмда" v={prev?.state === "approved" ? `${fmt(calc(r, prev, rate).sum)} сўм` : "келишилгандан сўнг"} muted={prev?.state !== "approved"} />
          </dl>
          <Button className="mt-5 w-full" disabled={!canSend} onClick={send}>
            <Send aria-hidden /> Кўриб чиқишга юбориш
          </Button>
          {need.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Юкланмаган: {need.join(", ")}.</p>}
          {prev && (
            <div className="mt-4 flex flex-col gap-1 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span>Юборилган: {fmt(Number(prev.req))} {cur(r.cur)} · {prev.at}</span>
                <StateTag state={prev.state} />
              </div>
              {prev.state === "returned" && prev.note && <span className="text-unpaid">Изоҳ: {prev.note}</span>}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function PdfButton({ name, onFile }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <label className={cn("cursor-pointer whitespace-nowrap", name && "text-paid")}>
        {name ? <Check aria-hidden /> : <Upload aria-hidden />} {name || "PDF юклаш"}
        <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
      </label>
    </Button>
  );
}

function Field({ label, hint, value, onChange, file, onFile, optional }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm">
        {label}
        {hint && <span className="text-muted-foreground"> · {hint}</span>}
        {optional && <span className="text-muted-foreground"> · бўлмаса, бўш қолдиринг</span>}
        <Input type="number" inputMode="decimal" min="0" className="mt-1.5 tabular-nums" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      {(!optional || Number(value) > 0) && (
        <div className="self-start">
          <PdfButton name={file} onFile={onFile} />
        </div>
      )}
    </div>
  );
}

function Approvals() {
  const { submissions, setSubmissions, rate, setRate, setMessages } = useStore();
  const [back, setBack] = useState(null);
  const [note, setNote] = useState("");
  const items = Object.entries(submissions).map(([id, s]) => ({ r: ROWS.find((x) => x.id === id), s })).filter((x) => x.r);
  const decide = (r, state, comment = "") => {
    setSubmissions((all) => ({ ...all, [r.id]: { ...all[r.id], state, note: comment } }));
    setMessages((m) => [...m, { id: Date.now(), org: r.org, from: "admin", text: state === "approved" ? `${r.io}: 2027 йил бюджет сўрови келишилди.` : `${r.io}: бюджет сўрови қайтарилди. ${comment}`, at: now() }]);
    toast(state === "approved" ? "Сўров келишилди" : "Сўров қайтарилди");
    setBack(null);
    setNote("");
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Кейинги йил учун бюджет сўровини юбориш модули" sub="Масъул органлар юборган 2027 йил сўровлари: келишиш ёки қайтариш">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Курс, 1 $ =</span>
          <Input type="number" inputMode="numeric" className="h-9 w-28 tabular-nums" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} aria-label="АҚШ доллари курси, сўм" />
          <span className="text-muted-foreground">сўм</span>
        </label>
      </PageHeader>
      {items.length === 0 ? (
        <Empty className="rounded-xl border bg-card py-16">
          <EmptyHeader>
            <EmptyTitle>Кўриб чиқиладиган сўров йўқ</EmptyTitle>
            <EmptyDescription>Масъул давлат органи ролида кириб, сўров юборинг: у шу ерда пайдо бўлади.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Сўровлар ҳисоб-китоби · 2027</h2>
            <p className="text-sm text-muted-foreground">Демо сўровлар · «Расчёт 2027» асосида · жадвални ёнга суринг</p>
          </div>
          <p className="px-5 pb-4 text-sm text-muted-foreground">Сўмдаги ҳисоб-китоб дастлабки: бюджет сўровига фақат келишилган қиймат ўтади.</p>
          <div role="region" aria-label="2027 йил сўровлари ҳисоб-китоби" tabIndex={0} className="w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-signal">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="min-w-72 whitespace-normal border-r bg-card pl-5 @3xl:sticky @3xl:left-0 @3xl:z-10">Масъул орган / халқаро ташкилот</TableHead>
                  <TableHead className="border-r">Ҳолат</TableHead>
                  <TableHead className="min-w-56 border-r text-right">Қарор</TableHead>
                  <TableHead className="border-r">Валюта</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Инвойс 2024</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Инвойс 2025</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Прогноз 2026</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Инвойс 2026</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Ўтказилган 2026</TableHead>
                  <TableHead className="min-w-24 whitespace-normal border-r text-right">Ўсиш, %</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Инвойс 2027</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Ўтган йиллар қарзи</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Ортиқча тўлов</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Прогноз 2027</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Ташкилот сўрови</TableHead>
                  <TableHead className="min-w-24 whitespace-normal border-r text-right">Кросс-курс</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">АҚШ долларида</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Банк хизмати, $</TableHead>
                  <TableHead className="min-w-28 whitespace-normal border-r text-right">Жами, $</TableHead>
                  <TableHead className="min-w-36 whitespace-normal border-r text-right">Ҳисобланган, сўм</TableHead>
                  <TableHead className="pr-5">Ҳужжатлар</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(({ r, s }) => {
                  const c = calc(r, s, rate);
                  const amount = (v) => v === "" || v == null ? "—" : fmt(Number(v));
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-80 whitespace-normal border-r bg-card pl-5 @3xl:sticky @3xl:left-0 @3xl:z-10">
                        <div className="text-sm text-muted-foreground">{r.org}</div>
                        {r.io}
                        <div className="text-sm text-muted-foreground">{s.hasInv ? "инвойс асосида" : "прогноз асосида"}</div>
                      </TableCell>
                      <TableCell className="border-r"><StateTag state={s.state} /></TableCell>
                      <TableCell className="border-r text-right">
                        {s.state !== "pending" ? (
                          <div className="whitespace-normal text-sm text-muted-foreground">
                            <div>{s.at}</div>
                            {s.state === "returned" && s.note && <div className="mt-1 text-unpaid">{s.note}</div>}
                          </div>
                        ) : back === r.id ? (
                          <div className="flex min-w-64 flex-col items-end gap-2">
                            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Қайтариш сабаби" autoFocus aria-label="Қайтариш сабаби" />
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => { setBack(null); setNote(""); }}>Бекор қилиш</Button>
                              <Button size="sm" variant="outline" disabled={!note.trim()} onClick={() => decide(r, "returned", note.trim())}>Қайтариш</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setBack(r.id)}>
                              <CornerUpLeft aria-hidden /> Қайтариш
                            </Button>
                            <Button size="sm" onClick={() => decide(r, "approved")}>
                              <Check aria-hidden /> Келишиш
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="border-r">{cur(r.cur) || "—"}</TableCell>
                      <NumberCell>{amount(r.inv24)}</NumberCell>
                      <NumberCell>{amount(r.inv25)}</NumberCell>
                      <NumberCell>{amount(r.pr26)}</NumberCell>
                      <NumberCell>{amount(r.inv26)}</NumberCell>
                      <NumberCell>{amount(r.paid26)}</NumberCell>
                      <NumberCell>{r.growth == null ? "—" : fmt2(r.growth)}</NumberCell>
                      <NumberCell>{s.hasInv ? amount(s.inv27) : "—"}</NumberCell>
                      <NumberCell>{amount(s.debtPast)}</NumberCell>
                      <NumberCell>{amount(s.overpay)}</NumberCell>
                      <NumberCell>{fmt(c.total)}</NumberCell>
                      <NumberCell>{amount(s.req)}</NumberCell>
                      <NumberCell>{r.cur === "сўм" || CROSS[r.cur] == null ? "—" : fmt2(CROSS[r.cur])}</NumberCell>
                      <NumberCell>{fmt(c.usd)}</NumberCell>
                      <NumberCell>{fmt(c.fee)}</NumberCell>
                      <NumberCell>{fmt(c.all)}</NumberCell>
                      <NumberCell>{fmt(c.sum)}</NumberCell>
                      <TableCell className="whitespace-nowrap pr-5 text-sm text-muted-foreground">{Object.values(s.files || {}).filter(Boolean).length} та PDF</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}

const NumberCell = ({ children }) => (
  <TableCell className="whitespace-nowrap border-r text-right tabular-nums">{children}</TableCell>
);

const Ctx = ({ k, v }) => (
  <div>
    <div className="text-muted-foreground">{k}</div>
    <div className="mt-0.5 font-medium tabular-nums">{v}</div>
  </div>
);

const Row = ({ k, v, strong, small, muted }) => (
  <div className={cn("flex items-baseline justify-between gap-4", strong && "border-t pt-3")}>
    <dt className="text-muted-foreground">{k}</dt>
    <dd className={cn("tabular-nums", strong ? "font-display text-lg font-semibold" : small ? "text-muted-foreground" : "font-medium", muted && "font-normal text-muted-foreground")}>{v}</dd>
  </div>
);

const StateTag = ({ state }) => (
  <span className={cn("inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-sm font-medium", state === "approved" ? "border-paid/40 text-paid" : state === "returned" ? "border-unpaid/40 text-unpaid" : "border-sent/50 text-sent-ink")}>{STATE[state]}</span>
);
