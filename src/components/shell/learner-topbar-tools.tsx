"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type LearnerCourse = {
  deliveryId: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
};

export function LearnerTopbarTools() {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/courses/learner", { cache: "no-store" })
        .then(async (response) => response.ok ? response.json() : { courses: [] })
        .catch(() => ({ courses: [] })),
      fetch("/api/notifications?unreadOnly=true&limit=20", { cache: "no-store" })
        .then(async (response) => response.ok ? response.json() : { notifications: [] })
        .catch(() => ({ notifications: [] })),
    ]).then(([coursePayload, notificationPayload]) => {
      if (cancelled) return;
      setCourses(Array.isArray(coursePayload?.courses) ? coursePayload.courses : []);
      setUnreadCount(Array.isArray(notificationPayload?.notifications) ? notificationPayload.notifications.length : 0);
    });

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
        <input
          id="learner-global-course-search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search Courses"
          className="min-h-10 w-52 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] lg:w-72"
          autoComplete="off"
        />
        {open ? (
          <div
            role="listbox"
            aria-label="Course search results"
            className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-96 w-[min(26rem,80vw)] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl"
          >
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
          </div>
        ) : null}
      </div>

      <Link
        href="/learn/notifications"
        aria-label={unreadCount && unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-base text-foreground transition hover:bg-primary-subtle hover:text-primary-text"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount && unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
