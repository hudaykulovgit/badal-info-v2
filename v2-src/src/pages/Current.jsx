import { useState } from "react";
import { Check, FileText, Landmark, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useStore } from "../store";
import { EXEC, cur, fmt } from "../model";
import { PageHeader, Status } from "../ui";
import { DocsDialog } from "./Docs";

export const DEBTS_TITLE = "Тўланган қарздорлик ва ҳақдорлик маълумотларини юклаш";
export const PAY_TITLE = "Жорий йил учун инвойс, тўланган мажбуриятларни тасдиқловчи маълумотларни юклаш";
const now = () => new Date().toLocaleString("ru-RU").slice(0, 17);

// «Жорий йил маълумотлари»: two sub-items (555.docx, 2-банд).
export default function Current({ tab }) {
  return tab === "debts" ? <Debts /> : <Payments />;
}

function Pdf({ name, onFile, label = "PDF" }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <label className={cn("cursor-pointer whitespace-nowrap", name && "text-paid")}>
        {name ? <Check aria-hidden /> : <Upload aria-hidden />} {name ? "Юкланди" : label}
        <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)} />
      </label>
    </Button>
  );
}

function Debts() {
  const { rows, role, debts, setDebts } = useStore();
  const organ = role === "organ";
  const set = (id, patch) => setDebts((s) => ({ ...s, [id]: { ...s[id], confirmed: false, ...patch } }));
  const pending = rows.filter((r) => debts[r.id]?.manual && debts[r.id]?.file && !debts[r.id]?.confirmed).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={DEBTS_TITLE} sub={organ ? "Дастур қарздорлик ва ҳақдорликни тўланган суммага қараб ўзи жамлаб боради" : `Келишув кутаётган ҳужжатлар: ${pending}`} />
      <p className="max-w-3xl text-muted-foreground">
        Жамланма = бошланғич қолдиқ + жорий йил инвойси − тўланган сумма (SWIFT). Рақамингиз бошқача бўлса, «Ўзим киритаман»ни белгиланг, суммани ва ҳужжатни юкланг: Администратор келишгач, шу рақам «Молиялаштириш таҳлили»да кўринади.
      </p>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Халқаро ташкилот</TableHead>
              <TableHead className="text-right">Инвойс 2026</TableHead>
              <TableHead className="text-right">Тўланган (SWIFT)</TableHead>
              <TableHead className="text-right">Қарздорлик, жамланма</TableHead>
              <TableHead className="text-right">Ҳақдорлик, жамланма</TableHead>
              <TableHead>Ўзим киритаман</TableHead>
              <TableHead className="pr-5 text-right">Ҳужжат / ҳолат</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const d = debts[r.id] || {};
              const own = !!d.manual;
              const c = cur(r.cur);
              return (
                <TableRow key={r.id}>
                  <TableCell className="max-w-80 whitespace-normal pl-5">
                    {(i === 0 || rows[i - 1].org !== r.org) && role === "admin" && <div className="text-sm text-muted-foreground">{r.org}</div>}
                    {r.io}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{r.inv26 != null ? `${fmt(r.inv26)} ${c}` : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{r.swift ? `${fmt(r.swift)} ${c}` : "—"}</TableCell>
                  <TableCell className="w-40 text-right">
                    {organ && own && !d.confirmed ? (
                      <Input inputMode="decimal" className="text-right tabular-nums" value={d.debt ?? ""} placeholder={fmt(r.debtBal)} onChange={(e) => set(r.id, { debt: e.target.value })} aria-label="Қарздорлик" />
                    ) : (
                      <span className={cn("tabular-nums", r.debtBal > 0 && "font-medium text-unpaid")}>{fmt(r.debtBal)}</span>
                    )}
                  </TableCell>
                  <TableCell className="w-40 text-right">
                    {organ && own && !d.confirmed ? (
                      <Input inputMode="decimal" className="text-right tabular-nums" value={d.credit ?? ""} placeholder={fmt(r.creditBal)} onChange={(e) => set(r.id, { credit: e.target.value })} aria-label="Ҳақдорлик" />
                    ) : (
                      <span className={cn("tabular-nums", r.creditBal > 0 && "font-medium text-paid")}>{fmt(r.creditBal)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={own} disabled={!organ || d.confirmed} onCheckedChange={(v) => set(r.id, { manual: !!v })} aria-label="Ўзим киритаман" />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {!own ? (
                      <span className="text-sm text-muted-foreground">дастур ҳисоблади</span>
                    ) : d.confirmed ? (
                      <span className="text-sm font-medium text-paid">келишилган</span>
                    ) : organ ? (
                      <Pdf name={d.file} onFile={(n) => set(r.id, { file: n })} label="Тасдиқловчи PDF" />
                    ) : d.file ? (
                      <Button size="sm" onClick={() => { set(r.id, { confirmed: true }); toast.success("Келишилди"); }}>
                        <Check aria-hidden /> Келишиш
                      </Button>
                    ) : (
                      <span className="text-sm text-sent-ink">ҳужжат кутилмоқда</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Payments() {
  const { rows, role, payments, setPayments, docs, setDocs } = useStore();
  const organ = role === "organ";
  const [docsFor, setDocsFor] = useState(null);
  const setPay = (id, patch) => setPayments((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const upInvoice = (r, name) => {
    setDocs((s) => ({ ...s, [r.id]: { ...s[r.id], invoice: { name } } }));
    setPay(r.id, { treasury: now() });
    toast.success("Инвойс юкланди", { description: "УзАСБОга интеграция: PDF талабнома билан бирга ғазначиликка автоматик юборилди." });
  };
  const waiting = rows.filter((r) => docs[r.id]?.sent && r.status !== "paid").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={PAY_TITLE} sub={organ ? "Инвойс суммаси ва PDF, тўловни тасдиқловчи ҳужжатлар: Администраторга кўриб чиқиш ва тасдиқлашга" : `Кўриб чиқиш кутилмоқда: ${waiting}`} />
      <div className="flex max-w-3xl items-start gap-3 rounded-xl border bg-card p-4 text-muted-foreground">
        <Landmark className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden />
        <p>Инвойс PDF УзАСБО орқали талабнома билан бирга ғазначиликка ўзи кетади: ташкилот инвойсни ғазначиликка олиб бормайди. Фақат Администратор қабул қилган ҳужжатлар ҳисобот шаклига тушади.</p>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Халқаро ташкилот</TableHead>
              <TableHead className="text-right">Инвойс суммаси</TableHead>
              <TableHead>Инвойс PDF</TableHead>
              <TableHead className="text-right">Тўланган (SWIFT)</TableHead>
              <TableHead>Мақом</TableHead>
              <TableHead>Ҳисоботда</TableHead>
              <TableHead className="pr-5 text-right">Тасдиқловчи ҳужжатлар</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const p = payments[r.id] || {};
              const inv = docs[r.id]?.invoice?.name;
              const c = cur(r.cur);
              return (
                <TableRow key={r.id}>
                  <TableCell className="max-w-80 whitespace-normal pl-5">
                    {(i === 0 || rows[i - 1].org !== r.org) && role === "admin" && <div className="text-sm text-muted-foreground">{r.org}</div>}
                    {r.io}
                  </TableCell>
                  <TableCell className="w-44 text-right">
                    {organ && r.status !== "paid" ? (
                      <Input inputMode="decimal" className="text-right tabular-nums" value={p.amount ?? (r.inv26 ?? "")} onChange={(e) => setPay(r.id, { amount: e.target.value })} aria-label="Инвойс суммаси" />
                    ) : (
                      <span className="whitespace-nowrap tabular-nums">{p.amount || (r.inv26 != null ? fmt(r.inv26) : "—")} {c}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {organ && r.status !== "paid" ? <Pdf name={inv} onFile={(n) => upInvoice(r, n)} /> : <span className="text-sm text-muted-foreground">{inv || "—"}</span>}
                    {inv && <div className="mt-1 text-sm text-signal">УзАСБО → ғазначилик</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{r.swift ? `${fmt(r.swift)} ${c}` : "—"}</TableCell>
                  <TableCell>
                    <Status status={r.status} />
                  </TableCell>
                  <TableCell className={cn("whitespace-nowrap text-sm", r.status === "paid" ? "font-medium text-paid" : "text-muted-foreground")}>{r.status === "paid" ? EXEC.paid : docs[r.id]?.sent ? "кўриб чиқилмоқда" : "—"}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button variant="outline" size="sm" onClick={() => setDocsFor(r)}>
                      <FileText aria-hidden /> Танишиш / таҳрирлаш
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DocsDialog row={docsFor} onClose={() => setDocsFor(null)} />
    </div>
  );
}
