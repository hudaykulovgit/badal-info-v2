/*
  Login v6: landing + sign-in, after the live badal.up.railway.app hero the user pointed at.
  Night-navy hero, centred Jost headline, one CTA; below it the REAL «Молиялаштириш таҳлили» page rendered
  read-only inside a product frame (proof, not a screenshot). Both CTAs open the sign-in dialog.
  Motion: hero words rise 50ms apart, the frame rises 24px over 700ms (marketing tier); sign-in keeps the
  Emil bar (segmented switch, blurred crossfade, 0.97 press). Reduced motion: fades only.
  RU/ЎЗ switches the landing copy only; the app itself stays in Uzbek Cyrillic.
  Safety: role picker only; no login, password or key is collected.
*/
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ROLES, fmtDate, keyState, useStore } from "./store";
import { ORGS } from "./model";
import { Pick } from "./ui";
import Financing from "./pages/Financing";

const EASE = [0.23, 1, 0.32, 1]; // theme --default-transition-timing-function
const SHORT = { admin: "Администратор", organ: "Масъул орган", observer: "Кузатувчи" };

function RoleSwitch({ value, onChange }) {
  const reduce = useReducedMotion();
  const viaKeys = useRef(false);
  const keys = Object.keys(ROLES);
  const move = (e) => {
    const i = keys.indexOf(value);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    viaKeys.current = true;
    const next = keys[(i + step + keys.length) % keys.length];
    onChange(next);
    e.currentTarget.parentElement.querySelector(`[data-role="${next}"]`)?.focus();
  };
  const pick = (k) => {
    viaKeys.current = false;
    onChange(k);
  };
  const instant = reduce || viaKeys.current;
  return (
    <div role="radiogroup" aria-label="Фойдаланувчи роли" className="grid grid-cols-1 gap-1 bg-muted p-1 @md:grid-cols-3">
      {keys.map((k) => {
        const on = value === k;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            data-role={k}
            aria-checked={on}
            aria-label={ROLES[k].label}
            tabIndex={on ? 0 : -1}
            onClick={() => pick(k)}
            onKeyDown={move}
            className={cn(
              "relative h-10 whitespace-nowrap px-2 text-sm font-medium transition-colors duration-150 [transition-timing-function:ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on && (
              <motion.span
                layoutId="role-indicator"
                aria-hidden
                className="absolute inset-0 bg-background shadow-[0_1px_2px_oklch(0.3_0.05_258/0.12),0_2px_8px_-2px_oklch(0.3_0.05_258/0.12)]"
                transition={instant ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0 }}
              />
            )}
            <span className="relative">{SHORT[k]}</span>
          </button>
        );
      })}
    </div>
  );
}


const COPY = {
  uz: {
    enter: "Кириш",
    title: "Халқаро аъзолик бадаллари бўйича мажбуриятлар платформаси",
    sub: "Раҳбарият ва кузатувчилар учун ягона таҳлилий панел: тўловлар, ҳисоботлар ва бюджет сўрови.",
    cta: "Тизимга кириш",
    signTitle: "Тизимга кириш",
    signSub: "Ролингизни танланг. Администратор IM ID, масъул орган УзАСБО калити, кузатувчи OneID орқали киради.",
    note: "Прототип: калит ва парол сўралмайди.",
    footer: "Иқтисодиёт ва молия вазирлиги · Халқаро муносабатлар департаменти",
    close: "Ёпиш",
  },
  ru: {
    enter: "Войти",
    title: "Платформа учёта обязательств по международным членским взносам",
    sub: "Единая аналитическая панель для руководства и наблюдателей министерства: платежи, отчёты и бюджетный запрос.",
    cta: "Войти в систему",
    signTitle: "Вход в систему",
    signSub: "Выберите роль. Администратор входит через IM ID, ответственный орган через ключ УзАСБО, наблюдатель через OneID.",
    note: "Прототип: ключ и пароль не запрашиваются. Интерфейс системы на узбекском.",
    footer: "Министерство экономики и финансов · Департамент международных отношений",
    close: "Закрыть",
  },
};

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="size-8">
      <circle cx="16" cy="16" r="16" fill="oklch(0.96 0.012 255)" />
      <path d="M8 19c4-1 7-4 9-9 1 4 3 7 7 8-5 2-11 3-16 1Z" fill="oklch(0.45 0.16 258)" />
      <path d="M10 22c4 1 9 0 13-3" stroke="oklch(0.72 0.17 145)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// The real analysis page, read-only, scaled to fit the frame.
