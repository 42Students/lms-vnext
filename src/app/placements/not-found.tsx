import { PageHeader } from "@/components/ui/page-header";

export default function PublicPlacementsNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--lms-neutral-50)] px-4 py-8">
    <main className="mx-auto w-full max-w-[760px] rounded-[8px] border border-border bg-surface p-6">
      <section role="status" className="space-y-3">
        <PageHeader title="This page isn't available" />
        <p className="text-sm text-body">
          The placement cell hasn't published a placements page here.
        </p>
      </section>
    </main>
    </div>
  );
}
