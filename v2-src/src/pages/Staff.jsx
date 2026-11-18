import { KeyRound } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EXPIRING_DAYS, fmtDate, keyState, useStore } from "../store";
import { PageHeader } from "../ui";

const KEY = {
  active: { label: "Амалда", cls: "text-paid" },
  expiring: { label: "Муддати тугаяпти", cls: "text-sent-ink" },
  blocked: { label: "Блокланган", cls: "text-unpaid" },
};

const left = ({ state, days }) =>
  state === "blocked" ? `${Math.abs(days)} кун олдин тугаган` : days === 0 ? "бугун тугайди" : `${days} кун қолди`;

export default function Staff() {
  const { role, session, staff } = useStore();
  const list = (role === "organ" ? staff.filter((s) => s.org === session.org) : staff).map((s) => ({ ...s, k: keyState(s) }));
  const blocked = list.filter((s) => s.k.state === "blocked").length;
  const expiring = list.filter((s) => s.k.state === "expiring").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ваколат берилган ходимлар рўйхати" sub="Масъул давлат органи номидан бош бухгалтер УзАСБО калити орқали ишлайди" />
      <div className="flex max-w-3xl items-start gap-3 rounded-xl border bg-card p-4 text-muted-foreground">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-signal" aria-hidden />
        <p>
          JShShIR киритиш шарт эмас. Бош бухгалтер алмашса, УзАСБОдаги калит билан бирга масъул ходим ҳам автоматик янгиланади. Калит муддати тугаган куни
          тизим ходимни автоматик блоклайди; УзАСБОда калит янгилангач, кириш ўзи тикланади.
        </p>
      </div>
      {role === "admin" && (blocked > 0 || expiring > 0) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className={cn("font-medium tabular-nums", KEY.blocked.cls)}>Блокланган: {blocked}</span>
          <span className={cn("font-medium tabular-nums", KEY.expiring.cls)}>{EXPIRING_DAYS} кун ичида тугайди: {expiring}</span>
        </div>
      )}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Масъул давлат органи</TableHead>
              <TableHead>Ф.И.Ш.</TableHead>
              <TableHead>Лавозими</TableHead>
              <TableHead>Телефон (УзАСБО)</TableHead>
              <TableHead>Кириш</TableHead>
              <TableHead>Калит амал қилиш муддати</TableHead>
              <TableHead>Калит</TableHead>
              <TableHead className="pr-5">Охирги кириш</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => (
              <TableRow key={s.org} data-key-state={s.k.state}>
                <TableCell className="max-w-md whitespace-normal pl-5">{s.org}</TableCell>
                <TableCell className="whitespace-nowrap font-medium">{s.name}</TableCell>
                <TableCell className="whitespace-nowrap">{s.post}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {s.phone ? (
                    <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`} className="text-signal hover:underline">{s.phone}</a>
                  ) : (
                    <span className="text-muted-foreground">УзАСБОда йўқ</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">УзАСБО калити</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="block font-medium tabular-nums">{fmtDate(s.expires)} гача</span>
                  <span className={cn("block text-sm tabular-nums", s.k.state === "active" ? "text-muted-foreground" : KEY[s.k.state].cls)}>{left(s.k)}</span>
                </TableCell>
                <TableCell className={cn("whitespace-nowrap font-medium", KEY[s.k.state].cls)}>{KEY[s.k.state].label}</TableCell>
                <TableCell className="whitespace-nowrap pr-5 tabular-nums text-muted-foreground">{s.last || "кирмаган"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