function Preview() {
  const box = useRef(null);
  const [k, setK] = useState(0.68);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.max(e.contentRect.width / 1240, 0.5)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const items = ["Молиялаштириш таҳлили", "Бюджет сўрови", "Натижадорлик"];
  return (
    <div aria-hidden inert className="grid h-[520px] grid-cols-1 overflow-hidden border border-b-0 border-landing-ink/12 bg-background text-foreground @3xl:grid-cols-[208px_minmax(0,1fr)]">
      <div className="hidden flex-col gap-6 bg-shell p-5 text-sm @3xl:flex">
        <span className="font-display font-semibold tracking-[0.2em] text-shell-ink">BADAL</span>
        <div className="flex flex-col gap-1">
          <span className="px-3 pb-1 font-medium text-shell-ink">Маълумотлар базаси</span>
          {items.map((t, i) => (
            <span key={t} className={cn("px-3 py-2", i === 0 ? "bg-shell-ink/12 font-medium text-shell-ink" : "text-shell-mute")}>{t}</span>
          ))}
        </div>
        <span className="px-3 font-medium text-shell-ink">Киритиладиган маълумотлар</span>
      </div>
      <div ref={box} className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 w-[1240px] origin-top-left p-8" style={{ transform: `scale(${k})` }}>
          <Financing />
        </div>
      </div>
    </div>
  );
}

