import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeBranding, colleges } from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {sanitizePublicCollegeBranding} from "./public-branding-model";
import {effectiveCollegeSignInMethod,effectivePublicCollegeSignInPolicy} from "./public-signin-policy-service";
import {
  collegeBrandingSaveSchema,
  sameCollegeBranding,
  type CollegeBrandingInput,
} from "./branding";

export type CollegeBrandingView = CollegeBrandingInput & {
  version: number;
};

/** Legacy crosswalk: logoUrl is a safe public HTTPS fallback, while the
 * verified uploaded college.logoObjectPath takes priority via the public
 * /api/colleges/:id/branding/logo endpoint. Legacy sign-in loginMethods does
 * NOT belong in presentation branding: college_signin_policies is the
 * separately versioned, audited source of truth with EMAIL_AND_PHONE default.
 * The four original EMAIL_PHONE/PHONE_EMAIL/EMAIL_ONLY/PHONE_ONLY options
 * are projected by effectivePublicCollegeSignInPolicy after the host is
 * verified, while OTP route authorization continues to use that policy.
 * Existing colleges require no historical ID or R2 object-key migration.
 * An absent field retains its previous value, while explicit null clears it;
 * expectedVersion protects concurrent form saves. */
export const EMPTY_BRANDING: CollegeBrandingInput = {
  logoUrl: null,
  faviconUrl: null,
  loginBackgroundUrl: null,
  loginBackgroundUrlMobile: null,
  primaryColor: null,
  secondaryColor: null,
  supportEmail: null,
  supportPhone: null,
  termsUrl: null,
  privacyUrl: null,
};

export class CollegeBrandingNotFoundError extends Error {
  constructor() {
    super("COLLEGE_NOT_FOUND");
    this.name = "CollegeBrandingNotFoundError";
  }
}
export class CollegeBrandingVersionError extends Error {
 constructor(){
  super("BRANDING_STALE");
  this.name="CollegeBrandingVersionError";
 }
}

async function loadCollege(collegeId: string) {
  const [college] = await getDb()
    .select({
      id: colleges.id,
      name: colleges.name,
      organizationId: colleges.organizationId,
      status: colleges.status,
      logoObjectPath: colleges.logoObjectPath,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college || college.status !== "ACTIVE") {
    throw new CollegeBrandingNotFoundError();
  }
  return college;
}

async function loadBranding(collegeId: string) {
  const [row] = await getDb()
    .select()
    .from(collegeBranding)
    .where(eq(collegeBranding.collegeId, collegeId))
    .limit(1);
  return row ?? null;
}

function toView(row: Awaited<ReturnType<typeof loadBranding>>): CollegeBrandingView {
  if (!row) return { ...EMPTY_BRANDING, version: 0 };
  return {
    logoUrl: row.logoUrl ?? null,
    faviconUrl: row.faviconUrl ?? null,
    loginBackgroundUrl: row.loginBackgroundUrl ?? null,
    loginBackgroundUrlMobile: row.loginBackgroundUrlMobile ?? null,
    primaryColor: row.primaryColor ?? null,
    secondaryColor: row.secondaryColor ?? null,
    supportEmail: row.supportEmail ?? null,
    supportPhone: row.supportPhone ?? null,
    termsUrl: row.termsUrl ?? null,
    privacyUrl: row.privacyUrl ?? null,
    version: row.version,
  };
}

/**
 * Branding shown to anonymous visitors on a college's own host (sign-in page).
 * Only presentation fields are returned; no ids beyond what the caller
 * already resolved from the verified host.
 */
export async function getPublicCollegeBranding(collegeId: string) {
  // Only a missing/inactive college resolves to absent branding. A storage
  // outage must propagate instead of looking like an unknown public tenant.
  let college: Awaited<ReturnType<typeof loadCollege>>;
  try {
    college = await loadCollege(collegeId);
  } catch (error) {
    if (error instanceof CollegeBrandingNotFoundError) return null;
    throw error;
  }
  const [branding,signIn]=await Promise.all([
    loadBranding(collegeId),effectivePublicCollegeSignInPolicy(college.id),
  ]);
  // Allowlist exactly public presentation and sign-in capability fields.
  // Version, object-storage keys and other private state stay server-side.
  const safe=sanitizePublicCollegeBranding(toView(branding));
  const uploadedLogo=college.logoObjectPath?.startsWith("branding/"+college.id+"/")
    ?"/api/colleges/"+college.id+"/branding/logo":null;
  return {
    collegeName:college.name,
    ...safe,
    logoUrl:uploadedLogo??safe.logoUrl,
    signInMethod:signIn.method,
    loginMethods:signIn.legacyLoginMethods,
    signInChannelOrder:signIn.channelOrder,
    emailEnabled:signIn.emailEnabled,
    phoneEnabled:signIn.phoneEnabled,
  };
}

export async function getCollegeBranding(
  context: RequestContext,
  collegeId: string,
) {
  const college = await loadCollege(collegeId);
  requirePermission(context, "college.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  const [branding,signInMethod]=await Promise.all([
    loadBranding(collegeId),
    effectiveCollegeSignInMethod(college.id),
  ]);
  // Keep four sign-in choices sourced from college_signin_policies rather
  // than accepting legacy loginMethods inside the branding payload.
  return { collegeName: college.name, signInMethod, ...toView(branding),
    uploadedLogoUrl:college.logoObjectPath?.startsWith("branding/"+college.id+"/")?
     "/api/colleges/"+college.id+"/branding/logo":null,
  };
}

