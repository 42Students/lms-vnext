import { notFound } from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {PageBackLink} from "@/components/ui/page-back-link";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
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
    return <section className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-4">
      <h1 className="text-lg font-semibold text-foreground">Look and feel</h1>
      <p role="status" className="mt-3 text-sm font-semibold text-body">Pick a college first</p>
      <p className="mt-1 text-sm text-body">
        Branding belongs to one college. Choose a college in the header so changes can&apos;t land on the wrong one.
      </p>
      <Link href="/admin/colleges" className="mt-3 inline-flex min-h-11 items-center text-link underline md:min-h-9">
        Choose a college
      </Link>
    </section>;
  }


  // Verify the requested college before making either private branding read.
  // A missing/foreign preview must not probe another tenant's stored files.
  const previewResult=await Promise.allSettled([
    getSuperAdminCollegeBrandingPreview(context,collegeId),
  ]).then(results=>results[0]);
  if(previewResult.status==="rejected"&&previewResult.reason instanceof AuthorizationError)
    throw previewResult.reason;
  if(previewResult.status==="fulfilled"&&!previewResult.value)notFound();
  const [persistedResult,tenantResult]=previewResult.status==="fulfilled"
    ?await Promise.allSettled([
      getCollegeBranding(context,collegeId),
      getSuperAdminTenantLifecycleDetail(context,collegeId),
    ]):[null,null];
  for(const value of [persistedResult,tenantResult]){
    if(value?.status==="rejected"&&value.reason instanceof AuthorizationError)throw value.reason;
  }
  if(previewResult.status==="rejected"||!persistedResult||!tenantResult||
    persistedResult.status==="rejected"||tenantResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Look and feel"
      actions={<PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)} label="College overview"/>}/>
    <ErrorState title="Couldn't load branding for this college."
      description="Saved branding and tenant identity could not be verified. No unsaved changes were applied."
      action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/branding"}
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
        Retry branding
      </Link>}/>
  </div>;

  const persisted=persistedResult.value,tenant=tenantResult.value;
  const canEdit=can(context,"college.manage",{collegeId,organizationId:tenant.organizationId});

  return <div className="min-w-0 max-w-full space-y-4" data-testid="superadmin.college.branding">
    <PageHeader title="Manage college" description={persisted.collegeName}
      actions={<div className="flex min-w-0 flex-wrap items-center gap-3">
        <PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)} label="College overview"/>
        {context.adminScope?.collegeId===collegeId ? <Link
          href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/subdomain"}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
          Web address
        </Link> : null}
      </div>}/>
    <section aria-label="College login branding" className="min-w-0 space-y-3">
      <p className="sr-only">
        These appearance controls use the active college membership and separate versioned branding record.
        The editor confirms unsaved edits before a college switch, reload, or leaving the page.
      </p>
      <div className="min-w-0 max-w-full space-y-3">
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
      </div>
    </section>
  </div>;
}
