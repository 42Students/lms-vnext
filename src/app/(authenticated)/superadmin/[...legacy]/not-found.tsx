import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function LegacySuperAdminNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Super Admin" />
    <ErrorState title="Page not found" description="This legacy bookmark is not available in the current workspace."
      action={<TextLink href="/admin/academics" className="inline-flex min-h-11 items-center md:min-h-9">Open Super Admin</TextLink>}/>
  </div>;
}