function SignIn({ t }) {
  const { setSession, setPage, staff } = useStore();
  const reduce = useReducedMotion();
  const [role, setRole] = useState("admin");
  const [org, setOrg] = useState(ORGS[0]?.org);
  const holder = role === "organ" ? staff.find((s) => s.org === org) : null;
  const key = holder ? keyState(holder) : null;
  const locked = key?.state === "blocked";
  const r = ROLES[role];
  const enter = () => {
    setSession({ role, org: role === "organ" ? org : null });
    setPage("financing");
  };
  const fadeIn = reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)", transform: "translateY(4px)" };
  const shown = reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" };
  const fadeOut = reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)", transform: "translateY(-4px)" };
  return (
    <section aria-label={t.signTitle} className="flex flex-col gap-5 text-foreground">
      <RoleSwitch value={role} onChange={setRole} />
      <div className="relative h-[72px] overflow-hidden" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={role}
            initial={fadeIn}
            animate={shown}
            exit={{ ...fadeOut, transition: { duration: 0.12, ease: EASE } }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex flex-col gap-1"
          >
            <span className="font-medium">{r.label}</span>
            <span className="text-sm text-muted-foreground">{r.who}</span>
            <span className="text-sm text-primary">{r.key} орқали</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {role === "organ" && (
          <motion.div
            key="organ"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: reduce ? 0 : 0.15, ease: EASE } }}
            transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            className="-mx-1 overflow-hidden px-1"
          >
            <div className="flex flex-col gap-3 pb-1">
              <Pick label="Масъул давлат органи" value={org} onChange={setOrg} options={ORGS.map((o) => ({ value: o.org, label: o.org }))} />
              {holder && (
                <div
                  role={locked ? "alert" : undefined}
                  className={cn("flex items-start gap-3 border p-3 text-sm", locked ? "border-unpaid/40 bg-unpaid/8 text-unpaid" : "border-foreground/10 text-muted-foreground")}
                >
                  {locked && <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                  <span>
                    {locked
                      ? `Калит муддати ${fmtDate(holder.expires)} да тугаган: кириш автоматик блокланган. УзАСБОда калитни янгиланг.`
                      : `Калит ${fmtDate(holder.expires)} гача амал қилади (${key.days} кун қолди).`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        size="lg"
        type="button"
        disabled={locked}
        onClick={enter}
        className="w-full transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] disabled:active:scale-100"
      >
        {r.key} орқали кириш
      </Button>
    </section>
  );
}

export default function Login() {
  const [lang, setLang] = useState("uz");
  const t = COPY[lang];
  const [signInOpen, setSignInOpen] = useState(false);
  const trigger = useRef(null);
  const toSignIn = (event) => {
    trigger.current = event.currentTarget;
    setSignInOpen(true);
  };

  return (
    <div className="min-h-screen bg-landing text-landing-ink selection:bg-landing-cta/30">
      <style>{`
        @keyframes land-rise { from { opacity: 0; transform: translateY(var(--rise, 8px)) } to { opacity: 1; transform: translateY(0) } }
        @keyframes land-fade { from { opacity: 0 } to { opacity: 1 } }
        .land-rise { animation: land-rise var(--dur, 400ms) cubic-bezier(0.23, 1, 0.32, 1) both }
        @media (prefers-reduced-motion: reduce) { .land-rise { animation: land-fade 200ms ease both } }
      `}</style>

      <div className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_60%_at_50%_100%,oklch(0.42_0.12_258/0.55),transparent)]" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 @3xl:px-12">
          <span className="flex items-center gap-3">
            <Mark />
            <span className="font-display text-xl font-semibold tracking-wide">BADAL</span>
          </span>
          <span className="flex items-center gap-3">
            <span role="group" aria-label="Тил / Язык" className="flex border border-landing-ink/15 p-1">
              {[["ru", "RU"], ["uz", "ЎЗ"]].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={lang === k}
                  onClick={() => setLang(k)}
                  className={cn(
                    "h-8 px-3 text-sm font-medium transition-colors duration-150 [transition-timing-function:ease] focus-visible:outline-2 focus-visible:outline-landing-cta",
                    lang === k ? "bg-landing-ink/12 text-landing-ink" : "text-landing-mute hover:text-landing-ink",
                  )}
                >
                  {l}
                </button>
              ))}
            </span>
            <Button type="button" onClick={toSignIn} className="bg-landing-cta font-semibold text-landing-cta-ink transition-[transform,background-color] duration-150 hover:bg-landing-cta/90 active:scale-[0.97]">
              {t.enter}
            </Button>
          </span>
        </header>

        <section className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-12 pt-12 text-center @3xl:pt-20">
          <h1 key={lang + "h"} className="land-rise max-w-[32ch] font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance @3xl:text-[3.5rem]" style={{ animationDelay: "0ms" }}>
            {t.title}
          </h1>
          <p key={lang + "p"} className="land-rise max-w-[60ch] text-lg text-landing-mute text-pretty" style={{ animationDelay: "60ms" }}>
            {t.sub}
          </p>
          <Button
            type="button"
            size="lg"
            onClick={toSignIn}
            className="land-rise mt-2 h-12 px-6 text-base font-semibold bg-landing-cta text-landing-cta-ink transition-[transform,background-color] duration-150 hover:bg-landing-cta/90 active:scale-[0.97]"
            style={{ animationDelay: "120ms" }}
          >
            {t.cta} <ArrowRight aria-hidden />
          </Button>
        </section>

        <div className="land-rise relative mx-auto max-w-[1080px] px-6" style={{ animationDelay: "200ms", "--rise": "24px", "--dur": "700ms" }}>
          <Preview />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-landing" />
      </div>

      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent
          className="@container max-h-[90svh] overflow-y-auto sm:max-w-lg"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="font-display text-2xl">{t.signTitle}</DialogTitle>
            <DialogDescription>{t.signSub}</DialogDescription>
            <p className="text-sm text-muted-foreground">{t.note}</p>
          </DialogHeader>
          <SignIn t={t} />
          <DialogClose asChild>
            <button type="button" aria-label={t.close} className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <X className="size-4" aria-hidden />
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-landing-mute @3xl:px-12">{t.footer}</footer>
    </div>
  );
}
