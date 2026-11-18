/*
  BADAL Infodoska v2 — badalinfo.imv.uz prototype, rebuilt from «Таклиф 2026 учун», 1-илова, 2-илова, Книга1
  and the real «форма бюджет сўрови 16.09.2026» data (112 lines, 43 payers).
  Audience: IMV Халқаро муносабатлар департаменти (admin), масъул давлат органлари, кузатувчилар.
  Job: see who owes what on membership fees in 2026 and assemble the 2027 budget request.
  Mode: Operate. World = IMV brand (navy #00244E shell, ministry blue, Jost + Inter), openbudget.uz restraint.
  Signature: the 2027 request concentration strip — one navy block (ЕОТБ, ~82 %) against everything else.
  Copy: Uzbek Cyrillic, same script as the source forms. Login is a role picker: no credentials are collected.
  v3: menu and logic rebuilt 1:1 from «Таклиф 2026» §2.2: Маълумотлар базаси (3), Киритиладиган маълумотлар (4, with sub-items),
  Ваколат берилган ходимлар рўйхати, Қўлланма; §4 chat; §3 4-гуруҳ харажатлари suspension + 3-day warning.
*/
import { useState } from "react";
import { BarChart3, BookOpen, CalendarCheck, ClipboardList, Landmark, ListOrdered, LogOut, MessageSquare, Send, ShieldAlert, Target, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLES, StoreProvider, useStore } from "./store";
import { Pick } from "./ui";
import Financing from "./pages/Financing";
import Budget from "./pages/Budget";
import Results from "./pages/Results";
import Submit from "./pages/Submit";
import Registry from "./pages/Registry";
import Current from "./pages/Current";
import ResultsInput from "./pages/ResultsInput";
import Staff from "./pages/Staff";
import Guide from "./pages/Guide";
import Chat from "./Chat";
import Login from "./Login";

const ALL = ["observer", "admin", "organ"];
const WORK = ["admin", "organ"];

// Menu exactly as «Таклиф 2026» §2.2 lists it. Sub-items are the pages; a parent with children is a label.
export const NAV = [
  { group: "Маълумотлар базаси", items: [
    { id: "financing", label: "Молиялаштириш таҳлили", icon: BarChart3, roles: ALL },
    { id: "budget", label: "Бюджет сўрови", icon: Landmark, roles: ALL },
    { id: "results", label: "Натижадорлик", icon: Target, roles: ALL, disabled: true },
  ] },
  { group: "Киритиладиган маълумотлар", items: [
    { id: "registry", label: "Рўйхат", icon: ListOrdered, roles: WORK },
    { label: "Жорий йил маълумотлари", icon: CalendarCheck, roles: WORK, children: [
      { id: "debts", label: "Тўланган қарздорлик ва ҳақдорлик маълумотларини юклаш" },
      { id: "payments", label: "Жорий йил учун инвойс, тўланган мажбуриятларни тасдиқловчи маълумотларни юклаш" },
    ] },
    { id: "submit", label: "Кейинги йил учун бюджет сўровини юбориш", adminLabel: "Кейинги йил учун бюджет сўровини юбориш модули", icon: Send, roles: WORK },
    { label: "Натижадорлик маълумотлари", icon: ClipboardList, roles: WORK, disabled: true, children: [
      { id: "targets", label: "Мақсадли кўрсаткичлар", disabled: true },
      { id: "rreport", label: "Ҳисобот", disabled: true },
    ] },
  ] },
  { group: null, items: [
    { id: "staff", label: "Ваколат берилган ходимлар рўйхати", icon: Users, roles: WORK },
    { id: "guide", label: "Қўлланма", icon: BookOpen, roles: ALL },
  ] },
];

const PAGES = {
  financing: Financing, budget: Budget, results: Results, registry: Registry,
  debts: () => <Current tab="debts" />, payments: () => <Current tab="payments" />,
  submit: Submit, targets: () => <ResultsInput tab="targets" />, rreport: () => <ResultsInput tab="report" />,
  staff: Staff, guide: Guide,
};

const label = (it, role) => (role === "admin" && it.adminLabel ? it.adminLabel : it.label);
const flat = (groups, role) =>
  groups.flatMap((g) => g.items.flatMap((i) => (i.children ? i.children.map((c) => ({ value: c.id, label: `${i.label}: ${c.label}`, disabled: c.disabled })) : [{ value: i.id, label: label(i, role), disabled: i.disabled }])));

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider delayDuration={200}>
        <Root />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </StoreProvider>
  );
}

