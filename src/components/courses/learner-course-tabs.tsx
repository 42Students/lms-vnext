import Link from "next/link";

export const learnerCourseTabs = [
  { label: "Overview", path: "home" },
  { label: "Learning Path", path: "roadmap" },
  { label: "Attendance", path: "attendanceDetail" },
  { label: "Discussions", path: "discussions" },
] as const;

export function LearnerCourseTabs({
  deliveryId,
  activeTab,
  persistentQuery="",
}: {
  deliveryId: string;
  activeTab: string;
  persistentQuery?:string;
}) {
  return (
    <nav aria-label="Course workspace" className="overflow-x-auto border-b border-border">
      <div className="flex min-w-max gap-1">
        {learnerCourseTabs.map((tab) => {
          const active = tab.path === activeTab;
          return (
            <Link
              key={tab.path}
              href={`/learn/courses/${encodeURIComponent(deliveryId)}/${tab.path}${persistentQuery?"?"+persistentQuery:""}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "border-b-2 border-primary px-4 py-3 text-sm font-semibold text-primary-text"
                  : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-body hover:text-primary-text"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
