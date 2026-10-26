import "server-only";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  collegeMemberships,
  colleges,
  placementApplicationNotes,
  placementApplicationScreenings,
  placementApplications,
  placementCompanyRelationships,
  placementJobs,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import { hasActiveRecruiter, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import {recruiterOwnJobPredicate} from "./recruiter-job-ownership";
import { PlacementsServiceError } from "./errors";
import {
  APPLICANT_NOTE_VISIBLE_LIMIT,
  applicantNoteInputSchema,
  isApplicantNoteStale,
  projectApplicantNotes,
  type ApplicantNoteSide,
  type ApplicantNotesSnapshot,
} from "./applicant-notes-model";
import {
  requireTpoJobActor,
  requireTpoJobCollege,
  type TpoJobTx,
} from "./tpo-job-write-base";
import { placementApplicationIdSchema, placementJobIdSchema } from "./validation";

type Db = ReturnType<typeof getDb>;
type Reader = Db | TpoJobTx;

type NoteScope = {
  side: ApplicantNoteSide;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  collegeId: string;
  companyId: string | null;
  relationshipId: string;
};

function notFound(): never {
  // Foreign, unshared and nonexistent applications are indistinguishable.
  throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
}

async function resolveTpoScope(
  reader: Reader,
  collegeId: string,
  jobId: string,
  applicationId: string,
): Promise<NoteScope> {
  const [row] = await reader
    .select({
      jobTitle: placementJobs.title,
      relationshipId: placementJobs.companyRelationshipId,
    })
    .from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(
      and(
        eq(placementApplications.id, applicationId),
        eq(placementJobs.id, jobId),
        eq(placementJobs.collegeId, collegeId),
      ),
    )
    .limit(1);
  if (!row) notFound();
  return {
    side: "TPO",
    applicationId,
    jobId,
    jobTitle: row.jobTitle,
    collegeId,
    companyId: null,
    relationshipId: row.relationshipId,
  };
}

/** Recruiters reach only company-shared (shortlisted, active) applicants of their own company. */
async function resolveRecruiterScope(
  reader: Reader,
  context: RequestContext,
  jobId: string,
  applicationId: string,
): Promise<NoteScope> {
  if (!hasActiveRecruiter(context) || !context.recruiter) notFound();
  const [row] = await reader
    .select({
      jobTitle: placementJobs.title,
      jobStatus: placementJobs.status,
      collegeId: placementJobs.collegeId,
      relationshipId: placementCompanyRelationships.id,
      companyId: placementCompanyRelationships.companyId,
    })
    .from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .innerJoin(
      placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementJobs.companyRelationshipId),
    )
    .innerJoin(
      placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id),
    )
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, placementApplications.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(
      and(
        eq(placementApplications.id, applicationId),
        eq(placementJobs.id, jobId),
        recruiterOwnJobPredicate(context.user.id),
        eq(placementApplications.status, "SUBMITTED"),
        eq(placementApplicationScreenings.status, "SHORTLISTED"),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(collegeMemberships.collegeId, placementJobs.collegeId),
        eq(users.platformStatus, "ACTIVE"),
        eq(placementCompanyRelationships.collegeId, placementJobs.collegeId),
      ),
    )
    .limit(1);
  if (
    !row ||
    (row.jobStatus !== "PUBLISHED" && row.jobStatus !== "CLOSED") ||
    context.recruiter.companyId !== row.companyId ||
    !can(context, "placements.recruiter.read", {
      collegeId: row.collegeId,
      placementCompanyRelationshipId: row.relationshipId,
    })
  ) {
    notFound();
  }
  return {
    side: "RECRUITER",
    applicationId,
    jobId,
    jobTitle: row.jobTitle,
    collegeId: row.collegeId,
    companyId: row.companyId,
    relationshipId: row.relationshipId,
  };
}

function audienceFilter(scope: NoteScope) {
  return and(
    eq(placementApplicationNotes.applicationId, scope.applicationId),
    eq(placementApplicationNotes.side, scope.side),
    scope.companyId ? eq(placementApplicationNotes.companyId, scope.companyId) : undefined,
  );
}

async function readNotes(
  reader: Reader,
  scope: NoteScope,
  viewerUserId: string,
): Promise<ApplicantNotesSnapshot> {
  const where = audienceFilter(scope);
  const [rows, tally, latest] = await Promise.all([
    reader
      .select({
        id: placementApplicationNotes.id,
        authorUserId: placementApplicationNotes.authorUserId,
        authorName: users.displayName,
        body: placementApplicationNotes.body,
        createdAt: placementApplicationNotes.createdAt,
      })
      .from(placementApplicationNotes)
      .innerJoin(users, eq(users.id, placementApplicationNotes.authorUserId))
      .where(where)
      .orderBy(desc(placementApplicationNotes.createdAt), desc(placementApplicationNotes.id))
      .limit(APPLICANT_NOTE_VISIBLE_LIMIT),
    reader.select({ total: count() }).from(placementApplicationNotes).where(where),
    reader
      .select({ id: placementApplicationNotes.id })
      .from(placementApplicationNotes)
      .where(where)
      .orderBy(desc(placementApplicationNotes.createdAt), desc(placementApplicationNotes.id))
      .limit(1),
  ]);
  return projectApplicantNotes(rows, tally[0]?.total ?? 0, latest[0]?.id ?? null, viewerUserId);
}

