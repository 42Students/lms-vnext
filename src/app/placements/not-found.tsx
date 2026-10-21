import { PageHeader } from "@/components/ui/page-header";

export default function PublicPlacementsNotFound() {
  return (
    <main className="mx-auto my-4 min-h-[calc(100vh-2rem)] w-full max-w-4xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 min-[768px]:p-6">
      <section role="status" className="space-y-3">
        <PageHeader title="This page isn't available" />
        <p className="text-sm text-body">
          The placement cell hasn't published a placements page here.
        </p>
      </section>
    </main>
  );
}