function Root() {
  const { session } = useStore();
  return <div className="@container min-h-screen bg-background text-foreground">{session ? <Shell /> : <Login />}</div>;
}

function NavButton({ active, onClick, icon: Icon, children, sub, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? "Вақтинча фаол эмас" : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg text-left transition-colors",
        sub ? "py-2 pl-10 pr-3" : "px-3 py-2.5",
        disabled ? "cursor-not-allowed text-shell-mute opacity-50" : active ? "bg-shell-ink/12 font-medium text-shell-ink" : "text-shell-mute hover:bg-shell-ink/6 hover:text-shell-ink",
      )}
    >
      {Icon && <Icon className={cn("size-4.5 shrink-0", active && "text-share")} aria-hidden />}
      {children}
    </button>
  );
}

function Shell() {
  const { session, setSession, page, setPage, role, suspended, messages } = useStore();
  const [chat, setChat] = useState(false);
  const Page = PAGES[page] || Financing;
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length);
  const unread = messages.filter((m) => (role === "organ" ? m.org === session.org && m.from === "admin" : role === "admin" ? m.from === "organ" : false)).length;
  const blocked = role === "organ" && suspended[session.org];
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-7 overflow-y-auto bg-shell px-4 py-6 text-shell-ink @4xl:flex">
        <div className="px-2">
          <div className="font-display text-2xl font-semibold tracking-tight">BADAL</div>
          <div className="text-sm text-shell-mute">badalinfo.imv.uz</div>
        </div>
        <nav className="flex flex-col gap-6" aria-label="Асосий меню">
          {groups.map((g, gi) => (
            <div key={g.group || gi} className={cn("flex flex-col gap-0.5", !g.group && "border-t border-shell-ink/15 pt-5")}>
              {g.group && <div className="px-3 pb-1.5 text-sm font-medium text-shell-mute">{g.group}</div>}
              {g.items.map((it) =>
                it.children ? (
                  <div key={it.label} className="flex flex-col gap-0.5">
                    <div className={cn("flex items-center gap-3 px-3 pb-0.5 pt-2.5 text-shell-ink", it.disabled && "opacity-50")}>
                      <it.icon className="size-4.5 shrink-0" aria-hidden />
                      {it.label}
                    </div>
                    {it.children.map((c) => (
                      <NavButton key={c.id} sub active={page === c.id} onClick={() => setPage(c.id)} disabled={c.disabled}>
                        {c.label}
                      </NavButton>
                    ))}
                  </div>
                ) : (
                  <NavButton key={it.id} icon={it.icon} active={page === it.id} onClick={() => setPage(it.id)} disabled={it.disabled}>
                    {label(it, role)}
                  </NavButton>
                ),
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto px-2 text-sm leading-relaxed text-shell-mute">Прототип. Маълумот: «форма бюджет сўрови 16.09.2026». Ҳақиқий тизимга уланмаган.</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-6 py-3 @3xl:px-10">
          <div className="flex min-w-0 items-center gap-3 @4xl:hidden">
            <span className="font-display text-lg font-semibold">BADAL</span>
            <Pick label="" value={page} onChange={setPage} options={flat(groups, role)} className="min-w-56" />
          </div>
          <div className="hidden text-sm text-muted-foreground @4xl:block">Иқтисодиёт ва молия вазирлиги</div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setChat(true)} aria-label="Хабарлар">
              <MessageSquare aria-hidden /> Хабарлар
              {unread > 0 && <span className="rounded-full bg-signal px-1.5 text-sm leading-5 text-white tabular-nums">{unread}</span>}
            </Button>
            <div className="text-right text-sm">
              <div className="font-medium">{ROLES[role].label}</div>
              {session.org && <div className="max-w-64 truncate text-muted-foreground">{session.org}</div>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSession(null)}>
              <LogOut aria-hidden /> Чиқиш
            </Button>
          </div>
        </header>
        {blocked && (
          <div className="flex items-start gap-3 border-b border-unpaid/30 bg-unpaid/8 px-6 py-3 text-unpaid @3xl:px-10" role="alert">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              4-гуруҳ харажатлари вақтинча тўхтатилган: ПҚ-4756 талаблари бажарилмаган. Маълумотлар киритилгач, Администратор қайта очади.
            </span>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8 @3xl:px-10">
          <Page />
        </main>
      </div>
      <Chat open={chat} onOpenChange={setChat} />
    </div>
  );
}
