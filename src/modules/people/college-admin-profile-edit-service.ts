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
  const submitted = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  const version = z.number().int().nonnegative()
    .safeParse(submitted.profileDocumentVersion);
  if (!version.success) throw new CollegeProfileVersionRequired();

  // Modern editors send an explicit section diff and their saved baseline.
  // A legacy whole-document writer keeps strict version CAS behavior.
  const sectionSchema = z.array(
    z.enum(["personal", "social", "address", "contacts"]),
  ).min(1).max(4);
  const sectionInput = submitted.changedSections === undefined ? null
    : sectionSchema.safeParse(submitted.changedSections);
  const baselineInput = submitted.baseline === undefined ? null
    : collegeOwnProfileSchema.safeParse(submitted.baseline);
  if ((sectionInput && !sectionInput.success) ||
      (sectionInput && (!baselineInput || !baselineInput.success)) ||
      (!sectionInput && baselineInput)) {
    throw new CollegeProfileVersionRequired();
  }
  const edited = sectionInput?.success ? new Set(sectionInput.data) : null;
  const baseline = baselineInput?.success ? baselineInput.data : null;
  const { displayName, ...details } = input;

  return getDb().transaction(async tx => {
    const [account] = await tx.select({ id: users.id, displayName: users.displayName })
      .from(users).where(eq(users.id, context.user.id))
      .for("update").limit(1);
    if (!account) throw new Error("PROFILE_NOT_FOUND");
    const [existing] = await tx.select().from(facultyProfiles)
      .where(eq(facultyProfiles.membershipId, member.id)).for("update").limit(1);
    const currentVersion = existing?.profileDocumentVersion ?? 0;
    const previous = existing?.profileDocument?.collegeAdmin;
    const previousRead = readCollegeProfileSections(previous);
    if (previousRead.partialLoad) {
      // Don't silently overwrite corrupted stored sections with defaults.
      throw new Error("COLLEGE_PROFILE_SECTIONS_INVALID:" +
        previousRead.unavailableSections.join(","));
    }
    const prior = previous && typeof previous === "object" && !Array.isArray(previous)
      ? previous as Record<string, unknown> : {};
    const current = previousRead.document;

    if (currentVersion !== version.data) {
      if (!edited || !baseline) throw new CollegeProfileVersionConflict();
      // Changed sections alone must still match the original values.
      // Concurrent changes in untouched sections may be safely retained.
      const personalBefore = JSON.stringify([
        baseline.displayName, baseline.roleTitle, baseline.about,
        baseline.photoUrl, baseline.personalDetails,
      ]);
      const personalNow = JSON.stringify([
        account.displayName, current.roleTitle, current.about,
        current.photoUrl, current.personalDetails,
      ]);
      if ((edited.has("personal") && personalBefore !== personalNow) ||
          (edited.has("social") &&
            JSON.stringify(baseline.social) !== JSON.stringify(current.social)) ||
          (edited.has("address") &&
            JSON.stringify(baseline.address) !== JSON.stringify(current.address)) ||
          (edited.has("contacts") &&
            JSON.stringify(baseline.contacts) !== JSON.stringify(current.contacts))) {
        throw new CollegeProfileVersionConflict();
      }
    }

    const nameChanged = edited === null || edited.has("personal");
    const nextDisplayName = nameChanged ? displayName : account.displayName;
    if (nameChanged && nextDisplayName !== account.displayName) {
      await tx.update(users).set({
        displayName: nextDisplayName, updatedAt: new Date(),
      }).where(eq(users.id, account.id));
    }

    const priorAddress = prior.address && typeof prior.address === "object" &&
      !Array.isArray(prior.address) ? prior.address as Record<string, unknown> : {};
    const priorContacts = prior.contacts && typeof prior.contacts === "object" &&
      !Array.isArray(prior.contacts) ? prior.contacts as Record<string, unknown> : {};
    const mergedDetails = {
      ...current,
      ...(nameChanged ? {
        roleTitle: details.roleTitle, about: details.about, photoUrl: details.photoUrl,
        ...(details.personalDetails === undefined && prior.personalDetails
          ? { personalDetails: prior.personalDetails } :
          { personalDetails: details.personalDetails }),
      } : {}),
      ...((edited === null || edited.has("social"))
        ? { social: { ...current.social, ...details.social } } : {}),
      ...((edited === null || edited.has("address"))
        ? { address: { ...priorAddress, ...details.address } } : {}),
      ...((edited === null || edited.has("contacts"))
        ? { contacts: { ...priorContacts, ...details.contacts } } : {}),
    };
    // Preserve fields not yet surfaced by the vNext profile editor.
    const document = {
      ...(existing?.profileDocument ?? {}),
      collegeAdmin: { ...prior, ...mergedDetails },
    };
    if (existing) {
      await tx.update(facultyProfiles).set({
        profileDocument: document,
        profileDocumentVersion: sql`${facultyProfiles.profileDocumentVersion} + 1`,
        updatedAt: new Date(),
      }).where(eq(facultyProfiles.membershipId, member.id));
    } else {
      await tx.insert(facultyProfiles).values({
        membershipId: member.id, profileDocument: document,
        profileDocumentVersion: 1,
      });
    }
    return {
      displayName: nextDisplayName,
      ...mergedDetails,
      profileDocumentVersion: currentVersion + 1,
    };
  });
}
