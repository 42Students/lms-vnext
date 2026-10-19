"use client";

import { useEffect, useState } from "react";
import { Tabs } from "@/components/ui/tabs";

const SECTIONS = [
  { value: "course-home", label: "Home" },
  { value: "course-syllabus", label: "Syllabus" },
  { value: "who-teaches-it", label: "Who teaches it" },
  { value: "section-content", label: "Section content" },
] as const;

/** Hash navigation stays in-page while sharing the legacy underlined tab skin. */
export function CourseDetailAnchorTabs({ href }: { href: string }) {
  const [active, setActive] = useState<string>("course-home");

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      setActive(SECTIONS.some(section => section.value === hash) ? hash : "course-home");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <Tabs ariaLabel="Course detail tabs" value={active} renderPanel={false}
      items={SECTIONS.map(section => ({
        ...section,
        href: `${href}#${section.value}`,
      }))}
    />
  );
}
