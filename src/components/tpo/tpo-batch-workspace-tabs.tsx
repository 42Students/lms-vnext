import { Tabs } from "@/components/ui/tabs";

const tabs = [
  { slug: "", label: "Overview" }, { slug: "students", label: "Students" },
  { slug: "classes", label: "Classes" },
  { slug: "registrations", label: "Registrations" }, { slug: "rules", label: "Rules" },
  { slug: "history", label: "History" },
] as const;

/** Reuse on every batch subpage so the navigation is never two clicks away. */
export function TpoBatchWorkspaceTabs({ batchId, active, students }: {
  batchId: string; active: typeof tabs[number]["slug"]; students?: number;
}) {
  return <Tabs ariaLabel="Batch workspace tabs" value={active} renderPanel={false}
    items={tabs.map(tab => ({
      value: tab.slug,
      label: tab.label,
      count: tab.slug === "students" ? students : undefined,
      href: `/tpo/batches/${encodeURIComponent(batchId)}${tab.slug ? "/" + tab.slug : ""}`,
    }))} />;
}
