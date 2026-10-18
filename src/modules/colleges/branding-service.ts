import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeBranding, colleges } from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {sanitizePublicCollegeBranding} from "./public-branding-model";
import {
  collegeBrandingSaveSchema,
  sameCollegeBranding,
  type CollegeBrandingInput,
} from "./branding";

export type CollegeBrandingView = CollegeBrandingInput & {
  version: number;
};

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
    logoUrl: row.logoUrl,
    faviconUrl: row.faviconUrl,
    loginBackgroundUrl: row.loginBackgroundUrl,
    loginBackgroundUrlMobile: row.loginBackgroundUrlMobile,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    termsUrl: row.termsUrl,
    privacyUrl: row.privacyUrl,
    version: row.version,
  };
}

/**
 * Branding shown to anonymous visitors on a college's own host (sign-in page).
 * Only presentation fields are returned; no ids beyond what the caller
 * already resolved from the verified host.
 */
export async function getPublicCollegeBranding(collegeId: string) {
  const [college, row] = await Promise.all([
    loadCollege(collegeId).catch(() => null),
    loadBranding(collegeId),
  ]);
  if (!college) return null;
  const view=toView(row);
  return { collegeName: college.name, ...view,
    ...sanitizePublicCollegeBranding(view),
    ...(college.logoObjectPath?.startsWith("branding/"+college.id+"/")?{
      logoUrl:"/api/colleges/"+college.id+"/branding/logo",
    }:{}),
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
  return { collegeName: college.name, ...toView(await loadBranding(collegeId)),
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
   // An already-applied retry is safe. Do not advance version or emit a
   // duplicate activity event merely because the response was lost.
   if(sameCollegeBranding(previous,input))
    return {collegeName:college.name,...previous};
   if(previous.version!==expectedVersion)throw new CollegeBrandingVersionError();
   const [row]=stored
    ?await tx.update(collegeBranding).set({
      ...input,version:sql`${collegeBranding.version} + 1`,updatedAt:new Date(),
     }).where(eq(collegeBranding.collegeId,college.id)).returning()
    :await tx.insert(collegeBranding).values({collegeId:college.id,...input}).returning();

   if (!row) throw new Error("BRANDING_SAVE_FAILED");
   await recordActivityEventInTransaction(tx, context, {
    eventType: ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED,
    collegeId: college.id,
    organizationId: college.organizationId,
    subjectType: "college",
    subjectId: college.id,
    subjectLabel: college.name,
    summary: "College branding updated",
    metadata: { version: row.version },
   });
   return { collegeName: college.name, ...toView(row) };
  });
}
