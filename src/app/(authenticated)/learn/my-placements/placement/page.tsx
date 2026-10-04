import { PageHeader } from "@/components/ui/page-header";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Placements"
        title="Placement cell"
        description="Placement cell information and support."
      />
      <div className="min-h-56 rounded-xl border border-border bg-surface" />
    </div>
  );
}
