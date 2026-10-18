import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { collegeBranding, colleges } from "@/db/schema";
import {
  isSuperAdmin,
  type RequestContext,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import { collegeIdSchema } from "./validation";
import { describeAdminCollegeBranding } from "./admin-branding-preview-model";

/**
 * Only Super Admins within their selected resource scope may read this
 * college's public presentation settings. This matches the readiness
 * reader's isSuperAdmin + college.read scope fence, with an explicit
 * admin-scope.select check. A private logo key may be read to select the public\n * image proxy; that key is never returned to the browser.
 */
export async function getSuperAdminCollegeBrandingPreview(
  context: RequestContext,
  rawCollegeId: string,
) {
  if (!isSuperAdmin(context)) {
    throw new AuthorizationError("admin-scope.select");
  }
  requirePermission(context, "admin-scope.select");
  const collegeId = collegeIdSchema.parse(rawCollegeId);
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      status: colleges.status,
      logoObjectPath: colleges.logoObjectPath,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college) return null;

  requirePermission(context, "college.read", {
    collegeId: college.id,
    organizationId: college.organizationId,
  });

  const [branding] = await db
    .select({
      logoUrl: collegeBranding.logoUrl,
      faviconUrl: collegeBranding.faviconUrl,
      loginBackgroundUrl: collegeBranding.loginBackgroundUrl,
      loginBackgroundUrlMobile: collegeBranding.loginBackgroundUrlMobile,
      primaryColor: collegeBranding.primaryColor,
      secondaryColor: collegeBranding.secondaryColor,
      supportEmail: collegeBranding.supportEmail,
      supportPhone: collegeBranding.supportPhone,
      termsUrl: collegeBranding.termsUrl,
      privacyUrl: collegeBranding.privacyUrl,
    })
    .from(collegeBranding)
    .where(eq(collegeBranding.collegeId, college.id))
    .limit(1);

  // Authorization performed before the first select is only a request
  // snapshot. A revoked platform administrator must not receive branding
  // details after the DB work finishes.
  await db.transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"college.read",{
      collegeId:college.id,organizationId:college.organizationId,
    });
  });

  const result=describeAdminCollegeBranding({
    college: {
      id: college.id,
      name: college.name,
      code: college.code,
      status: college.status,
    },
    branding: branding ?? null,
  });
  return college.logoObjectPath?.startsWith("branding/"+college.id+"/")
   ? {...result,logoUrl:"/api/colleges/"+college.id+"/branding/logo",brandingStored:true}
   : result;
}
