import { Fragment, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useStore } from "../store";
import { CURRENCIES, EXEC, ORGS, PT, cur, fmt, fmt1, toUsd } from "../model";
import { Figure, PageHeader, Panel, Pick, Status, sliceAcct } from "../ui";
import { DocsDialog } from "./Docs";
import { exportAnalysis } from "../exporter";

const QL = ["I чорак", "II чорак", "III чорак", "IV чорак"];
const short = (n) => (n >= 1e9 ? `${fmt1(n / 1e9)} млрд` : n >= 1e6 ? `${fmt1(n / 1e6)} млн` : n >= 1e3 ? `${fmt(n / 1e3)} минг` : fmt(n));
const nfAxis = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const axis = (n) => (n >= 1e9 ? `${nfAxis.format(n / 1e9)} млрд` : n >= 1e6 ? `${nfAxis.format(n / 1e6)} млн` : n >= 1e3 ? `${nfAxis.format(n / 1e3)} минг` : fmt(n));

const PT_COLOR = { member: "var(--color-primary)", shares: "var(--color-share)", voluntary: "var(--color-sent)" };

export default function Financing() {
  const { rows, role, rate } = useStore();
  const [org, setOrg] = useState("all");
  const [pt, setPt] = useState("all");
  const [mode, setMode] = useState("usd"); // all | uzs | usd | one
  const [one, setOne] = useState("USD");
  const [source, setSource] = useState("budget");
  const [open, setOpen] = useState(null);
  const [docsFor, setDocsFor] = useState(null);

  const list = useMemo(
    () =>
      rows.filter(
        (r) =>
          (org === "all" || r.org === org) &&
          (pt === "all" || r.pt === pt) &&
          (r.src || "budget") === source &&
          (mode !== "one" || r.cur === one),
      ),
    [rows, org, pt, mode, one, source],
  );

  const conv = (amount, c) => (mode === "one" ? amount || 0 : mode === "uzs" ? toUsd(amount, c, rate) * rate : toUsd(amount, c, rate));
  const unit = mode === "one" ? cur(one) : mode === "uzs" ? "сўм" : "$";
  const sum = (key) => list.reduce((a, r) => a + conv(r[key], r.cur), 0);
  const plan = sum("pr26"), inv = sum("inv26"), swift = sum("swift"), paid = sum("paidOk"), recv = sum("receivable");
  const rest = Math.max(inv - swift, 0);
  const byCur = CURRENCIES.map((c) => ({ c, paid: list.filter((r) => r.cur === c).reduce((a, r) => a + (r.paidOk || 0), 0) })).filter((x) => x.paid);
  const counts = { unpaid: 0, sent: 0, paid: 0 };
  list.forEach((r) => counts[r.status]++);
  // Quarterly totals, two views: «Тасдиқланган» = only agreed («Тўланган») obligations; «Ўтказилган» = every SWIFT transfer.
  const qConv = (amount, c) => (mode === "all" ? toUsd(amount, c, rate) : conv(amount, c));
  const qUnit = mode === "all" ? "$" : unit;
  const quarters = [1, 2, 3, 4].map((q) => {
    const inQ = list.filter((r) => r.q === q && r.status === "paid");
    const sentQ = list.filter((r) => r.q === q && r.swift > 0);
    return {
      q: QL[q - 1],
      paid: inQ.reduce((a, r) => a + qConv(r.paidOk, r.cur), 0),
      n: inQ.length,
      sent: sentQ.reduce((a, r) => a + qConv(r.swift, r.cur), 0),
      recv: sentQ.reduce((a, r) => a + qConv(r.receivable, r.cur), 0),
      nSent: sentQ.length,
    };
  });
  const ptData = Object.keys(PT).map((k) => ({ k, n: list.filter((r) => r.pt === k).length }));
  const ptTotal = ptData.reduce((a, x) => a + x.n, 0) || 1;
  const orgOptions = role === "organ" ? [] : [{ value: "all", label: "Барча масъул органлар" }, ...ORGS.map((o) => ({ value: o.org, label: o.org }))];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Молиялаштириш таҳлили" sub="2026 йил · аъзолик мажбуриятлари ва тўловлар">
        <Button variant="outline" onClick={() => exportAnalysis(list, rate)}>
          <Download aria-hidden /> Таҳлил (1-илова)
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Йил</span>
          <span className="flex h-9 items-center rounded-md border px-3 font-medium tabular-nums">2026</span>
        </label>
        {role !== "organ" && <Pick label="Масъул вазирлик ёки идора" value={org} onChange={setOrg} options={orgOptions} className="min-w-72 flex-1" />}
        <Pick label="Тўлов тури" value={pt} onChange={setPt} options={[{ value: "all", label: "Барчаси" }, ...Object.entries(PT).map(([value, label]) => ({ value, label }))]} />
        <Pick
          label="Бюджет манбаи"
          value={source}
          onChange={setSource}
          options={[{ value: "budget", label: "Давлат бюджети" }, { value: "extra", label: "Бюджетдан ташқари маблағлар" }]}
        />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Валюта бирлиги</span>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && setMode(v)}>
              <ToggleGroupItem value="all">Барча валюталар</ToggleGroupItem>
              <ToggleGroupItem value="uzs">Сўмда</ToggleGroupItem>
              <ToggleGroupItem value="usd">АҚШ долларида</ToggleGroupItem>
              <ToggleGroupItem value="one">Тегишли валюта</ToggleGroupItem>
            </ToggleGroup>
            {mode === "one" && (
              <Pick label="" value={one} onChange={setOne} options={CURRENCIES.map((c) => ({ value: c, label: cur(c) }))} className="min-w-24" />
            )}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty className="rounded-xl border bg-card py-16">
          <EmptyHeader>
            <EmptyTitle>Танланган шартларга мос мажбурият йўқ</EmptyTitle>
            <EmptyDescription>
              {source === "extra"
                ? "Бюджетдан ташқари маблағлар ҳисобидан тўловлар бўйича маълумот ҳали юкланмаган. Манба файлда фақат Давлат бюджети бўлими бор."
                : "Фильтрларни ўзгартириб кўринг."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section className="rounded-xl border bg-card p-5">
            {mode === "all" ? (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">Тўланган маблағ, ҳар бир валютада алоҳида</div>
                <div className="flex flex-wrap gap-x-10 gap-y-4">
                  {byCur.map((x) => (
                    <Figure key={x.c} label={cur(x.c)} value={fmt(x.paid)} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6 @3xl:grid-cols-3 @5xl:grid-cols-5">
                  <Figure label="2026 прогнози" value={`${fmt(plan)} ${unit}`} sub="аниқланган режа ўрнида" />
                  <Figure label="Инвойс 2026" value={`${fmt(inv)} ${unit}`} />
                  <Figure label="Ўтказилган (SWIFT)" value={`${fmt(swift)} ${unit}`} sub="УзАСБО / ДМБАТ" tone="sent" />
                  <Figure label="Тўланган" value={`${fmt(paid)} ${unit}`} sub="ҳужжатлар келишилган" tone="paid" />
                  <Figure label="Дебиторлик" value={`${fmt(recv)} ${unit}`} sub="ўтказилган, келишилмаган" tone={recv > 0 ? "unpaid" : undefined} />
                </div>
                <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Инвойснинг ${fmt1((paid / (inv || 1)) * 100)} % тўланган, ${fmt1((recv / (inv || 1)) * 100)} % дебиторлик`}>
                  <div className="h-full bg-paid transition-[width]" style={{ width: `${Math.min((paid / (inv || 1)) * 100, 100)}%` }} />
                  <div className="h-full bg-sent transition-[width]" style={{ width: `${Math.min((recv / (inv || 1)) * 100, 100)}%` }} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Инвойснинг {fmt1((paid / (inv || 1)) * 100)} % тўланган, {fmt1((recv / (inv || 1)) * 100)} % дебиторликда, ўтказилмагани {fmt(rest)} {unit}
                  {mode !== "one" && " · USD эквиваленти файлдаги 2027 кросс-курслари бўйича"}
                </div>
              </>
            )}
          </section>

          <div className="grid gap-6 @5xl:grid-cols-[1.4fr_1fr]">
            <Panel title="Чораклар кесимида тўловлар">
              <Quarters data={quarters} unit={qUnit} note={mode === "all" ? "Барча валюталар USD эквивалентида" : null} />
            </Panel>
            <Panel title="Тўлов турлари" className="flex flex-col" bodyClassName="flex flex-1 flex-col justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="relative size-44 shrink-0">
                  <PieChart width={176} height={176} aria-label="Тўлов турлари бўйича улуш">
                    <Pie data={ptData.filter((x) => x.n)} dataKey="n" nameKey="k" cx="50%" cy="50%" startAngle={90} endAngle={-270} innerRadius={56} outerRadius={84} paddingAngle={ptData.filter((x) => x.n).length > 1 ? 2 : 0} strokeWidth={0} isAnimationActive animationDuration={500}>
                      {ptData.filter((x) => x.n).map((x) => (
                        <Cell key={x.k} fill={PT_COLOR[x.k]} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-semibold tabular-nums">{ptData.reduce((a, x) => a + x.n, 0)}</span>
                    <span className="text-sm text-muted-foreground">мажбурият</span>
                  </div>
                </div>
                <ul className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-3">
                  {ptData.map((x) => (
                    <li key={x.k} className="contents">
                      <span className="size-3 shrink-0 rounded-sm" style={{ background: PT_COLOR[x.k] }} aria-hidden />
                      <span className="min-w-0 leading-snug text-pretty">{PT[x.k]}</span>
                      <span className="text-right tabular-nums text-muted-foreground">{x.n}</span>
                      <span className="whitespace-nowrap text-right font-medium tabular-nums">{fmt1((x.n / ptTotal) * 100)} %</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </div>

          <Panel
            title="Мажбуриятлар рўйхати"
            bodyClassName="px-0 pb-2"
            action={
              <div className="flex flex-wrap items-center gap-5 text-sm">
                {["unpaid", "sent", "paid"].map((s) => (
                  <span key={s} className="inline-flex items-center gap-2">
                    <Status status={s} />
                    <b className="tabular-nums">{counts[s]}</b>
                  </span>
                ))}
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Масъул орган</TableHead>
                  <TableHead>Халқаро ташкилот</TableHead>
                  <TableHead>Тўлов тури</TableHead>
                  <TableHead className="text-right">Инвойс 2026</TableHead>
                  <TableHead className="text-right">Ўтказилган (SWIFT)</TableHead>
                  <TableHead>Мақом</TableHead>
                  <TableHead className="pr-5 text-right">Ҳужжатлар</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r, i) => {
                  const first = i === 0 || list[i - 1].org !== r.org;
                  const isOpen = open === r.id;
                  const a = sliceAcct(r.acct);
                  return (
                    <Fragment key={r.id}>
                      <TableRow className={cn(isOpen && "bg-signal-soft", !first && "border-t-0")}>
                        <TableCell className="max-w-56 whitespace-normal pl-5 align-top text-muted-foreground">{first ? r.org : ""}</TableCell>
                        <TableCell className="max-w-96 whitespace-normal">
                          <button
                            type="button"
                            className="flex w-full items-start gap-2 text-left font-medium text-foreground"
                            aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : r.id)}
                          >
                            <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                            {r.io}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{PT[r.pt]}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{r.inv26 != null ? `${fmt(r.inv26)} ${cur(r.cur)}` : "—"}</TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">{r.swift ? `${fmt(r.swift)} ${cur(r.cur)}` : "—"}</TableCell>
                        <TableCell>
                          <Status status={r.status} />
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDocsFor(r)}>
                            <FileText aria-hidden /> Танишиш
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-signal-soft hover:bg-signal-soft">
                          <TableCell colSpan={7} className="px-5 pb-5 pt-1">
                            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 @3xl:grid-cols-4">
                              <Detail k="Дебиторлик (УзАСБО / ДМБАТ)" v={r.status === "paid" ? "ёпилган" : r.receivable ? `${fmt(r.receivable)} ${cur(r.cur)} · очиқ` : "—"} />
                              <Detail k="Ҳисоботда" v={EXEC[r.status]} />
                              <Detail k="Қолдиқ" v={r.inv26 != null ? `${fmt(Math.max((r.inv26 || 0) - (r.swift || 0), 0))} ${cur(r.cur)}` : "—"} />
                              <Detail k={`Қарздорлик, жамланма${r.balOwn ? " (орган киритган)" : ""}`} v={r.debtBal ? `${fmt(r.debtBal)} ${cur(r.cur)}` : "—"} />
                              <Detail k={`Ҳақдорлик, жамланма${r.balOwn ? " (орган киритган)" : ""}`} v={r.creditBal ? `${fmt(r.creditBal)} ${cur(r.cur)}` : "—"} />
                              <Detail k="USD эквиваленти (ўтказилган)" v={`${fmt(toUsd(r.swift, r.cur, rate))} $`} />
                              <Detail k="Казначейлик ҳисобрақами" v={r.acct || "—"} mono />
                              <Detail k="Бўлим / кичик бўлим / боб" v={a ? `${a.razdel} / ${a.podrazdel} / ${a.glava}` : "—"} mono />
                              <Detail k="Валюта сотиб олинган сана, курс" v="ДМБАТ интеграциясидан" muted />
                              <Detail k="Юридик мажбурият (шартномада)" v="ДМБАТ интеграциясидан" muted />
                            </dl>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>
        </>
      )}
      <DocsDialog row={docsFor} onClose={() => setDocsFor(null)} />
    </div>
  );
}

function Detail({ k, v, mono, muted }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd className={cn("mt-0.5 font-medium tabular-nums break-words", mono && "font-mono text-sm", muted && "font-normal text-muted-foreground")}>{v}</dd>
    </div>
  );
}

// Switch between the two sums the chart can show.
const VIEW = {
  paid: { label: "Тасдиқланган (тўланган)", aria: "тўланган суммалар", fill: "var(--color-paid)", dot: "bg-paid", val: (x) => x.paid, n: (x) => x.n,
    emptyT: "Танланган шартларда тўланган мажбурият йўқ", emptyD: "Администратор тўлов ҳужжатларини келишгач, сумма тегишли чоракда пайдо бўлади." },
  sent: { label: "Ўтказилган (SWIFT)", aria: "ўтказилган суммалар", fill: "var(--color-sent)", dot: "bg-sent", val: (x) => x.sent, n: (x) => x.nSent,
    emptyT: "Танланган шартларда ўтказма йўқ", emptyD: "Тўлов ҳужжати юкланиши билан у тегишли чоракда пайдо бўлади." },
};

function Quarters({ data, unit, note }) {
  const [view, setView] = useState("paid");
  const v = VIEW[view];
  const shown = data.map((x) => ({ q: x.q, v: v.val(x), n: v.n(x), recv: x.recv }));
  const sumShown = shown.reduce((a, x) => a + x.v, 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(x) => x && setView(x)} aria-label="Графикда кўрсатиладиган сумма">
          {Object.entries(VIEW).map(([k, o]) => (
            <ToggleGroupItem key={k} value={k} className="gap-2 px-3">
              <span className={cn("size-3 rounded-sm", o.dot)} aria-hidden />
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {note && <span className="text-muted-foreground">{note}</span>}
          <span className="tabular-nums">Жами: <span className="font-medium">{fmt(sumShown)} {unit}</span></span>
        </div>
      </div>
      {!sumShown ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>{v.emptyT}</EmptyTitle>
            <EmptyDescription>{v.emptyD}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="h-52" role="img" aria-label={`Чораклар бўйича ${v.aria}: ${shown.map((x) => `${x.q} ${fmt(x.v)} ${unit}`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shown} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="q" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 14 }} />
                <YAxis width={72} tickLine={false} axisLine={false} tickFormatter={axis} tick={{ fill: "var(--muted-foreground)", fontSize: 14 }} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14 }}
                  formatter={(val) => [`${fmt(val)} ${unit}`, v.label]}
                />
                <Bar key={view} dataKey="v" fill={v.fill} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
            {shown.map((x) => (
              <div key={x.q} className="min-w-0">
                <dt className="text-sm text-muted-foreground">{x.q} · {x.n} та</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{fmt(x.v)} {unit}</dd>
                {view === "sent" && x.recv > 0 && <dd className="text-sm tabular-nums text-sent-ink">{short(x.recv)} келишилмаган</dd>}
              </div>
            ))}
          </dl>
        </>
      )}
      <p className="text-sm text-muted-foreground">Чораклар намунавий SWIFT саналарга асосланган. Реал саналар интеграцияда аниқланади.</p>
    </div>
  );
}
