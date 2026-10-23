"use client";

import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import styles from "./legacy-project-tabs.module.css";

/** Exact seven visible tabs of mentor prototype screens 46–52. The
 * existing delivery review remains available from its authorized URL and
 * project review actions, not as a prototype-invented eighth tab. */
const tabs = [
  { key: "overview", label: "Overview" },
  { key: "board", label: "Board" },
  { key: "sprints", label: "Sprints & releases" },
  { key: "team", label: "Team & meetings" },
  { key: "performance", label: "Performance" },
  { key: "resources", label: "Resources" },
  { key: "activity", label: "Activity" },
] as const;

export function MentorProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const active = requested === "tasks" ? "board" : requested === "meetings" ? "team" :
    tabs.some(item => item.key === requested) ? requested ?? "overview" : "overview";
  const base = "/mentor/projects/" + encodeURIComponent(projectId);
  return <Tabs className={styles["legacy"] ?? ""} ariaLabel="Project sections" value={active} 
    items={tabs.map(tab => ({ value: tab.key, label: tab.label, href: base + "?tab=" + tab.key }))}
    renderPanel={false}/>;
}
