import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

/** Unknown hosts and unpublished pages get the same non-disclosing public response. */
export default function PublicPlacementsNotFound() {
  return (
    <div className="min-h-dvh bg-[color:var(--lms-neutral-50)] px-4 py-8">
      <main className="mx-auto w-full max-w-[760px] min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
        <section role="status" className="space-y-4">
          <PageHeader title="This page isn't available" />
          <p className="text-sm leading-6 text-body">
            The placement cell hasn't published a placements page here, or this isn't a college link.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Check the college website for its current placement information.
          </p>
          <ButtonLink href="/" variant="secondary" className="min-h-11 w-full sm:w-auto">Go to home</ButtonLink>
        </section>
      </main>
    </div>
  );
}
