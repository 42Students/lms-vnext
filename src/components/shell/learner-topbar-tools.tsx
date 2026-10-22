"use client";

import Link from "next/link";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import { PopoverListbox } from "@/components/ui/popover";
import {LearnerNotificationBell} from "./learner-notification-bell";
import { LEARNER_COURSE_SEARCH_PLACEHOLDER } from "@/modules/courses/learner-course-copy-model";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

type LearnerCourse = {
  deliveryId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
};

export function LearnerTopbarTools() {
  const searchId=useId(),resultId=useId();
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [loadFailed,setLoadFailed]=useState(false);
  const [loading,setLoading]=useState(true);
  const [reloadCount,setReloadCount]=useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiFetch<{courses?:LearnerCourse[]}>("/api/courses/learner",{cache:"no-store"})
      .then(value=>{if(cancelled)return;setCourses(Array.isArray(value.courses)?value.courses:[]);setLoadFailed(false);})
      .catch(()=>{if(!cancelled)setLoadFailed(true);})
      .finally(()=>{if(!cancelled)setLoading(false);});

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return courses.slice(0, 6);
    return courses
      .filter((course) =>
        [course.courseName, course.courseCode, course.sectionName]
          .some((value) => value.toLowerCase().includes(needle)),
      )
      .slice(0, 8);
  }, [courses, query]);

  return (
    <div className="flex min-w-0 items-center gap-[var(--lms-space-2)]" ref={rootRef}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
      <div className="relative hidden min-w-0 flex-1 sm:block">
        <label className="sr-only" htmlFor={searchId}>
          Search Courses
        </label>
        <Input
          id={searchId}
          value={query}
          role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
          aria-expanded={open} aria-controls={open?resultId:undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
            if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              const links = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[data-slot="popover-listbox"] a[href]') ?? []);
              if (links.length) {
                event.preventDefault();
                (event.key === "ArrowUp" ? links.at(-1) : links[0])?.focus();
              }
            }
          }}
          placeholder={LEARNER_COURSE_SEARCH_PLACEHOLDER}
          className="w-full min-w-0 min-[768px]:max-w-40 min-[992px]:max-w-52 min-[1280px]:max-w-72"
          autoComplete="off"
        />
        {open ? (
          <PopoverListbox id={resultId} label="Course search results" onDismiss={() => setOpen(false)}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(26rem,calc(100vw-2rem))] min-w-0 max-h-96 overflow-y-auto p-2"
          >
            {loadFailed?<div className="flex flex-wrap items-center gap-[var(--lms-space-2)] p-2"><InlineNotice tone="error" message="Could not load courses. Please try again." onDismiss={()=>setLoadFailed(false)}/>
              <Button type="button" variant="ghost" className="min-h-11 px-3 text-sm text-primary-text underline" disabled={loading}
                onClick={()=>{setLoadFailed(false);setLoading(true);setReloadCount(current=>current+1);}}>Retry</Button></div>:null}
            {loading ? <p role="status" className="m-0 px-3 py-4 text-sm text-muted-foreground">Loading courses…</p> : matches.length > 0 ? (
              matches.map((course) => (
                <Link
                  key={course.deliveryId}
                  href={"/learn/courses/" + encodeURIComponent(course.deliveryId) + "/home"}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="block min-h-11 min-w-0 px-3 py-2.5 hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary-text)]"
                >
                  <p className="m-0 break-words text-sm font-semibold text-foreground">
                    {course.courseName}
                  </p>
                  <p className="mt-1 min-w-0 break-words text-xs text-muted-foreground">
                    {course.courseCode} · {course.sectionName}
                  </p>
                </Link>
              ))
            ) : (
              <p className="m-0 px-3 py-4 text-sm text-muted-foreground">
                No courses found. Try a different search.
              </p>
            )}
          </PopoverListbox>
        ) : null}
      </div>

      <LearnerNotificationBell />
    </div>
  );
}
