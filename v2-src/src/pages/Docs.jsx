import { useState } from "react";
import { Check, CornerUpLeft, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStore } from "../store";
import { cur, fmt } from "../model";
import { Status } from "../ui";

const DOCS = [
  { key: "invoice", label: "Инвойс" },
  { key: "payment", label: "Тўлов амалга оширилганлиги тўғрисида" },
  { key: "receipt", label: "Халқаро ташкилот тўловни қабул қилганлигини тасдиқловчи ҳужжат (хат)", required: true },
];

// The three states and what each one means in УзАСБО / ДМБАТ and in the report.
const CHAIN = [
  { s: "unpaid", t: "Тўланмаган", d: "SWIFT маълумоти йўқ" },
  { s: "sent", t: "Ўтказилган", d: "УзАСБО / ДМБАТда дебиторлик" },
  { s: "paid", t: "Тўланган", d: "дебиторлик ёпилди · ҳисоботда «Бажарилди»" },
];
const RANK = { unpaid: 0, sent: 1, paid: 2 };
const DOT = { unpaid: "bg-unpaid", sent: "bg-sent", paid: "bg-paid" };

export function DocsDialog({ row, onClose }) {
  const { role, docs, setDocs, rows, approvals, setApprovals, setMessages } = useStore();
  const [note, setNote] = useState("");
  if (!row) return null;
  const live = rows.find((r) => r.id === row.id) || row;
  const d = docs[row.id] || {};
  const agreed = !!approvals[row.id];
  const ready = !!d.receipt?.name && !!d.sent;
  const set = (key, patch) => setDocs((s) => ({ ...s, [row.id]: { ...s[row.id], [key]: { ...s[row.id]?.[key], ...patch } } }));
  const msg = (text) => setMessages((m) => [...m, { id: Date.now(), org: row.org, from: "admin", text, at: new Date().toLocaleString("ru-RU").slice(0, 17) }]);

  const agree = () => {
    setApprovals((s) => ({ ...s, [row.id]: { at: new Date().toLocaleString("ru-RU").slice(0, 17), by: "Администратор" } }));
    msg(`${row.io}: ҳужжатлар келишилди. Мақом «Тўланган», дебиторлик ёпилди.`);
    toast.success("Келишилди", { description: "Мақом «Тўланган». УзАСБО / ДМБАТда дебиторлик ёпилди, ҳисоботда «Бажарилди»." });
  };
  const back = () => {
    setDocs((s) => ({ ...s, [row.id]: { ...s[row.id], sent: undefined } }));
    msg(`${row.io}: ҳужжатлар қайтарилди. ${note.trim()}`);
    setNote("");
    toast("Қайтарилди", { description: "Масъул органга изоҳ юборилди." });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Асослантирувчи ҳужжатлар</DialogTitle>
          <DialogDescription>
            {row.org} · {row.io}
          </DialogDescription>
        </DialogHeader>

        <ol className="grid grid-cols-3 gap-2" aria-label="Мақом занжири">
          {CHAIN.map((c) => {
            const on = RANK[live.status] >= RANK[c.s];
            const now = live.status === c.s;
            return (
              <li key={c.s} className={cn("flex flex-col gap-1 border-t-4 pt-2", on ? (c.s === "paid" ? "border-paid" : c.s === "sent" ? "border-sent" : "border-unpaid") : "border-muted")}>
                <span className={cn("flex items-center gap-2 text-sm", now ? "font-medium" : "text-muted-foreground")}>
                  <span className={cn("size-2 rounded-full", on ? DOT[c.s] : "bg-muted")} aria-hidden />
                  {c.t}
                </span>
                <span className="text-sm text-muted-foreground">{c.d}</span>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span>
            Жорий мақом: <Status status={live.status} />
          </span>
          <span className="text-muted-foreground">
            SWIFT (УзАСБО / ДМБАТ): {live.swift ? `${fmt(live.swift)} ${cur(live.cur)}` : "йўқ"}
            {live.manual && " · тўлов топшириқномаси қўлда"}
          </span>
        </div>

        <ol className="flex flex-col divide-y rounded-lg border">
          {DOCS.map((doc, i) => {
            const f = d[doc.key];
            return (
              <li key={doc.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="w-5 text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {doc.label}
                    {doc.required && <span className="text-unpaid"> *</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{f?.name || "PDF юкланмаган"}</div>
                </div>
                {role === "organ" && !agreed && (
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload aria-hidden /> {f?.name ? "Алмаштириш" : "PDF юклаш"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            set(doc.key, { name: file.name });
                            toast.success("Ҳужжат юкланди", { description: "Администратор келишгач, мақом «Тўланган» бўлади." });
                          }
                        }}
                      />
                    </label>
                  </Button>
                )}
              </li>
            );
          })}
        </ol>

        {role === "organ" && !agreed && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {d.sent && <span className="mr-auto text-sm text-sent-ink">Юборилган: {d.sent}. Администратор кўриб чиқмоқда.</span>}
            <Button
              disabled={!d.receipt?.name}
              onClick={() => {
                setDocs((s) => ({ ...s, [row.id]: { ...s[row.id], sent: new Date().toLocaleString("ru-RU").slice(0, 17) } }));
                toast.success("Кўриб чиқишга юборилди", { description: "Администратор тасдиқласа, мажбурият «Тўланган» бўлади ва ҳисобот шаклига тушади." });
              }}
            >
              <Send aria-hidden /> {d.sent ? "Қайта юбориш" : "Кўриб чиқишга юбориш"}
            </Button>
          </div>
        )}

        {role === "admin" && !agreed && (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Қайтариш сабаби (қайтарилганда)" aria-label="Қайтариш сабаби" />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!ready && <span className="mr-auto text-sm text-unpaid">{d.sent ? "Халқаро ташкилотнинг тасдиқловчи ҳужжати юкланмаган" : "Масъул орган ҳали кўриб чиқишга юбормаган"}</span>}
              <Button variant="outline" disabled={!note.trim()} onClick={back}>
                <CornerUpLeft aria-hidden /> Қайтариш
              </Button>
              <Button disabled={!ready} onClick={agree}>
                <Check aria-hidden /> Келишиш
              </Button>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {agreed
            ? `Келишилган: ${approvals[row.id].at}. Дебиторлик ёпилган, ҳисоботда «Бажарилди».`
            : role === "observer"
              ? "Кузатувчи ҳужжатларни фақат кўради."
              : role === "admin"
                ? "SWIFT маълумоти мажбуриятни фақат «Ўтказилган» қилади. «Тўланган» мақоми ва дебиторлик ёпилиши фақат «Келишиш» орқали."
                : "Халқаро ташкилотнинг тасдиқловчи ҳужжатини юкланг: Администратор келишгач, мақом «Тўланган» бўлади."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
