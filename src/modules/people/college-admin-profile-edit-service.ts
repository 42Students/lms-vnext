import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { facultyProfiles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

export class CollegeProfileVersionConflict extends Error {
  constructor(){super("PROFILE_VERSION_CHANGED");this.name="CollegeProfileVersionConflict";}
}
export class CollegeProfileVersionRequired extends Error {
  constructor(){super("PROFILE_VERSION_REQUIRED");this.name="CollegeProfileVersionRequired";}
}
const short = z.string().trim().max(150);
const httpsLink = z.string().trim().max(500).refine(
  value => !value || /^https:\/\//i.test(value),
  "Enter a secure HTTPS link.",
);
export const collegeOwnProfileSchema = z.object({
  displayName: short.min(1),
  roleTitle: short,
  about: z.string().trim().max(1000),
  photoUrl: httpsLink,
  social: z.object({
    linkedIn: httpsLink, github: httpsLink,
    website: httpsLink, instagram: httpsLink,
  }),
  personalDetails: z.object({
    gender: short, dateOfBirth: z.union([z.literal(""),z.iso.date()]),
    bloodGroup: z.string().trim().max(16),
  }).optional(),
  address: z.object({
    line1: short, line2: short, city: short,
    state: short, postalCode: z.string().trim().max(20), country: short,
    currentAddress:z.string().trim().max(2000).optional(),
    permanentAddress:z.string().trim().max(2000).optional(),
    currentCity:short.optional(),currentState:short.optional(),
    currentPincode:z.string().trim().max(20).optional(),
    permanentCity:short.optional(),permanentState:short.optional(),
    permanentPincode:z.string().trim().max(20).optional(),
  }),
  contacts: z.object({
    alternateEmail: z.union([z.literal(""), z.string().email()]),
    alternatePhone: z.string().trim().max(40),
    contactPerson: short,
    contactMobile:z.string().trim().max(20).optional(),
    contactPhone:z.string().trim().max(20).optional(),
    contactMail:z.union([z.literal(""),z.email()]).optional(),
  }),
});
export type CollegeOwnProfileInput = z.infer<typeof collegeOwnProfileSchema>;
const emptyProfile: Omit<CollegeOwnProfileInput, "displayName"> = {
  roleTitle: "", about: "", photoUrl: "",
  social: { linkedIn: "", github: "", website: "", instagram: "" },
  address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" },
  contacts: { alternateEmail: "", alternatePhone: "", contactPerson: "" },
};

/** A legacy profile had independent personal, contacts, address and social
 * readers. Preserve good sections even when one saved JSON subsection is bad.
 * Never silently save defaults over malformed historical bytes. */
export function readCollegeProfileSections(raw:unknown){
 const sections=collegeOwnProfileSchema.omit({displayName:true}).shape;
 const source=raw && typeof raw==="object" && !Array.isArray(raw)
  ? raw as Record<string,unknown> : {};
 const defaults=emptyProfile as Record<string,unknown>;
 const normalized:Record<string,unknown>={};
 const unavailableSections:string[]=[],missingSections:string[]=[];
 for(const name of Object.keys(sections) as (keyof typeof sections)[]){
  if(!Object.prototype.hasOwnProperty.call(source,name)){
   missingSections.push(name);
   normalized[name]=defaults[name];continue;
  }
  const result=sections[name].safeParse(source[name]);
  if(result.success)normalized[name]=result.data;
  else {unavailableSections.push(name);normalized[name]=defaults[name];}
 }
 const parsed=collegeOwnProfileSchema.omit({displayName:true}).parse(normalized);
 return {document:parsed,unavailableSections,missingSections,
  partialLoad:unavailableSections.length>0,
  recoveryMessage:unavailableSections.length
   ? "Some profile sections could not be loaded: "+unavailableSections.join(", ")+". Retry sections or request assistance before editing."
   : null};
}

function ownMembership(context: RequestContext) {
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" ||
      !hasMembershipRole(context, "COLLEGE_ADMIN"))
    throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: membership.collegeId, organizationId: membership.organizationId,
  });
  return membership;
}

