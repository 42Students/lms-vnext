import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeBrandingPreview } from "@/components/admin/college-branding-preview";
import { getSuperAdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-service";
import { collegeIdSchema } from "@/modules/colleges/validation";

export default async function SuperAdminCollegeBrandingPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = await params;
  if (!collegeIdSchema.safeParse(collegeId).success) {
    notFound();
  }

  const context = await getCurrentRequestContext();
  const branding = await getSuperAdminCollegeBrandingPreview(context, collegeId);
  if (!branding) notFound();

  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center gap-3">
      <Link href={`/admin/colleges/${encodeURIComponent(collegeId)}`}
        className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← College overview</Link>
      {context.adminScope?.collegeId===collegeId ? <Link href={`/admin/colleges/${encodeURIComponent(collegeId)}/subdomain`}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
        Verify web address
      </Link> : null}
    </div>
    <p className="rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
      This preview uses stored brand details. Actual login appearance and tenant-domain routing require separate browser verification.
    </p>
    <CollegeBrandingPreview branding={branding}/>
  </div>;
}
