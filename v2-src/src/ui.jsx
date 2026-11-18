import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { AlertTriangle, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { FLAGS, STATUS } from "./model";

const TONE_BG = { paid: "bg-paid", sent: "bg-sent", unpaid: "bg-unpaid" };
const TONE_TEXT = { paid: "text-paid", sent: "text-sent-ink", unpaid: "text-unpaid" };

export function StatusDot({ status, className }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", TONE_BG[status], className)} />;
}

export function Status({ status }) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium", TONE_TEXT[status])}>
      <StatusDot status={status} />
      {STATUS[status].label}
    </span>
  );
}

export function FlagChip({ flag }) {
  const f = FLAGS[flag];
  const err = f.severity === "error";
  const Icon = err ? OctagonAlert : AlertTriangle;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-sm",
            err ? "border-unpaid/40 bg-unpaid/8 text-unpaid" : "border-sent/50 bg-sent/10 text-sent-ink",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {f.label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{f.hint}</TooltipContent>
    </Tooltip>
  );
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Figure({ label, value, sub, tone }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight", tone && TONE_TEXT[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-sm text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}

export function Pick({ label, value, onChange, options, disabled, className }) {
  return (
    <label className={cn("flex min-w-44 flex-col gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((o) => (
          <NativeSelectOption key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}

export function Panel({ title, action, children, className, bodyClassName }) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export const sliceAcct = (a) => (a && a.length >= 24 ? { razdel: a.slice(14, 18), podrazdel: a.slice(18, 21), glava: a.slice(21, 24) } : null);
