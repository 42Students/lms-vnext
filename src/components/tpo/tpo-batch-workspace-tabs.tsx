import Link from "next/link";

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
  return <nav aria-label="Batch workspace tabs" className="flex flex-wrap gap-2 border-b border-border pb-3">
    {tabs.map(tab => <Link key={tab.slug} aria-current={tab.slug === active ? "page" : undefined}
      href={`/tpo/batches/${encodeURIComponent(batchId)}${tab.slug ? "/"+tab.slug : ""}`}
      className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold ${tab.slug === active
        ? "border-primary bg-primary-subtle text-primary-text" : "border-border bg-surface text-body"}`}>
      {tab.label}{tab.slug === "students" && students !== undefined ? ` (${students})` : ""}
    </Link>)}
  </nav>;
}
