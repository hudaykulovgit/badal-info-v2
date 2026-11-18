import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "../store";
import { fmt } from "../model";
import { PageHeader } from "../ui";

export default function Results() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Натижадорлик" sub="Аъзоликдан олинган натижалар, мақсадли кўрсаткичлар ва жалб қилинган грантлар" />
      <ResultsTable />
    </div>
  );
}

// Read-only in «Маълумотлар базаси»; editable for the ministry in «Натижадорлик маълумотлари».
export function ResultsTable({ editable = false }) {
  const { rows, results, setResults, role, reports } = useStore();
  const canEdit = editable && role === "organ";
  const [edit, setEdit] = useState(null);
  const done = rows.filter((r) => results[r.id]).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-5">
        <div>
          <div className="font-display text-3xl font-semibold tabular-nums">
            {done} <span className="text-muted-foreground">/ {rows.length}</span>
          </div>
          <div className="text-sm text-muted-foreground">ташкилот бўйича натижадорлик киритилган</div>
        </div>
        <p className="max-w-xl text-muted-foreground">
          Янги модуль: аъзоликнинг мақсадга мувофиқлиги, иқтисодий ва бошқа фойдалар шу ерда йиғилади.{" "}
          {canEdit ? "Ўз ташкилотларингиз бўйича «Киритиш» тугмасини босинг." : "Маълумотни масъул давлат органлари «Натижадорлик маълумотлари» бўлимида киритади."}{" "}
          Юборилган ҳисоботлар: {Object.keys(reports).length}.
        </p>
      </section>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Халқаро ташкилот</TableHead>
              <TableHead>Мақсадли кўрсаткич</TableHead>
              <TableHead className="text-right">Грантлар, $</TableHead>
              <TableHead className="pr-5 text-right">{canEdit ? "" : "Ҳолат"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const x = results[r.id];
              return (
                <TableRow key={r.id}>
                  <TableCell className="max-w-96 whitespace-normal pl-5">
                    {(i === 0 || rows[i - 1].org !== r.org) && <div className="text-sm text-muted-foreground">{r.org}</div>}
                    {r.io}
                  </TableCell>
                  <TableCell className="max-w-96 whitespace-normal">{x?.target || <span className="text-muted-foreground">киритилмаган</span>}</TableCell>
                  <TableCell className="text-right tabular-nums">{x?.grants ? fmt(Number(x.grants)) : "—"}</TableCell>
                  <TableCell className="pr-5 text-right">
                    {canEdit ? (
                      <Button variant="ghost" size="sm" onClick={() => setEdit(r)}>
                        <Pencil aria-hidden /> {x ? "Таҳрирлаш" : "Киритиш"}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">{x ? "киритилган" : "кутилмоқда"}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {edit && (
        <Editor
          row={edit}
          initial={results[edit.id]}
          onClose={() => setEdit(null)}
          onSave={(v) => {
            setResults((s) => ({ ...s, [edit.id]: v }));
            setEdit(null);
            toast.success("Натижадорлик сақланди");
          }}
        />
      )}
    </div>
  );
}

function Editor({ row, initial, onClose, onSave }) {
  const [v, setV] = useState(initial || { target: "", grants: "", note: "" });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Натижадорлик</DialogTitle>
          <DialogDescription>{row.io}</DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 text-sm">
          Мақсадли кўрсаткич
          <Input value={v.target} onChange={(e) => setV({ ...v, target: e.target.value })} placeholder="масалан: 2 та қўшма лойиҳа" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Жалб қилинган грантлар, АҚШ доллари
          <Input type="number" inputMode="decimal" className="tabular-nums" value={v.grants} onChange={(e) => setV({ ...v, grants: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Амалга оширилган ишлар ва фойда
          <Textarea rows={4} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Бекор қилиш
          </Button>
          <Button disabled={!v.target.trim()} onClick={() => onSave(v)}>
            Сақлаш
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
