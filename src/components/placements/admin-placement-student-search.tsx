"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Choice = { membershipId: string; label: string; roll: string | null; email: string | null };
export function AdminPlacementStudentSearch({ collegeId, initialQuery, choices, selectedId, unavailable }: {
  collegeId: string | null;
  initialQuery: string;
  choices: readonly Choice[];
  selectedId: string | null;
  unavailable: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [text, setText] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pending, startTransition] = useTransition();
  const selectedRef = useRef(false);
  const value = text.trim();
  const current = value === initialQuery.trim();
  const visible = current && value.length >= 3 ? choices : [];
  const searching = !current && value.length >= 3 || pending;
  const show = open && Boolean(collegeId) && value.length >= 2;
  const base = "/admin/placements/student-lookup";

  useEffect(() => {
    if (!collegeId || selectedRef.current) return;
    if (value === initialQuery.trim()) return;
    if (value.length > 150 || (value.length > 0 && value.length < 3)) return;
    const timer = window.setTimeout(() => {
      startTransition(() => router.replace(value ? base + "?q=" + encodeURIComponent(value) : base, { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [collegeId, initialQuery, router, value]);

  function choose(choice: Choice) {
    selectedRef.current = true;
    setOpen(false);
    setActive(-1);
    router.push(base + "?" + new URLSearchParams({ q: initialQuery, student: choice.membershipId }).toString(), { scroll: false });
  }
  function clear() {
    selectedRef.current = false;
    setText("");
    setOpen(false);
    setActive(-1);
    router.replace(base, { scroll: false });
  }
  return <div className="relative w-full max-w-[420px]">
    <form role="search" method="get" action={base} className="flex min-w-0 items-stretch gap-1.5">
      <label className="sr-only" htmlFor={listId + "-input"}>Search a student by name or email</label>
      <div className="relative min-w-0 flex-1">
        <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input id={listId + "-input"} name="q" role="combobox"
          type="search" autoComplete="off" maxLength={150} disabled={!collegeId}
          value={text} aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={show}
          aria-controls={show ? listId : undefined}
          aria-activedescendant={show && active >= 0 && visible[active] ? listId + "-" + active : undefined}
          aria-describedby={!collegeId ? "placement-student-scope-hint" : listId + "-hint"}
          placeholder="Search a student by name or email"
          className="min-h-11 w-full min-w-0 pl-9 pr-9 md:min-h-9"
          onChange={event => { selectedRef.current = false; setText(event.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 100)}
          onKeyDown={event => {
            if (event.key === "Escape") { setOpen(false); setActive(-1); }
            if (!show || !visible.length) return;
            if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => Math.min(index + 1, visible.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); }
            if (event.key === "Enter" && active >= 0 && visible[active]) { event.preventDefault(); choose(visible[active]); }
          }}
        />
        {text ? <Button type="button" variant="ghost" size="sm"
          aria-label="Clear student search" onClick={clear}
          className="absolute right-1 top-1/2 -translate-y-1/2 !min-h-8 !w-8 !p-1">
          <X size={14} aria-hidden="true" />
        </Button> : null}
      </div>
      <Button type="submit" variant="secondary" disabled={!collegeId || value.length < 3 || value.length > 150}
        className="min-h-11 shrink-0 md:min-h-9">Search</Button>
    </form>
    <p className="sr-only" id={listId + "-hint"} role="status">
      {value.length === 2 ? "Enter one more character to search this college." :
        searching ? "Searching students…" :
        show && !visible.length ? `No students match “${value}”` :
        show ? `${visible.length} matching students. Use arrow keys to select.` : ""}
    </p>
    {show ? <div id={listId} role="listbox" aria-label="Matching students"
      className="absolute z-30 mt-1 max-h-[280px] w-full overflow-auto rounded-[8px] border border-border bg-surface p-1 shadow-lg">
      {value.length < 3 ? <p role="status" className="p-2 text-xs text-muted-foreground">Enter one more character to search.</p>
        : searching ? <p role="status" className="p-2 text-sm text-muted-foreground">Searching students…</p>
        : unavailable ? <p role="alert" className="p-2 text-sm text-error">Search failed — try again.</p>
        : visible.length === 0 ? <p role="status" className="p-2 text-sm text-muted-foreground">No students match “{value}”</p>
        : visible.map((choice, index) => <Button key={choice.membershipId} variant="ghost" type="button"
          id={listId + "-" + index} role="option" aria-selected={choice.membershipId === selectedId}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(choice)}
          className={`flex w-full flex-col items-start rounded px-3 py-2 text-left text-sm hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] ${active === index ? "bg-[var(--lms-primary-subtle)]" : ""}`}>
          <span className="block font-semibold">{choice.label}</span>
          <span className="block text-xs text-muted-foreground">{choice.roll || choice.email || ""}</span>
        </Button>)}
    </div> : null}
  </div>;
}
