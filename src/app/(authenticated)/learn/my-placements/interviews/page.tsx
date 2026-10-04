import { PageHeader } from "@/components/ui/page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Placements"
        title="Interviews"
        description="Your placement interviews."
      />
      <div className="min-h-56 rounded-xl border border-border bg-surface" />
    </div>
  );
}