export async function loadCollegeOwnProfile(context: RequestContext) {
  const member = ownMembership(context);
  const [person, record] = await Promise.all([
    getDb().select({ displayName: users.displayName }).from(users)
      .where(eq(users.id, context.user.id)).limit(1),
    getDb().select({
      document: facultyProfiles.profileDocument,
      version: facultyProfiles.profileDocumentVersion,
    })
      .from(facultyProfiles).where(eq(facultyProfiles.membershipId, member.id)).limit(1),
  ]);
  if (!person[0]) throw new Error("PROFILE_NOT_FOUND");
  const saved = record[0]?.document?.collegeAdmin;
  const read=readCollegeProfileSections(saved);
  return {
    displayName:person[0].displayName??"",...read.document,
    profileDocumentVersion:record[0]?.version??0,
    sectionLoad:{unavailableSections:read.unavailableSections,
     missingSections:read.missingSections,partialLoad:read.partialLoad,
     recoveryMessage:read.recoveryMessage},
  };
}

export async function updateCollegeOwnProfile(context: RequestContext, raw: unknown) {
  const member = ownMembership(context);
  const input = collegeOwnProfileSchema.parse(raw);
  const versionRaw=raw&&typeof raw==="object"&&!Array.isArray(raw)
    ?(raw as Record<string,unknown>).profileDocumentVersion:undefined;
  const version=z.number().int().nonnegative().safeParse(versionRaw);
  if(!version.success)throw new CollegeProfileVersionRequired();
  const { displayName, ...details } = input;
  return getDb().transaction(async tx => {
    const [account] = await tx.select({ id: users.id }).from(users)
      .where(eq(users.id, context.user.id)).for("update").limit(1);
    if (!account) throw new Error("PROFILE_NOT_FOUND");
    const [existing] = await tx.select().from(facultyProfiles)
      .where(eq(facultyProfiles.membershipId, member.id)).for("update").limit(1);
    if((existing?.profileDocumentVersion??0)!==version.data)
      throw new CollegeProfileVersionConflict();
    await tx.update(users).set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, account.id));
    const previous=existing?.profileDocument?.collegeAdmin;
    const previousRead=readCollegeProfileSections(previous);
    if(previousRead.partialLoad){
      // This is a whole-document writer: do not let a stale form overwrite
      // an invalid untouched legacy section with the UI default.
      throw new Error("COLLEGE_PROFILE_SECTIONS_INVALID:"+
        previousRead.unavailableSections.join(","));
    }
    const prior=previous && typeof previous==="object" && !Array.isArray(previous)
      ? previous as Record<string,unknown>:{};
    const priorAddress=prior.address && typeof prior.address==="object" &&
      !Array.isArray(prior.address) ? prior.address as Record<string,unknown>:{};
    // Old editors omit later-added legacy fields. Preserve rather than erase
    // them when saving unrelated profile sections.
    const mergedDetails={
      ...details,
      ...(details.personalDetails===undefined && prior.personalDetails
        ? {personalDetails:prior.personalDetails}:{}),
      address:{...priorAddress,...details.address},
      contacts:{
        ...(prior.contacts && typeof prior.contacts==="object" &&
           !Array.isArray(prior.contacts) ? prior.contacts as Record<string,unknown>:{}),
        ...details.contacts,
      },
    };
    const document = { ...(existing?.profileDocument ?? {}), collegeAdmin: mergedDetails };
    if (existing) {
      await tx.update(facultyProfiles).set({
        profileDocument: document,
        profileDocumentVersion: sql`${facultyProfiles.profileDocumentVersion} + 1`,
        updatedAt: new Date(),
      }).where(eq(facultyProfiles.membershipId, member.id));
    } else {
      await tx.insert(facultyProfiles).values({
        membershipId: member.id, profileDocument: document, profileDocumentVersion: 1,
      });
    }
    return {...input,profileDocumentVersion:version.data+1};
  });
}
