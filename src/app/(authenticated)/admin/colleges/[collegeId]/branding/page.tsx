import { notFound } from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Banner} from "@/components/ui/banner";
import {Disclosure} from "@/components/ui/disclosure";
import {PageBackLink} from "@/components/ui/page-back-link";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
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


  const [previewResult,persistedResult,tenantResult]=await Promise.allSettled([
    getSuperAdminCollegeBrandingPreview(context,collegeId),
    getCollegeBranding(context,collegeId),
    getSuperAdminTenantLifecycleDetail(context,collegeId),
  ]);
  for(const value of [previewResult,persistedResult,tenantResult]){
    if(value.status==="rejected"&&value.reason instanceof AuthorizationError)throw value.reason;
  }
  if(previewResult.status==="fulfilled"&&!previewResult.value)notFound();
  if(previewResult.status==="rejected"||persistedResult.status==="rejected"||
    tenantResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Look and feel"
      actions={<PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)} label="College overview"/>}/>
    <ErrorState title="Couldn't load branding for this college."
      description="Saved branding and tenant identity could not be verified. No unsaved changes were applied."
      action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/branding"}
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
        Retry branding
      </Link>}/>
  </div>;
  const branding=previewResult.value;
  if(!branding)notFound();
  const persisted=persistedResult.value,tenant=tenantResult.value;
  const canEdit=can(context,"college.manage",{collegeId,organizationId:tenant.organizationId});

  return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Look and feel" actions={<div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-4">
      <PageBackLink href={`/admin/colleges/${encodeURIComponent(collegeId)}`} label="College overview"/>
      {context.adminScope?.collegeId===collegeId ? <Link href={`/admin/colleges/${encodeURIComponent(collegeId)}/subdomain`}
        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">
        Verify web address
      </Link> : null}
    </div>}/>
    <Banner tone="warning" role="status">
      Switching the selected college discards unsaved branding edits. Save changes before
      leaving or changing the active college in the header. The current editor is scoped
      to this college only.
    </Banner>
    <section aria-label="Edit college branding" className="min-w-0 space-y-[var(--lms-space-4)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
     <h2 className="text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Edit college branding</h2>
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
    <Disclosure title="Stored branding preview" className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
      <p className="text-xs text-muted-foreground">
        This preview uses stored brand details. Actual login appearance and tenant-domain routing require separate browser verification.
      </p>
      <CollegeBrandingPreview branding={branding}/>
    </Disclosure>
  </div>;
}
