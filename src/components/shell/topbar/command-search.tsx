"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ShellNavItem } from "../shell-model";
import { topbarCommands, topbarConfigForPath } from "./portal-config";
import { SearchIcon } from "./icons";
import style from "./topbar.module.css";

export function TopbarCommandSearch({ items }: { items: readonly ShellNavItem[] }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const config = topbarConfigForPath(pathname);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const commands = useMemo(() => topbarCommands(pathname, items), [pathname, items]);
  const matches = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    return (search ? commands.filter(command =>
      command.label.toLocaleLowerCase("en-IN").includes(search)) : commands).slice(0, 8);
  }, [query, commands]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        setMobileOpen(true);
        requestAnimationFrame(() => input.current?.focus());
      }
      if (event.key === "Escape") {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", shortcut);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", shortcut);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);

  function submit() {
    if (matches[0]) {
      router.push(matches[0].href);
    } else if (query.trim()) {
      // The destination performs its own scoped search; this bar never
      // queries private tenant records or assumes a cross-portal capability.
      router.push(config.searchHref + "?q=" + encodeURIComponent(query.trim()));
    }
    setOpen(false);
    setMobileOpen(false);
  }

  return <div ref={root}
    className={mobileOpen ? style.searchOpen : ""}>
    <div className={style.search}>
      <div className={style.searchBox}>
        <button type="button" aria-label="Open command search"
          onClick={() => {
            setOpen(true);
            setMobileOpen(true);
            input.current?.focus();
          }}
          className="inline-flex shrink-0 items-center justify-center text-[#5b6b82]">
          <SearchIcon />
        </button>
        <label className="sr-only" htmlFor="lms-topbar-command-search">Search workspace</label>
        <input id="lms-topbar-command-search" ref={input} type="search" value={query}
          autoComplete="off" role="combobox" aria-haspopup="listbox"
          aria-controls="lms-topbar-command-results" aria-expanded={open}
          placeholder={config.placeholder} className={style.searchInput}
          onFocus={() => { setOpen(true); setMobileOpen(true); }}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === "Enter") { event.preventDefault(); submit(); }
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); setMobileOpen(false); }
          }}/>
        <kbd className={style.searchHint}>Ctrl K</kbd>
      </div>
      {open ? <div id="lms-topbar-command-results" role="listbox"
        aria-label="Workspace commands" className={style.dropdown}>
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-[#64748b]">Go to</p>
        {matches.map(command => <Link role="option" aria-selected={false}
          key={command.href} href={command.href} className={style.suggestion}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon /> {command.label}
        </Link>)}
        {matches.length === 0 ? <p className="p-2 text-xs text-[#64748b]">
          No matching shortcuts. Press Enter to search this portal.
        </p> : null}
      </div> : null}
    </div>
  </div>;
}