export async function saveCollegeBranding(
  context: RequestContext,
  collegeId: string,
  rawInput: unknown,
) {
  const {expectedVersion,...input}=collegeBrandingSaveSchema.parse(rawInput);
  const college = await loadCollege(collegeId);

  if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
  requirePermission(context, "college.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return getDb().transaction(async tx=>{
   // A Super Admin can lose their role while editing a stale tab; the
   // write must recheck persisted authority before touching login branding.
   await assertPersistedPlatformPermission(tx,context,"college.manage",{
    collegeId:college.id,organizationId:college.organizationId,
   });
   const [active]=await tx.select({id:colleges.id}).from(colleges)
    .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE")))
    .for("update").limit(1);
   if(!active)throw new CollegeBrandingNotFoundError();
   const [stored]=await tx.select().from(collegeBranding)
    .where(eq(collegeBranding.collegeId,college.id)).for("update").limit(1);
   const previous=toView(stored??null);
   const merged: CollegeBrandingInput = { ...EMPTY_BRANDING, ...previous, ...input };
   // Keep stale references for an authorized post-commit storage worker.
   // Never delete old objects inside the transaction, nor delete arbitrary
   // external HTTPS URLs: they can be shared with other tenants.
   const changedAssetFields=(["logoUrl","faviconUrl","loginBackgroundUrl","loginBackgroundUrlMobile"] as const)
    .filter(key=>previous[key]!==merged[key]);
   // An already-applied retry is safe. Do not advance version or emit a
   // duplicate activity event merely because the response was lost.
   if(sameCollegeBranding(previous,merged))
    return {collegeName:college.name,...previous};
   if(previous.version!==expectedVersion)throw new CollegeBrandingVersionError();
   const [row]=stored
    ?await tx.update(collegeBranding).set({
      ...merged,version:sql`${collegeBranding.version} + 1`,updatedAt:new Date(),
     }).where(eq(collegeBranding.collegeId,college.id)).returning()
    :await tx.insert(collegeBranding).values({collegeId:college.id,...merged,version:1}).returning();

   if (!row) throw new Error("BRANDING_SAVE_FAILED");
   await recordActivityEventInTransaction(tx, context, {
    eventType: ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED,
    collegeId: college.id,
    organizationId: college.organizationId,
    subjectType: "college",
    subjectId: college.id,
    subjectLabel: college.name,
    summary: "College branding updated",
    metadata: { version: row.version,changedAssetFields,storageCleanup:"POST_COMMIT_OWNER_REVIEW_REQUIRED" },
   });
   return { collegeName: college.name, ...toView(row) };
  });
}
