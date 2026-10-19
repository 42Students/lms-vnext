import { notFound } from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import { CollegeBrandingPreview } from "@/components/admin/college-branding-preview";
import {CollegeBrandingForm} from "@/components/admin/college-branding-form";
import {CollegeLogoUploader} from "@/components/admin/college-logo-uploader";
import {getCollegeBranding} from "@/modules/colleges/branding-service";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {can} from "@/modules/permissions/policy";
import { getSuperAdminCollegeBrandingPreview } from "@/modules/colleges/admin-branding-preview-service";
import { collegeIdSchema } from "@/modules/colleges/validation";

export default async function SuperAdminCollegeBrandingPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const { collegeId } = await params;
  if (!collegeIdSchema.safeParse(collegeId).success) {
    notFound();
  }


  const branding = await getSuperAdminCollegeBrandingPreview(context, collegeId);
  if (!branding) notFound();
  const [persisted,tenant]=await Promise.all([getCollegeBranding(context,collegeId),getSuperAdminTenantLifecycleDetail(context,collegeId)]);
  const canEdit=can(context,"college.manage",{collegeId,organizationId:tenant.organizationId});

  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center gap-3">
      <Link href={`/admin/colleges/${encodeURIComponent(collegeId)}`}
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-3 text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)]">← College overview</Link>
      {context.adminScope?.collegeId===collegeId ? <Link href={`/admin/colleges/${encodeURIComponent(collegeId)}/subdomain`}
        className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-3 text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)]">
        Verify web address
      </Link> : null}
    </div>
    <p className="border-t border-border pt-3 text-xs text-muted-foreground">
      This preview uses stored brand details. Actual login appearance and tenant-domain routing require separate browser verification.
    </p>
    <PageHeader eyebrow="Super Admin · Tenant" title="Look and feel"/>
    <CollegeBrandingPreview branding={branding}/>
    <section aria-label="Edit college branding" className="min-w-0 space-y-3 border-t border-border pt-4">
     <h2 className="text-lg font-semibold">Look and feel</h2>
     <p className="text-sm text-body">Update the stored college logo URL, colours and sign-in appearance. Upload and crop your square logo above, then edit colours and sign-in appearance.</p>
     <CollegeLogoUploader collegeId={collegeId} currentUrl={persisted.uploadedLogoUrl} canEdit={canEdit}/>
     <CollegeBrandingForm key={collegeId} collegeId={collegeId} collegeName={persisted.collegeName}
      canEdit={canEdit} uploadedLogoUrl={persisted.uploadedLogoUrl} initialVersion={persisted.version} initial={{
       logoUrl:persisted.logoUrl,faviconUrl:persisted.faviconUrl,
       loginBackgroundUrl:persisted.loginBackgroundUrl,
       loginBackgroundUrlMobile:persisted.loginBackgroundUrlMobile,
       primaryColor:persisted.primaryColor,secondaryColor:persisted.secondaryColor,
       supportEmail:persisted.supportEmail,supportPhone:persisted.supportPhone,
       termsUrl:persisted.termsUrl,privacyUrl:persisted.privacyUrl,
      }}/>
    </section>
  </div>;
}
