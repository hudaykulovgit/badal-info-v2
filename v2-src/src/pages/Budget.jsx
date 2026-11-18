import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Download, OctagonAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useStore } from "../store";
import { BUDGET_2026, CEILING_2027, FLAGS, SVOD, cur, fmt, fmt1, fmt2, forecast2027, forecastFrom, mlnUsd, mlrdSum, toSum } from "../model";
import { FlagChip, Figure, PageHeader, Panel } from "../ui";
import { exportBudget } from "../exporter";

const FILE_TOTAL_USD = 96731704.77186176; // «Расчёт 2027» ЖАМИ сатри

export default function Budget() {
  const { rows, rate, role } = useStore();
  const [quality, setQuality] = useState("all");
  const [open, setOpen] = useState(() => new Set());

  const totalUsd = rows.reduce((a, r) => a + (r.totusd || 0), 0);
  // «Расчёт 2027», столбец AB: ROUND(Z1 × AA / 1000) × 1000 по каждой строке, итог = сумма строк.
  const totalUzs = rows.reduce((a, r) => a + toSum(r.totusd || 0, rate), 0);
  const groups = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      if (!m.has(r.org)) m.set(r.org, { org: r.org, rows: [], usd: 0, flags: 0 });
      const g = m.get(r.org);
      g.rows.push(r);
      g.usd += r.totusd || 0;
      g.flags += r.flags.length;
    });
    return [...m.values()];
  }, [rows]);
  const strip = [...groups].sort((a, b) => b.usd - a.usd);
  const top = strip.slice(0, 4);
  const restUsd = strip.slice(4).reduce((a, g) => a + g.usd, 0);
  const flagCount = (sev) => rows.filter((r) => r.flags.some((f) => FLAGS[f].severity === sev)).length;
  const match = (r) => quality === "all" || r.flags.some((f) => FLAGS[f].severity === quality);
  const toggle = (org) => setOpen((s) => { const n = new Set(s); n.has(org) ? n.delete(org) : n.add(org); return n; });
  const allOpen = open.size === groups.length;
  const scoped = role === "organ";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Бюджет сўрови 2027" sub="«форма бюджет сўрови 16.09.2026» асосида · сўм кўрсаткичлари жорий курс бўйича">
        <Button variant="outline" onClick={() => exportBudget(rows, rate)}>
          <Download aria-hidden /> Excel
        </Button>
      </PageHeader>

      <section className="rounded-xl border bg-card p-5">
        <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-3">
          <Figure label="Жами сўров" value={mlnUsd(totalUsd)} sub={mlrdSum(totalUzs)} />
          {!scoped && (
            <>
              <Figure
                label="Потолокка нисбатан"
                value={`${fmt2((totalUzs - CEILING_2027) / 1e9).replace("-", "−")} млрд`}
                sub={`Фискал стратегия: ${fmt2(CEILING_2027 / 1e9)} млрд сўм`}
                tone={totalUzs > CEILING_2027 ? "unpaid" : "paid"}
              />
              <Figure label="2026 йил бюджетига нисбатан" value={`${fmt2((totalUzs - BUDGET_2026) / 1e9).replace("-", "−")} млрд`} sub={`2026: ${fmt2(BUDGET_2026 / 1e9)} млрд сўм`} />
            </>
          )}
        </div>

        {!scoped && (
          <div className="mt-6">
            <div className="mb-2 text-sm text-muted-foreground">Сўров кимларга тўпланган</div>
            <div className="flex h-12 w-full overflow-hidden rounded-lg" role="img" aria-label={`${top[0]?.org}: ${fmt1((top[0]?.usd / totalUsd) * 100)} %`}>
              {top.map((g, i) => (
                <div
                  key={g.org}
                  className={cn("h-full transition-[flex-grow] duration-500", i === 0 ? "bg-primary" : "bg-share")}
                  style={{ flexGrow: g.usd, opacity: i === 0 ? 1 : 1 - i * 0.2 }}
                  title={`${g.org}: ${mlnUsd(g.usd)}`}
                />
              ))}
              <div className="h-full bg-muted" style={{ flexGrow: restUsd }} title={`Бошқалар: ${mlnUsd(restUsd)}`} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {top.map((g, i) => (
                <li key={g.org} className="flex items-baseline gap-2">
                  <span className={cn("size-2.5 rounded-sm", i === 0 ? "bg-primary" : "bg-share")} style={{ opacity: i === 0 ? 1 : 1 - i * 0.2 }} aria-hidden />
                  <span className={cn(i === 0 && "font-semibold")}>{g.org}</span>
                  <span className="tabular-nums text-muted-foreground">{fmt1((g.usd / totalUsd) * 100)} %</span>
                </li>
              ))}
              <li className="flex items-baseline gap-2">
                <span className="size-2.5 rounded-sm bg-muted" aria-hidden />
                <span>Бошқа {strip.length - 4} та орган</span>
                <span className="tabular-nums text-muted-foreground">{fmt1((restUsd / totalUsd) * 100)} %</span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Евроосиё тараққиёт банки битта сатри ({mlnUsd(rows.find((r) => r.io.includes("ЕАБР"))?.totusd || 0)}) жами сўровнинг{" "}
              {fmt1(((rows.find((r) => r.io.includes("ЕАБР"))?.totusd || 0) / totalUsd) * 100)} % ини ташкил этади.
            </p>
          </div>
        )}
      </section>

      {!scoped && (
        <div className="grid gap-6 @5xl:grid-cols-[1fr_1fr]">
          <Panel title="Ҳуқуқий асос бўйича («2. свод бюджет»)" bodyClassName="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Харажат</TableHead>
                  <TableHead>Асос</TableHead>
                  <TableHead className="pr-5 text-right">2027, млрд сўм</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SVOD.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="whitespace-normal pl-5">{s.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.noBasis ? <FlagChip flag="noBasis" /> : s.basis}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">{fmt2(s.y2027 / 1000)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Panel title="Маълумотлар сифати">
            <ul className="flex flex-col gap-3">
              <Check tone="error" text={`ЖАМИ сатри (${mlnUsd(FILE_TOTAL_USD)}) сатрлар йиғиндисидан ${fmt(FILE_TOTAL_USD - rows.reduce((a, r) => a + (r.totusd || 0), 0))} $ га фарқ қилади`} />
              <Check tone="error" text="Уч хил курс: «Расчёт 2027» 12 100, 1-илова 12 300, «2. свод бюджет» 12 700 сўм" />
              <Check tone="warn" text="«Расчёт 2027»да потолок устуни бўш: «Фарқ» устуни ҳар сатрда −жами" />
              <Check tone="warn" text="«Бошқа харажатлар» фоизда эмас, сатр бошига 50, 100 ёки 150 $ қатъий" />
              <Check tone="warn" text="Туризм қўмитаси сўровда, лекин 2-иловада бюджетдан ташқари бўлимда" />
            </ul>
          </Panel>
        </div>
      )}

      <Panel
        title="Тўловчилар кесимида"
        bodyClassName="px-0 pb-2"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup type="single" variant="outline" size="sm" value={quality} onValueChange={(v) => v && setQuality(v)}>
              <ToggleGroupItem value="all">Барчаси</ToggleGroupItem>
              <ToggleGroupItem value="error">Хатолар · {flagCount("error")}</ToggleGroupItem>
              <ToggleGroupItem value="warn">Огоҳлантиришлар · {flagCount("warn")}</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.org)))}>
              {allOpen ? "Ҳаммасини йиғиш" : "Ҳаммасини очиш"}
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Масъул орган / халқаро ташкилот</TableHead>
              <TableHead className="text-right">Прогноз 2027</TableHead>
              <TableHead className="text-right">Ташкилот сўрови</TableHead>
              <TableHead className="text-right">Фарқ</TableHead>
              <TableHead className="text-right">Жами, $</TableHead>
              <TableHead className="text-right">Жами, млн сўм</TableHead>
              <TableHead className="pr-5">Текширув</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => {
              const items = g.rows.filter(match);
              if (!items.length) return null;
              const isOpen = open.has(g.org) || quality !== "all";
              return (
                <Fragment key={g.org}>
                  <TableRow className="bg-muted/40 hover:bg-muted/60">
                    <TableCell className="pl-5 whitespace-normal" colSpan={4}>
                      <button type="button" className="flex items-center gap-2 text-left font-semibold" aria-expanded={isOpen} onClick={() => toggle(g.org)}>
                        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                        {g.org}
                        <span className="font-normal text-muted-foreground">· {g.rows.length}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(g.usd)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt1(g.rows.reduce((a, r) => a + toSum(r.totusd || 0, rate), 0) / 1e6)}</TableCell>
                    <TableCell className="pr-5 text-sm text-muted-foreground">{g.flags ? `${g.flags} та белги` : ""}</TableCell>
                  </TableRow>
                  {isOpen &&
                    items.map((r) => {
                      const f = r.approved ? forecastFrom(r, r) : r.pr27 ?? forecast2027(r);
                      const d = r.req != null && f ? ((r.req - f) / f) * 100 : null;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-[28rem] whitespace-normal pl-11">
                            {r.io}
                            {r.approved && <span className="ml-2 text-sm text-paid">· келишилган</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{f ? `${fmt(f)} ${cur(r.cur)}` : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{r.req != null ? `${fmt(r.req)} ${cur(r.cur)}` : "—"}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", d > 30 && "font-medium text-sent-ink")}>{d == null ? "—" : `${d > 0 ? "+" : ""}${fmt1(d)} %`}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.totusd ? fmt(r.totusd) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.totusd ? fmt1(toSum(r.totusd, rate) / 1e6) : "—"}</TableCell>
                          <TableCell className="pr-5">
                            <div className="flex flex-wrap gap-1.5">
                              {r.flags.map((fl) => (
                                <FlagChip key={fl} flag={fl} />
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function Check({ tone, text }) {
  return (
    <li className="flex items-start gap-3">
      <OctagonAlert className={cn("mt-0.5 size-4 shrink-0", tone === "error" ? "text-unpaid" : "text-sent-ink")} aria-hidden />
      <span>{text}</span>
    </li>
  );
}
