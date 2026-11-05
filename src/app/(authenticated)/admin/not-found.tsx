import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

/** The existing authenticated shell supplies the single legacy page canvas. */
export default function NotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Page not found" />
      <div className="min-w-0 space-y-4">
        <p className="m-0 max-w-prose break-words text-[13px] leading-5 text-body">
          This Super Admin page may have moved or is no longer available. Return to Tenant Setup, the verified Super Admin landing destination.
        </p>
        <ButtonLink variant="primary" href="/admin/tenants"
          className="w-full sm:w-auto">
          Go to Tenant Setup
        </ButtonLink>
      </div>
    </section>
  );
}
