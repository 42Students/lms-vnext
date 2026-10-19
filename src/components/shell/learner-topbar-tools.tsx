"use client";

import Link from "next/link";
import {apiFetch} from "@/lib/api-fetch";
import {InlineNotice} from "@/components/ui/inline-notice";
import { PopoverListbox } from "@/components/ui/popover";
import {LearnerNotificationBell} from "./learner-notification-bell";
import { LEARNER_COURSE_SEARCH_PLACEHOLDER } from "@/modules/courses/learner-course-copy-model";
import { useEffect, useMemo, useRef, useState } from "react";
import {Input} from "@/components/ui/input";

type LearnerCourse = {
  deliveryId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
};

export function LearnerTopbarTools() {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [loadFailed,setLoadFailed]=useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiFetch<{courses?:LearnerCourse[]}>("/api/courses/learner",{cache:"no-store"})
      .then(value=>{if(cancelled)return;setCourses(Array.isArray(value.courses)?value.courses:[]);setLoadFailed(false);})
      .catch(()=>{if(!cancelled)setLoadFailed(true);});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
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
    <div className="flex min-w-0 items-center gap-2" ref={rootRef}>
      <div className="relative hidden min-w-0 sm:block">
        <label className="sr-only" htmlFor="learner-global-course-search">
          Search Courses
        </label>
        <Input
          id="learner-global-course-search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); return; }
            if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              const links = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[data-slot="popover-listbox"] a[href]') ?? []);
              if (links.length) {
                event.preventDefault();
                (event.key === "ArrowUp" ? links.at(-1) : links[0])?.focus();
              }
            }
          }}
          placeholder={LEARNER_COURSE_SEARCH_PLACEHOLDER}
          className="w-52 lg:w-72"
          autoComplete="off"
        />
        {open ? (
          <PopoverListbox label="Course search results" onDismiss={() => setOpen(false)}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-96 w-[min(26rem,80vw)] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl"
          >
            {loadFailed?<div className="p-2"><InlineNotice tone="error" message="Could not load courses. Please try again." onDismiss={()=>setLoadFailed(false)}/></div>:null}
            {matches.length > 0 ? (
              matches.map((course) => (
                <Link
                  key={course.deliveryId}
                  href={"/learn/courses/" + encodeURIComponent(course.deliveryId) + "/home"}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="block rounded-lg px-3 py-2.5 hover:bg-primary-subtle"
                >
                  <p className="m-0 text-sm font-semibold text-foreground">
                    {course.courseName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
