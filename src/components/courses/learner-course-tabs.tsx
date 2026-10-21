import { Tabs } from "@/components/ui/tabs";

export const learnerCourseTabs = [
  { label: "Overview", path: "home" },
  { label: "Learning Path", path: "roadmap" },
  { label: "Attendance", path: "attendanceDetail" },
  { label: "Discussions", path: "discussions" },
] as const;

export function LearnerCourseTabs({
  deliveryId,
  activeTab,
  persistentQuery = "",
}: {
  deliveryId: string;
  activeTab: string;
  persistentQuery?: string;
}) {
  return <Tabs ariaLabel="Course sections" value={activeTab} renderPanel={false}
    items={learnerCourseTabs.map(tab => ({
      value: tab.path,
      label: tab.label,
      href: `/learn/courses/${encodeURIComponent(deliveryId)}/${tab.path}${persistentQuery ? "?" + persistentQuery : ""}`,
    }))} />;
}
