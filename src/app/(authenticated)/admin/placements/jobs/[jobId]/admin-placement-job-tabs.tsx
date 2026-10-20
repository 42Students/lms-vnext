"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

/**
 * Job subpages remain nested under this layout. Determine the active route
 * from the App Router segment instead of pretending that every outlined link
 * is active. Shared Tabs supplies the old LMS teal underline and mobile
 * horizontal scrolling (legacy-styles/components___common.scss:365-410).
 */
export function AdminPlacementJobTabs({ basePath }: { basePath: string }) {
  const segment = useSelectedLayoutSegment();
  const active = segment === "applications" || segment === "schedule" || segment === "settings"
    ? segment : "";

  return <Tabs ariaLabel="Drive workspace" value={active} renderPanel={false} className="min-w-0 w-full"
    items={[
      { value: "", label: "Overview", href: basePath },
      { value: "applications", label: "Applications", href: basePath + "/applications" },
      { value: "schedule", label: "Schedule", href: basePath + "/schedule" },
      { value: "settings", label: "Settings", href: basePath + "/settings" },
    ]} />;
}
