"use client";

import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { TextLink } from "@/components/ui/text-link";
import { Tabs } from "@/components/ui/tabs";

/**
 * Job subpages remain nested under this layout. Determine the active route
 * from the App Router segment instead of pretending that every outlined link
 * is active. Shared Tabs supplies the old LMS teal underline and mobile
 * horizontal scrolling (legacy-styles/components___common.scss:365-410).
 */
export function AdminPlacementJobTabs({ basePath, title }: { basePath: string; title: string }) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("returnTo") ?? "";
  const backHref = requested.startsWith("/admin/placements") &&
    !requested.startsWith("//") && !requested.includes("\\") && requested.length < 512
      ? requested : "/admin/placements/drives";
  const preserved = backHref === "/admin/placements/drives" ? "" :
    "?returnTo=" + encodeURIComponent(backHref);
  const segment = useSelectedLayoutSegment();
  const active = segment === "applications" || segment === "schedule" || segment === "settings"
    ? segment : "";

  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <nav aria-label="Drive breadcrumb" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-[length:var(--lms-font-sm)] leading-5 text-[var(--lms-body-text)]">
      <TextLink href={backHref} className="inline-flex min-h-11 items-center md:min-h-[var(--lms-control-height)]">Drives</TextLink>
      <span aria-hidden="true">›</span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
    </nav>
    <Tabs ariaLabel="Drive workspace" value={active} renderPanel={false} className="min-w-0 w-full"
    items={[
      { value: "", label: "Overview", href: basePath + preserved },
      { value: "applications", label: "Applications", href: basePath + "/applications" + preserved },
      { value: "schedule", label: "Schedule", href: basePath + "/schedule" + preserved },
      { value: "settings", label: "Settings", href: basePath + "/settings" + preserved },
    ]} />
  </div>;
}
