"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ShellNavItem } from "../shell-model";
import { apiFetch } from "@/lib/api-fetch";

type LearnerCourse = { deliveryId: string; courseName: string; courseCode: string; sectionName: string };
import { topbarCommands, topbarConfigForPath, topbarSearchDestinations } from "./portal-config";
import { SearchIcon } from "./icons";
import { TpoFindSuggestions } from "./tpo-find-suggestions";
import style from "./topbar.module.css";

export function TopbarCommandSearch({ items }: { items: readonly ShellNavItem[] }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const config = topbarConfigForPath(pathname);
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [courseError, setCourseError] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  // Preserve the old learner header's authorized course lookup when moving
  // its search box into the common command bar.
  useEffect(() => {
    if (config.portal !== "learn") return;
    let cancelled = false;
    void apiFetch<unknown>("/api/courses/learner", { cache: "no-store" })
      .then(payload => {
        if (cancelled) return;
        const value = payload && typeof payload === "object" &&
          "courses" in payload ? (payload as {courses: unknown}).courses : null;
        if (!Array.isArray(value)) throw new Error("Invalid courses");
        setCourses(value.filter((row): row is LearnerCourse =>
          row && typeof row === "object" &&
          typeof row.deliveryId === "string" &&
          typeof row.courseName === "string" &&
          typeof row.courseCode === "string" &&
          typeof row.sectionName === "string",
        ));
        setCourseError(false);
      })
      .catch(() => { if (!cancelled) setCourseError(true); });
    return () => { cancelled = true; };
  }, [config.portal]);
  const courseMatches = useMemo(() => {
    if (config.portal !== "learn") return [];
    const search = query.trim().toLocaleLowerCase("en-IN");
    return courses.filter(course => !search ||
      [course.courseName, course.courseCode, course.sectionName]
        .some(value => value.toLocaleLowerCase("en-IN").includes(search)))
      .slice(0, 6);
  }, [config.portal, courses, query]);
  const commands = useMemo(() => topbarCommands(pathname, items), [pathname, items]);
  const destinations = topbarSearchDestinations(pathname, query);
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
    if (query.trim() && courseMatches[0]) {
      router.push("/learn/courses/" + encodeURIComponent(courseMatches[0].deliveryId) + "/home");
    } else if (matches[0]) {
      router.push(matches[0].href);
    } else if (destinations[0]) {
      router.push(destinations[0].href);
    } else if (query.trim()) {
      // The destination applies the portal\u0027s own tenant and role policy.
      router.push(config.searchHref + "?q=" + encodeURIComponent(query.trim().slice(0,100)));
    }
    setOpen(false);
    setMobileOpen(false);
  }

  return <div ref={root}
    className={mobileOpen ? style.searchOpen : ""}>
    <div className={style.search}>
      <div className={style.searchBox}>
        <Button variant="ghost" size="sm" type="button" aria-label="Open command search"
          onClick={() => {
            setOpen(true);
            setMobileOpen(true);
            input.current?.focus();
          }}
          className="inline-flex shrink-0 items-center justify-center text-body">
          <SearchIcon />
        </Button>
        <label className="sr-only" htmlFor="lms-topbar-command-search">Search workspace</label>
        <input id="lms-topbar-command-search" ref={input} type="search" value={query}
          autoComplete="off" role="combobox" aria-haspopup="listbox" aria-keyshortcuts="Control+K Meta+K"
          aria-controls={open ? "lms-topbar-command-results" : undefined} aria-expanded={open}
          placeholder={config.placeholder} className={style.searchInput}
          onFocus={() => { setOpen(true); setMobileOpen(true); }}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === "Enter") { event.preventDefault(); submit(); }
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && open) {
              const options = root.current?.querySelectorAll<HTMLElement>('[role="option"]');
              const target = event.key === "ArrowDown" ? options?.[0] : options?.[options.length - 1];
              if (target) { event.preventDefault(); target.focus(); }
            }
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); setMobileOpen(false); }
          }}/>
        <kbd className={style.searchHint}>Ctrl K</kbd>
      </div>
      {open ? <div id="lms-topbar-command-results" role="listbox"
        aria-label="Workspace commands" className={style.dropdown}
        onKeyDown={event => {
          if (event.key === "Escape") {
            event.preventDefault();
            input.current?.focus();
            setOpen(false);
            setMobileOpen(false);
            return;
          }
          if (!event.ctrlKey && !event.metaKey && !event.altKey &&
              event.key.length === 1) {
            event.preventDefault();
            setQuery(value => (value + event.key).slice(0, 100));
            input.current?.focus();
            return;
          }
          if (event.defaultPrevented ||
              !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
          const index = options.findIndex(option => option === event.target);
          if (index < 0 || options.length === 0) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0
            : event.key === "End" ? options.length - 1
            : event.key === "ArrowDown" ? (index + 1) % options.length
            : (index - 1 + options.length) % options.length;
          options[next]?.focus();
        }}>
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Go to</p>
        {config.portal === "learn" && courseError ?
          <p role="status" className="px-2 py-2 text-xs text-error">Could not load courses. Search shortcuts remain available.</p> : null}
        {courseMatches.length > 0 ? <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Courses</p> : null}
        {courseMatches.map(course => <Link key={course.deliveryId}
          role="option" aria-selected={false}
          href={"/learn/courses/" + encodeURIComponent(course.deliveryId) + "/home"}
          className={style.suggestion}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon /> <span className="min-w-0"><span className="block truncate">{course.courseName}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{course.courseCode} · {course.sectionName}</span></span>
        </Link>)}
        {config.portal === "tpo" && query.trim().length >= 2
          ? <TpoFindSuggestions query={query} onOpen={href => {
              router.push(href);
              setQuery("");
              setOpen(false);
              setMobileOpen(false);
            }}/> : null}
        {destinations.length > 0 ? <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Search within</p> : null}
        {destinations.map(destination => <Link key={destination.href}
          role="option" aria-selected={false} href={destination.href}
          className={style.suggestion}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon/> {destination.label}
        </Link>)}
        {matches.map(command => <Link role="option" aria-selected={false}
          key={command.href} href={command.href} className={style.suggestion}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon /> {command.label}
        </Link>)}
        {matches.length === 0 && destinations.length === 0 && courseMatches.length === 0 ? <p className="p-2 text-xs text-muted-foreground">
          No matching shortcuts. Press Enter to search this portal.
        </p> : null}
      </div> : null}
    </div>
  </div>;
}
