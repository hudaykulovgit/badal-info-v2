import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useStore } from "./store";

// §4 «Ўзаро маълумот алмашиш»: one thread per ministry with the Administrator.
export default function Chat({ open, onOpenChange }) {
  const { role, session, messages, setMessages } = useStore();
  const threads = [...new Set(messages.map((m) => m.org))];
  const [sel, setSel] = useState(null);
  const [text, setText] = useState("");
  const thread = role === "organ" ? session.org : role === "observer" ? "Кузатувчи" : sel || threads[0];
  const list = messages.filter((m) => m.org === thread);
  const me = role === "admin" ? "admin" : "organ";

  const send = () => {
    if (!text.trim()) return;
    setMessages((s) => [...s, { id: Date.now(), org: thread, from: me, text: text.trim(), at: new Date().toLocaleString("ru-RU").slice(0, 17) }]);
    setText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="font-display text-xl">Хабарлар</SheetTitle>
          <SheetDescription>{role === "admin" ? "Масъул органлар билан ёзишмалар" : "Администратор билан ёзишма"}</SheetDescription>
        </SheetHeader>
        {role === "admin" && (
          <div className="flex gap-2 overflow-x-auto border-b px-5 py-3">
            {threads.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSel(t)}
                className={cn("shrink-0 rounded-full border px-3 py-1 text-sm", t === thread ? "border-signal bg-signal-soft text-signal" : "text-muted-foreground hover:bg-muted")}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {list.length === 0 && <p className="text-muted-foreground">Хабарлар йўқ.</p>}
          {list.map((m) => {
            const mine = m.from === me;
            return (
              <div key={m.id} className={cn("flex max-w-[85%] flex-col gap-1", mine ? "self-end items-end" : "self-start")}>
                <div className={cn("rounded-xl px-3.5 py-2.5", m.system ? "border border-sent/40 bg-sent/10" : mine ? "bg-signal text-white" : "bg-muted")}>{m.text}</div>
                <span className="text-sm text-muted-foreground">
                  {m.system ? "Автоматик огоҳлантириш · " : ""}
                  {m.from === "admin" ? "Администратор" : m.org} · {m.at}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 border-t p-4">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Хабар ёзинг" aria-label="Хабар" />
          <Button type="button" onClick={send} disabled={!text.trim()} aria-label="Юбориш">
            <Send aria-hidden />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