export async function listTpoApplicantNotes(
  context: RequestContext,
  rawJobId: unknown,
  rawApplicationId: unknown,
) {
  const collegeId = await requireTpoJobCollege(context);
  const jobId = placementJobIdSchema.parse(rawJobId);
  const applicationId = placementApplicationIdSchema.parse(rawApplicationId);
  // A session's TPO claim is not enough: keep the persisted actor's
  // SHARE lock until the private notes snapshot is fully read. Revocation
  // cannot race a read between an authorization check and the final query.
  return getDb().transaction(async (tx) => {
    await requireTpoJobActor(tx, context);
    const scope = await resolveTpoScope(tx, collegeId, jobId, applicationId);
    return readNotes(tx, scope, context.user.id);
  });
}

export async function listRecruiterApplicantNotes(
  context: RequestContext,
  rawJobId: unknown,
  rawApplicationId: unknown,
) {
  const jobId = placementJobIdSchema.parse(rawJobId);
  const applicationId = placementApplicationIdSchema.parse(rawApplicationId);
  const db = getDb();
  const scope = await resolveRecruiterScope(db, context, jobId, applicationId);
  return readNotes(db, scope, context.user.id);
}

/** Live recruiter authority inside the write transaction, not the request snapshot. */
async function requireLiveRecruiter(tx: TpoJobTx, context: RequestContext, scope: NoteScope) {
  const [live] = await tx
    .select({ userId: placementRecruiterProfiles.userId })
    .from(placementRecruiterProfiles)
    .innerJoin(users, eq(users.id, placementRecruiterProfiles.userId))
    .innerJoin(
      placementRecruiterCollegeGrants,
      eq(placementRecruiterCollegeGrants.recruiterUserId, placementRecruiterProfiles.userId),
    )
    .where(
      and(
        eq(placementRecruiterProfiles.userId, context.user.id),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementRecruiterProfiles.companyId, scope.companyId ?? ""),
        eq(users.platformStatus, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.verificationStatus, "VERIFIED"),
        gt(placementRecruiterCollegeGrants.validUntil, sql`clock_timestamp()`),
        sql<boolean>`'DRIVES' = ANY(${placementRecruiterCollegeGrants.capabilities})`,
        eq(placementRecruiterCollegeGrants.companyRelationshipId, scope.relationshipId),
      ),
    )
    .limit(1);
  if (!live) throw new AuthorizationError("placements.recruiter.note");
}

async function appendNote(
  context: RequestContext,
  side: ApplicantNoteSide,
  jobId: string,
  applicationId: string,
  raw: unknown,
  tpoCollegeId: string | null,
) {
  const input = applicantNoteInputSchema.parse(raw);
  return getDb().transaction(async (tx) => {
    let scope: NoteScope;
    let actorMembershipId: string | null = null;
    if (side === "TPO") {
      await requireTpoJobActor(tx, context);
      actorMembershipId = context.membership?.id ?? null;
      scope = await resolveTpoScope(tx, tpoCollegeId ?? "", jobId, applicationId);
    } else {
      scope = await resolveRecruiterScope(tx, context, jobId, applicationId);
      if (
        !can(context, "placements.recruiter.note", {
          collegeId: scope.collegeId,
          placementCompanyRelationshipId: scope.relationshipId,
        })
      ) {
        throw new AuthorizationError("placements.recruiter.note");
      }
      await requireLiveRecruiter(tx, context, scope);
    }
    // Serialize writers for this application so the stale-token check is exact.
    await tx
      .select({ id: placementApplications.id })
      .from(placementApplications)
      .where(eq(placementApplications.id, applicationId))
      .for("update");
    const [latest] = await tx
      .select({ id: placementApplicationNotes.id })
      .from(placementApplicationNotes)
      .where(audienceFilter(scope))
      .orderBy(desc(placementApplicationNotes.createdAt), desc(placementApplicationNotes.id))
      .limit(1);
    if (isApplicantNoteStale(latest?.id ?? null, input.expectedLatestNoteId)) {
      throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOTE_STALE");
    }
    const [saved] = await tx
      .insert(placementApplicationNotes)
      .values({
        applicationId,
        side,
        companyId: scope.companyId,
        authorUserId: context.user.id,
        body: input.body,
      })
      .returning({ id: placementApplicationNotes.id });
    if (!saved) throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOTE_STALE");
    const [college] = await tx
      .select({ organizationId: colleges.organizationId })
      .from(colleges)
      .where(eq(colleges.id, scope.collegeId))
      .limit(1);
    // The audit records that a note exists and who wrote it, never its text.
    await tx.insert(activityEvents).values({
      organizationId: college?.organizationId ?? null,
      collegeId: scope.collegeId,
      actorUserId: context.user.id,
      actorMembershipId,
      module: "PLACEMENTS",
      eventType: "PLACEMENTS_APPLICANT_NOTE_ADDED",
      subjectType: "placement_application",
      subjectId: applicationId,
      summary: (side === "TPO" ? "TPO" : "Recruiter") + " added a private note on an applicant of " + scope.jobTitle,
      metadata: { noteId: saved.id, side, jobId, length: input.body.length },
      occurredAt: new Date(),
    });
    return { id: saved.id, snapshot: await readNotes(tx, scope, context.user.id) };
  });
}

export async function addTpoApplicantNote(
  context: RequestContext,
  rawJobId: unknown,
  rawApplicationId: unknown,
  raw: unknown,
) {
  const collegeId = await requireTpoJobCollege(context);
  return appendNote(
    context,
    "TPO",
    placementJobIdSchema.parse(rawJobId),
    placementApplicationIdSchema.parse(rawApplicationId),
    raw,
    collegeId,
  );
}

export async function addRecruiterApplicantNote(
  context: RequestContext,
  rawJobId: unknown,
  rawApplicationId: unknown,
  raw: unknown,
) {
  return appendNote(
    context,
    "RECRUITER",
    placementJobIdSchema.parse(rawJobId),
    placementApplicationIdSchema.parse(rawApplicationId),
    raw,
    null,
  );
}
