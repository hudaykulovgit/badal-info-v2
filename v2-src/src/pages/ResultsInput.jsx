import { useState } from "react";
import { Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "../store";
import { ORGS } from "../model";
import { PageHeader, Panel, Pick } from "../ui";
import { ResultsTable } from "./Results";

const PERIODS = ["I чорак", "II чорак", "III чорак", "IV чорак", "Йиллик"];

// «Натижадорлик маълумотлари»: Мақсадли кўрсаткичлар + Ҳисобот.
export default function ResultsInput({ tab }) {
  return tab === "targets" ? <Targets /> : <Report />;
}

function Targets() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Мақсадли кўрсаткичлар" sub="Ҳар бир халқаро ташкилот бўйича: мақсад, жалб қилинган грантлар, олинган фойда" />
      <ResultsTable editable />
    </div>
  );
}

function Report() {
  const { role, session, reports, setReports } = useStore();
  const [period, setPeriod] = useState("Йиллик");
  const [text, setText] = useState("");
  const [file, setFile] = useState("");
  const mine = session.org && reports[session.org];

  if (role === "admin") {
    const got = ORGS.filter((o) => reports[o.org]);
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Натижадорлик ҳисоботи" sub={`Ҳисобот юборган органлар: ${got.length} / ${ORGS.length}`} />
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Масъул орган</TableHead>
                <TableHead>Давр</TableHead>
                <TableHead>Файл</TableHead>
                <TableHead className="pr-5 text-right">Юборилган</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORGS.map((o) => {
                const r = reports[o.org];
                return (
                  <TableRow key={o.org}>
                    <TableCell className="max-w-md whitespace-normal pl-5">{o.org}</TableCell>
                    <TableCell>{r?.period || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r?.file || "—"}</TableCell>
                    <TableCell className="pr-5 text-right">{r ? <span className="text-paid">{r.at}</span> : <span className="text-muted-foreground">кутилмоқда</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Натижадорлик ҳисоботи" sub="Аъзоликнинг мақсадга мувофиқлиги, иқтисодий ва бошқа фойдалар, жалб қилинган грантлар" />
      {mine && (
        <div className="rounded-xl border border-paid/30 bg-paid/8 p-4">
          Охирги ҳисобот: {mine.period}, {mine.at}. Янгисини юборсангиз, у алмаштирилади.
        </div>
      )}
      <Panel>
        <div className="flex flex-col gap-5">
          <Pick label="Ҳисобот даври" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p, label: p }))} className="max-w-56" />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Қисқача мазмун</span>
            <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Амалга оширилган ишлар, натижалар, олинган фойда" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload aria-hidden /> {file || "Ҳисобот PDF"}
                <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0].name)} />
              </label>
            </Button>
            <Button
              disabled={!text.trim() || !file}
              onClick={() => {
                setReports((s) => ({ ...s, [session.org]: { period, text, file, at: new Date().toLocaleString("ru-RU") } }));
                setText("");
                setFile("");
                toast.success("Ҳисобот юборилди", { description: "Администратор ва кузатувчилар «Натижадорлик» бўлимида кўради." });
              }}
            >
              <Send aria-hidden /> Юбориш
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
