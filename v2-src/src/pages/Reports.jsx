import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "../store";
import { fmt, fmt2 } from "../model";
import { PageHeader } from "../ui";
import { exportReport } from "../exporter";

const COLS = [
  { c: "USD", h: "АҚШ доллари" },
  { c: "EUR", h: "Евро" },
  { c: "CHF", h: "Швейцария франки" },
  { c: "RUB", h: "Россия рубли" },
  { c: "сўм", h: "Сўм, млн" },
  { c: "CAD", h: "Канада доллари" },
  { c: "ID (исл дин)", h: "Ислом динори" },
];
const PERIODS = ["Йиллик", "I чорак", "II чорак", "III чорак", "IV чорак"];

export default function Reports() {
  const { rows } = useStore();
  const [period, setPeriod] = useState("Йиллик");
  const quarter = period !== "Йиллик";
  const val = (r, c) => (quarter || r.cur !== c ? 0 : c === "сўм" ? (r.paid26 || 0) / 1e6 : r.paid26 || 0);
  const totals = COLS.map(({ c }) => rows.reduce((a, r) => a + val(r, c), 0));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ҳисобот" sub="2-илова · масъул органлар тўлаган аъзолик бадаллари тўғрисида МАЪЛУМОТ">
        <Button variant="outline" onClick={() => exportReport(rows, period, quarter)}>
          <Download aria-hidden /> Excel
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4">
        <ToggleGroup type="single" variant="outline" value={period} onValueChange={(v) => v && setPeriod(v)}>
          {PERIODS.map((p) => (
            <ToggleGroupItem key={p} value={p}>
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">
          {quarter ? "Бу чорак учун тўловлар 2-иловада ҳали киритилмаган: барча қийматлар 0." : "Йиллик: «Расчёт 2027» варағидаги 2026 йил тўланган суммалар."}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Тўловчи</TableHead>
              <TableHead>Халқаро ташкилот</TableHead>
              {COLS.map((x) => (
                <TableHead key={x.c} className="text-right whitespace-nowrap">
                  {x.h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-signal-soft hover:bg-signal-soft">
              <TableCell colSpan={2 + COLS.length} className="pl-5 font-semibold">
                I. Давлат бюджети ҳисобидан молиялаштириш
              </TableCell>
            </TableRow>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-56 whitespace-normal pl-5 align-top text-muted-foreground">{i === 0 || rows[i - 1].org !== r.org ? r.org : ""}</TableCell>
                <TableCell className="max-w-96 whitespace-normal">{r.io}</TableCell>
                {COLS.map(({ c }) => {
                  const v = val(r, c);
                  return (
                    <TableCell key={c} className={v ? "text-right tabular-nums" : "text-right tabular-nums text-muted-foreground/60"}>
                      {v ? (c === "сўм" ? fmt2(v) : fmt(v)) : "0"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2 + COLS.length} className="pl-5 text-muted-foreground">
                II. Бюджетдан ташқари жамғармалар ва ўз маблағлари ҳисобидан: манба файлда маълумот йўқ.
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="pl-5 font-semibold">
                Жами
              </TableCell>
              {totals.map((t, i) => (
                <TableCell key={COLS[i].c} className="text-right font-semibold tabular-nums">
                  {COLS[i].c === "сўм" ? fmt2(t) : fmt(t)}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
