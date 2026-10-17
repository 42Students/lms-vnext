import { PageHeader } from "@/components/ui/page-header";

export default function DepartmentsLoading() {
  return <section className="space-y-4" aria-busy="true" aria-label="Loading departments">
    <PageHeader title="Departments" />
    <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">Loading departments…</p>
  </section>;
}
