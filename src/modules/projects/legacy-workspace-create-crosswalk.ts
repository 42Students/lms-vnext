/** Field crosswalk for legacy AdminProjectCreateDTO -> vNext workspace create.
 * This is metadata, not an API accepting legacy IDs. Integer IDs must be
 * resolved to tenant-scoped UUIDs server-side before calling createProjectInstance.
 * Unsupported fields must never be silently dropped during a migration. */
export const legacyWorkspaceCreateFields = {
 title: { target: "title", mode: "DIRECT", note: "Legacy max 160 characters; vNext must still enforce its form limit." },
 summary: { target: "summary", mode: "DIRECT", note: "Optional description; a blank string is omitted, not persisted as empty." },
 courseLabel: { target: null, mode: "UNSUPPORTED", note: "No direct course-label attribute in vNext workspace create." },
 status: { target: "initialStatus", mode: "STATUS_CROSSWALK", note: "Use resolveLegacyWorkspaceCreateStatus; never silently downgrade a blocked workspace." },
 phase: { target: null, mode: "UNSUPPORTED", note: "Persisted workflow phase needs its own domain mapping." },
 progress: { target: null, mode: "UNSUPPORTED", note: "Legacy 0-100 progress has no create-time vNext field." },
 blocker: { target: null, mode: "UNSUPPORTED", note: "Requires a persisted blocker/event mapping." },
 nextAction: { target: null, mode: "UNSUPPORTED", note: "Requires a task/action mapping." },
 dueLabel: { target: null, mode: "UNSUPPORTED", note: "Human-readable due label is not a persisted due date." },
 organizationId: { target: null, mode: "SERVER_DERIVED", note: "Derived from college, never trusted from request." },
 collegeId: { target: "collegeId", mode: "TENANT_LOOKUP", note: "Resolve legacy college integer to active college UUID." },
 classId: { target: "sectionId", mode: "TENANT_LOOKUP", note: "Resolve college class to section UUID; same-college proof required." },
 templateId: { target: "templateId", mode: "TENANT_LOOKUP", note: "Resolve assigned published template integer to UUID." },
 mentorId: { target: "primaryMentorMembershipId", mode: "MEMBERSHIP_LOOKUP", note: "Resolve faculty to active MENTOR membership in same college." },
 learnerIds: { target: "learnerMembershipIds", mode: "MEMBERSHIP_LOOKUP", note: "Resolve and deduplicate active learner memberships within college; limit 500." },
 slug: { target: "slug", mode: "V_NEXT_DERIVED", note: "Required in vNext, generate a validated tenant-scoped slug at the boundary." },
} as const;

export type LegacyWorkspaceCreateStatusCrosswalk =
 | { kind: "MAPPED"; initialStatus: "PLANNED" | "ACTIVE"; legacyStatus: string; note: string }
 | { kind: "REQUIRES_MIGRATION"; legacyStatus: string; reason: string }
 | { kind: "INVALID"; reason: string };

/** Only PLANNED/ACTIVE are native vNext initial statuses.
 * IN_PROGRESS is an active lifecycle alias, but phase and progress still need
 * explicit migration. READY/BLOCKED/ARCHIVED cannot safely be collapsed. */
export function resolveLegacyWorkspaceCreateStatus(raw: unknown): LegacyWorkspaceCreateStatusCrosswalk {
 if(typeof raw!=="string" || !raw.trim())
  return {kind:"MAPPED",initialStatus:"ACTIVE",legacyStatus:"ACTIVE",
   note:"Legacy create defaults to ACTIVE when status was omitted; active requires a verified mentor."};
 const status=raw.trim().toUpperCase().replace(/[ -]/g,"_");
 switch(status){
  case "PLANNED":
   return {kind:"MAPPED",initialStatus:"PLANNED",legacyStatus:status,note:"Native planned workspace."};
  case "ACTIVE":
   return {kind:"MAPPED",initialStatus:"ACTIVE",legacyStatus:status,note:"Native active workspace; mentor required."};
  case "IN_PROGRESS":
   return {kind:"MAPPED",initialStatus:"ACTIVE",legacyStatus:status,
    note:"Active lifecycle alias only; carry phase/progress separately to avoid information loss."};
  case "READY":
  case "BLOCKED":
  case "ARCHIVED":
   return {kind:"REQUIRES_MIGRATION",legacyStatus:status,
    reason:"Legacy status cannot be represented by vNext's create-time PLANNED/ACTIVE enum without losing state."};
  default:
   return {kind:"INVALID",reason:"Unrecognized legacy workspace status."};
 }
}
