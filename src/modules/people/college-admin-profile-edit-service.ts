import "server-only";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { facultyProfiles, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";

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
  address: z.object({
    line1: short, line2: short, city: short,
    state: short, postalCode: z.string().trim().max(20), country: short,
  }),
  contacts: z.object({
    alternateEmail: z.union([z.literal(""), z.string().email()]),
    alternatePhone: z.string().trim().max(40),
    contactPerson: short,
  }),
});
export type CollegeOwnProfileInput = z.infer<typeof collegeOwnProfileSchema>;
const emptyProfile: Omit<CollegeOwnProfileInput, "displayName"> = {
  roleTitle: "", about: "", photoUrl: "",
  social: { linkedIn: "", github: "", website: "", instagram: "" },
  address: { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" },
  contacts: { alternateEmail: "", alternatePhone: "", contactPerson: "" },
};

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
    getDb().select({ document: facultyProfiles.profileDocument })
      .from(facultyProfiles).where(eq(facultyProfiles.membershipId, member.id)).limit(1),
  ]);
  if (!person[0]) throw new Error("PROFILE_NOT_FOUND");
  const saved = record[0]?.document?.collegeAdmin;
  const parsed = collegeOwnProfileSchema.omit({ displayName: true }).safeParse(saved);
  return { displayName: person[0].displayName ?? "", ...(parsed.success ? parsed.data : emptyProfile) };
}

export async function updateCollegeOwnProfile(context: RequestContext, raw: unknown) {
  const member = ownMembership(context);
  const input = collegeOwnProfileSchema.parse(raw);
  const { displayName, ...details } = input;
  return getDb().transaction(async tx => {
    const [account] = await tx.select({ id: users.id }).from(users)
      .where(eq(users.id, context.user.id)).for("update").limit(1);
    if (!account) throw new Error("PROFILE_NOT_FOUND");
    const [existing] = await tx.select().from(facultyProfiles)
      .where(eq(facultyProfiles.membershipId, member.id)).for("update").limit(1);
    await tx.update(users).set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, account.id));
    const document = { ...(existing?.profileDocument ?? {}), collegeAdmin: details };
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
    return input;
  });
}
