"use client";

import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import styles from "./legacy-project-tabs.module.css";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "team", label: "People & Meetings" },
  { key: "sprints", label: "Releases and Sprints" },
  { key: "board", label: "Board" },
  { key: "performance", label: "Task Allocation" },
  { key: "resources", label: "Resources" },
  { key: "delivery", label: "Delivery" },
  { key: "activity", label: "Activity" },
] as const;

export function MentorProjectTabs({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const active = requested === "tasks" ? "board" : requested === "meetings" ? "team" :
    tabs.some(item => item.key === requested) ? requested ?? "overview" : "overview";
  const base = "/mentor/projects/" + encodeURIComponent(projectId);
  return <Tabs className={styles.legacy} ariaLabel="Project sections" value={active} 
    items={tabs.map(tab => ({ value: tab.key, label: tab.label, href: base + "?tab=" + tab.key }))}
    renderPanel={false}/>;
}
