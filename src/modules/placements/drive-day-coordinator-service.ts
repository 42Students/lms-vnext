import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  learnerProfiles,
  membershipRoles,
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementDriveDayCoordinatorAssignments,
  placementJobRoleOptions,
  placementJobRounds,
  placementJobs,
  placementRoundAttendance,
  placementRoundResults,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { coordinatorRoundOnDutyDate } from "./drive-day-coordinator-policy";
import {
  placementDriveDayAttendanceInputSchema,
  placementDriveDayCoordinatorInputSchema,
  placementJobIdSchema,
  placementRoundIdSchema,
  type PlacementDriveDayAttendanceInput,
  type PlacementDriveDayCoordinatorInput,
} from "./validation";

/** Both coordinator assignment and check-in compare the same IST civil day. */
export function dateInIndia(
  now: Date = new Date(),
) {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

async function loadJob(jobId: string) {
  const [row] = await getDb()
    .select({
      job: placementJobs,
      company: placementCompanies,
    })
    .from(placementJobs)
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  return row;
}

/**
 * An assigned learner can serve as a Drive Day coordinator even if the
 * placement eligibility grid says INELIGIBLE, but forged or suspended
 * membership context can never grant student roster access.
 */
async function hasActiveCoordinatorIdentity(context: RequestContext) {
  const membership = context.membership;
  if (!membership ||
      !hasMembershipRole(context, "LEARNER") ||
      context.user.platformStatus !== "ACTIVE") return false;
  const [member] = await getDb().select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(and(
      eq(collegeMemberships.id, membership.id),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    )).limit(1);
  return Boolean(member);
}

export async function hasStudentCoordinatorAssignmentToday(
  context: RequestContext,
  now: Date = new Date(),
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    return false;
  }

  if (!(await hasActiveCoordinatorIdentity(context))) return false;

  // Coordinator access is a limited exception to learner eligibility, NOT an
  // exception to the college-wide paid Placements module switch.
  if (!(await resolveOptionalModuleAccess(context)).placements.enabled) {
    return false;
  }

  const rounds = await getDb()
    .select({
      scheduledAt: placementJobRounds.scheduledAt,
      roundStatus: placementJobRounds.status,
    })
    .from(
      placementDriveDayCoordinatorAssignments,
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementDriveDayCoordinatorAssignments.jobId,
      ),
    )
    .innerJoin(
      placementJobRounds,
      eq(
        placementJobRounds.jobId,
        placementJobs.id,
      ),
    )
    .where(
      and(
        eq(
          placementDriveDayCoordinatorAssignments.learnerMembershipId,
          context.membership.id,
        ),
        eq(
          placementDriveDayCoordinatorAssignments.collegeId,
          context.membership.collegeId,
        ),
        eq(placementJobs.collegeId, context.membership.collegeId),
        eq(
          placementDriveDayCoordinatorAssignments.onDate,
          dateInIndia(now),
        ),
        eq(placementJobs.status, "PUBLISHED"),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
      ),
    )
;

  return rounds.some(round => coordinatorRoundOnDutyDate({
    scheduledAt: round.scheduledAt,
    roundStatus: round.roundStatus,
    dutyDate: dateInIndia(now),
  }));
}

export async function listDriveDayCoordinators(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const { job } = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select({
      id:
        placementDriveDayCoordinatorAssignments.id,
      learnerMembershipId:
        placementDriveDayCoordinatorAssignments.learnerMembershipId,
      onDate:
        placementDriveDayCoordinatorAssignments.onDate,
      displayName: users.displayName,
      email: users.email,
      rollNumber: learnerProfiles.rollNumber,
      createdAt:
        placementDriveDayCoordinatorAssignments.createdAt,
    })
    .from(
      placementDriveDayCoordinatorAssignments,
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementDriveDayCoordinatorAssignments.learnerMembershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .leftJoin(
      learnerProfiles,
      eq(
        learnerProfiles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      eq(
        placementDriveDayCoordinatorAssignments.jobId,
        jobId,
      ),
    )
    .orderBy(
      asc(
        placementDriveDayCoordinatorAssignments.onDate,
      ),
      asc(users.displayName),
    );
}

export async function assignDriveDayCoordinator(
  context: RequestContext,
  jobIdInput: string,
  input: PlacementDriveDayCoordinatorInput,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const parsed = placementDriveDayCoordinatorInputSchema.parse(input);
  const { job } = await loadJob(jobId);
  await requirePlacementManageScope(context, job.collegeId);

  // Both learner Apply and coordinator Assign lock this SAME job row before
  // testing for the opposite role. Without a shared lock, two independent
  // read-before-write checks can each pass and commit incompatible roles.
  return getDb().transaction(async (tx) => {
    const [lockedJob] = await tx.select({
      id: placementJobs.id,
    }).from(placementJobs)
      .where(and(
        eq(placementJobs.id, jobId),
        eq(placementJobs.collegeId, job.collegeId),
      ))
      .for("update").limit(1);
    if (!lockedJob) {
      throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    }

    const [learner] = await tx.select({
      membershipId: collegeMemberships.id,
    }).from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "LEARNER"),
      ))
      .where(and(
        eq(collegeMemberships.id, parsed.learnerMembershipId),
        eq(collegeMemberships.collegeId, job.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      )).limit(1);
    if (!learner) {
      throw new PlacementsServiceError("PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND");
    }

    const [application] = await tx.select({
      id: placementApplications.id,
    }).from(placementApplications)
      .where(and(
        eq(placementApplications.jobId, jobId),
        eq(placementApplications.membershipId, learner.membershipId),
      )).limit(1);
    if (application) {
      throw new PlacementsServiceError("PLACEMENT_COORDINATOR_APPLICANT_CONFLICT");
    }

    const [created] = await tx.insert(placementDriveDayCoordinatorAssignments)
      .values({
        collegeId: job.collegeId,
        jobId,
        learnerMembershipId: learner.membershipId,
        onDate: parsed.onDate,
        createdByUserId: context.user.id,
      }).onConflictDoNothing()
      .returning({ id: placementDriveDayCoordinatorAssignments.id });
    if (created) return created;

    const [existing] = await tx.select({
      id: placementDriveDayCoordinatorAssignments.id,
    }).from(placementDriveDayCoordinatorAssignments)
      .where(and(
        eq(placementDriveDayCoordinatorAssignments.jobId, jobId),
        eq(placementDriveDayCoordinatorAssignments.collegeId, job.collegeId),
        eq(placementDriveDayCoordinatorAssignments.learnerMembershipId, learner.membershipId),
        eq(placementDriveDayCoordinatorAssignments.onDate, parsed.onDate),
      )).limit(1);
    if (!existing) {
      throw new PlacementsServiceError("PLACEMENT_COORDINATOR_ASSIGNMENT_NOT_FOUND");
    }
    return existing;
  });
}

export async function removeDriveDayCoordinator(
  context: RequestContext,
  jobIdInput: string,
  assignmentId: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
  const { job } = await loadJob(jobId);
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  const [removed] = await getDb()
    .delete(
      placementDriveDayCoordinatorAssignments,
    )
    .where(
      and(
        eq(
          placementDriveDayCoordinatorAssignments.id,
          assignmentId,
        ),
        eq(
          placementDriveDayCoordinatorAssignments.jobId,
          jobId,
        ),
        eq(
          placementDriveDayCoordinatorAssignments.collegeId,
          job.collegeId,
        ),
      ),
    )
    .returning({
      id:
        placementDriveDayCoordinatorAssignments.id,
    });

  if (!removed) {
    throw new PlacementsServiceError(
      "PLACEMENT_COORDINATOR_ASSIGNMENT_NOT_FOUND",
    );
  }
  return removed;
}

export async function listMyDriveDayRounds(
  context: RequestContext,
  now: Date = new Date(),
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    context.user.platformStatus !== "ACTIVE"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_DRIVE_DAY_ACCESS_DENIED",
    );
  }

  if (!(await hasActiveCoordinatorIdentity(context))) {
    throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
  }

  if (!(await resolveOptionalModuleAccess(context)).placements.enabled) {
    throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
  }

  const rows = await getDb()
    .select({
      roundId: placementJobRounds.id,
      roundName: placementJobRounds.name,
      roundKind: placementJobRounds.kind,
      roundStatus: placementJobRounds.status,
      startsAt: placementJobRounds.scheduledAt,
      timezone: placementJobRounds.timezone,
      venue: placementJobRounds.venue,
      jobId: placementJobs.id,
      jobTitle: placementJobs.title,
      company: placementCompanies.name,
    })
    .from(
      placementDriveDayCoordinatorAssignments,
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementDriveDayCoordinatorAssignments.jobId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .innerJoin(
      placementJobRounds,
      eq(
        placementJobRounds.jobId,
        placementJobs.id,
      ),
    )
    .where(
      and(
        eq(
          placementDriveDayCoordinatorAssignments.learnerMembershipId,
          context.membership.id,
        ),
        eq(
          placementDriveDayCoordinatorAssignments.collegeId,
          context.membership.collegeId,
        ),
        eq(placementJobs.collegeId, context.membership.collegeId),
        eq(
          placementDriveDayCoordinatorAssignments.onDate,
          dateInIndia(now),
        ),
        eq(placementJobs.status, "PUBLISHED"),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
      ),
    )
    .orderBy(
      asc(placementJobRounds.sequence),
      asc(placementJobRounds.scheduledAt),
    );
  // A coordinator assigned today must not see tomorrow's interviews or a
  // previous day's applicant roster from the same drive.
  return rows.filter(row => coordinatorRoundOnDutyDate({
    scheduledAt: row.startsAt,
    roundStatus: row.roundStatus,
    dutyDate: dateInIndia(now),
  }));
}

async function loadRoundAndAccess(
  context: RequestContext,
  roundId: string,
  now: Date,
) {
  const [row] = await getDb()
    .select({
      round: placementJobRounds,
      job: placementJobs,
      company: placementCompanies,
    })
    .from(placementJobRounds)
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementJobRounds.jobId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      eq(placementJobRounds.id, roundId),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_FOUND",
    );
  }

  if (
    context.membership &&
    hasMembershipRole(context, "LEARNER") &&
    !hasMembershipRole(context, "TPO") &&
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    if (!coordinatorRoundOnDutyDate({
      scheduledAt: row.round.scheduledAt,
      roundStatus: row.round.status,
      dutyDate: dateInIndia(now),
    })) {
      throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
    }
    if (!(await hasActiveCoordinatorIdentity(context))) {
      throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
    }
    if (
      row.job.collegeId !== context.membership.collegeId ||
      !(await resolveOptionalModuleAccess(context)).placements.enabled
    ) {
      throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
    }
    const [assignment] = await getDb()
      .select({
        id:
          placementDriveDayCoordinatorAssignments.id,
      })
      .from(
        placementDriveDayCoordinatorAssignments,
      )
      .where(
        and(
          eq(
            placementDriveDayCoordinatorAssignments.jobId,
            row.job.id,
          ),
          eq(
            placementDriveDayCoordinatorAssignments.learnerMembershipId,
            context.membership.id,
          ),
          eq(
            placementDriveDayCoordinatorAssignments.collegeId,
            context.membership.collegeId,
          ),
          eq(
            placementDriveDayCoordinatorAssignments.onDate,
            dateInIndia(now),
          ),
        ),
      )
      .limit(1);

    const [ownApplication] = await getDb()
      .select({ id: placementApplications.id })
      .from(placementApplications)
      .where(
        and(
          eq(
            placementApplications.jobId,
            row.job.id,
          ),
          eq(
            placementApplications.membershipId,
            context.membership.id,
          ),
        ),
      )
      .limit(1);

    if (
      !assignment ||
      ownApplication ||
      row.job.status !== "PUBLISHED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_DRIVE_DAY_ACCESS_DENIED",
      );
    }

    return { ...row, fullAccess: false };
  }

  await requirePlacementManageScope(
    context,
    row.job.collegeId,
  );
  return { ...row, fullAccess: true };
}

function resultKey(
  roundId: string,
  applicationId: string,
) {
  return `${roundId}:${applicationId}`;
}

export async function getDriveDayRoster(
  context: RequestContext,
  roundIdInput: string,
  now: Date = new Date(),
) {
  const roundId =
    placementRoundIdSchema.parse(roundIdInput);
  const access = await loadRoundAndAccess(
    context,
    roundId,
    now,
  );
  const db = getDb();

  const [rounds, candidates, results, attendance] =
    await Promise.all([
      db
        .select()
        .from(placementJobRounds)
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              access.job.id,
            ),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        )
        .orderBy(
          asc(placementJobRounds.sequence),
        ),
      db
        .select({
          applicationId:
            placementApplications.id,
          membershipId:
            collegeMemberships.id,
          membershipStatus:
            collegeMemberships.status,
          displayName: users.displayName,
          email: users.email,
          phoneE164: users.phoneE164,
          rollNumber:
            learnerProfiles.rollNumber,
          roleTitle:
            placementJobRoleOptions.title,
        })
        .from(placementApplications)
        .innerJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
          ),
        )
        .innerJoin(
          placementJobRoleOptions,
          eq(
            placementJobRoleOptions.id,
            placementApplications.roleOptionId,
          ),
        )
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            placementApplications.membershipId,
          ),
        )
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .leftJoin(
          learnerProfiles,
          eq(
            learnerProfiles.membershipId,
            collegeMemberships.id,
          ),
        )
        .where(
          and(
            eq(
              placementApplications.jobId,
              access.job.id,
            ),
            eq(collegeMemberships.collegeId, access.job.collegeId),
            eq(placementJobRoleOptions.jobId, access.job.id),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(
              placementApplicationScreenings.status,
              "SHORTLISTED",
            ),
          ),
        ),
      db
        .select({
          roundId:
            placementRoundResults.roundId,
          applicationId:
            placementRoundResults.applicationId,
          status:
            placementRoundResults.status,
          outcome:
            placementRoundResults.outcome,
        })
        .from(placementRoundResults)
        .innerJoin(
          placementJobRounds,
          eq(
            placementJobRounds.id,
            placementRoundResults.roundId,
          ),
        )
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              access.job.id,
            ),
            ne(
              placementRoundResults.status,
              "SUPERSEDED",
            ),
          ),
        ),
      db
        .select()
        .from(placementRoundAttendance)
        .where(
          eq(
            placementRoundAttendance.roundId,
            roundId,
          ),
        ),
    ]);

  const targetIndex = rounds.findIndex(
    (round) => round.id === roundId,
  );
  if (targetIndex < 0) {
    throw new PlacementsServiceError(
      "PLACEMENT_ROUND_NOT_FOUND",
    );
  }

  const priorEvaluative = rounds
    .slice(0, targetIndex)
    .filter((round) => round.kind !== "TALK");
  const resultMap = new Map(
    results.map((result) => [
      resultKey(
        result.roundId,
        result.applicationId,
      ),
      result,
    ]),
  );
  const attendanceMap = new Map(
    attendance.map((item) => [
      item.applicationId,
      item,
    ]),
  );

  const students = candidates
    .filter(
      (candidate) =>
        candidate.membershipStatus ===
          "ACTIVE" &&
        priorEvaluative.every((round) => {
          const result = resultMap.get(
            resultKey(
              round.id,
              candidate.applicationId,
            ),
          );
          return (
            result?.status === "APPLIED" &&
            result.outcome === "PASS"
          );
        }),
    )
    .map((candidate) => {
      const mark = attendanceMap.get(
        candidate.applicationId,
      );
      return {
        applicationId:
          candidate.applicationId,
        membershipId:
          candidate.membershipId,
        displayName:
          candidate.displayName ??
          "Learner",
        rollNumber: candidate.rollNumber,
        roleTitle: candidate.roleTitle,
        email: access.fullAccess
          ? candidate.email
          : null,
        phoneE164: access.fullAccess
          ? candidate.phoneE164
          : null,
        attendance:
          mark?.status ?? "WAITING",
        room: mark?.room ?? null,
      roomDisplay:mark?.room?.trim()||access.round.venue?.trim()||"Room not assigned",
      };
    })
    .sort((a, b) =>
      (a.rollNumber ?? a.displayName).localeCompare(
        b.rollNumber ?? b.displayName,
      ),
    );

  return {
    access: {
      fullAccess: access.fullAccess,
      coordinator:
        !access.fullAccess,
    },
    round: {
      id: access.round.id,
      name: access.round.name,
      kind: access.round.kind,
      status: access.round.status,
      scheduledAt:
        access.round.scheduledAt,
      timezone: access.round.timezone,
      venue: access.round.venue,
      assignedRoom:students.find(student=>student.room?.trim())?.room??null,
      roomDisplay:students.find(student=>student.room?.trim())?.room??access.round.venue??"Room not assigned",
      jobId: access.job.id,
      jobTitle: access.job.title,
      company: access.company.name,
    },
    students,
  };
}

export async function markDriveDayAttendance(
  context: RequestContext,
  roundIdInput: string,
  input: PlacementDriveDayAttendanceInput,
  now: Date = new Date(),
) {
  const roundId =
    placementRoundIdSchema.parse(roundIdInput);
  const parsed =
    placementDriveDayAttendanceInputSchema.parse(
      input,
    );
  const roster = await getDriveDayRoster(
    context,
    roundId,
    now,
  );

  if (
    !roster.access.fullAccess &&
    (
      !["PRESENT", "ABSENT"].includes(
        parsed.status,
      ) ||
      parsed.room != null
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_DRIVE_DAY_ATTENDANCE_FORBIDDEN",
    );
  }

  if (
    !roster.students.some(
      (student) =>
        student.applicationId ===
        parsed.applicationId,
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    // The roster read is only a candidate projection; authorization must be
    // rechecked with database row locks before an attendance write.
    if (!roster.access.fullAccess) {
      const member = context.membership;
      if (!member) {
        throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
      }
      const [assignment] = await tx.select({
        id: placementDriveDayCoordinatorAssignments.id,
      }).from(placementDriveDayCoordinatorAssignments)
        .where(and(
          eq(placementDriveDayCoordinatorAssignments.jobId, roster.round.jobId),
          eq(placementDriveDayCoordinatorAssignments.collegeId, member.collegeId),
          eq(placementDriveDayCoordinatorAssignments.learnerMembershipId, member.id),
          eq(placementDriveDayCoordinatorAssignments.onDate, dateInIndia(now)),
        )).for("share").limit(1);
      const [round] = await tx.select({
        scheduledAt: placementJobRounds.scheduledAt,
        status: placementJobRounds.status,
      }).from(placementJobRounds)
        .where(and(
          eq(placementJobRounds.id, roundId),
          eq(placementJobRounds.jobId, roster.round.jobId),
        )).for("share").limit(1);
      if (!assignment || !round || !coordinatorRoundOnDutyDate({
        scheduledAt: round.scheduledAt,
        roundStatus: round.status,
        dutyDate: dateInIndia(now),
      })) {
        throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
      }
    }

    const [candidate] = await tx.select({
      id: placementApplications.id,
    }).from(placementApplications)
      .innerJoin(placementApplicationScreenings, eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
      ))
      .where(and(
        eq(placementApplications.id, parsed.applicationId),
        eq(placementApplications.jobId, roster.round.jobId),
        eq(placementApplications.status, "SUBMITTED"),
        eq(placementApplicationScreenings.status, "SHORTLISTED"),
      )).for("share").limit(1);
    if (!candidate) {
      throw new PlacementsServiceError("PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND");
    }

    // ON CONFLICT makes two simultaneous check-ins converge to one durable
    // row rather than a unique-constraint error from SELECT -> INSERT.
    const [written] = await tx.insert(placementRoundAttendance).values({
      roundId,
      applicationId: parsed.applicationId,
      status: parsed.status,
      room: parsed.room ?? null,
      markedByUserId: context.user.id,
      markedAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [
        placementRoundAttendance.roundId,
        placementRoundAttendance.applicationId,
      ],
      set: {
        status: parsed.status,
        room: parsed.room ?? null,
        markedByUserId: context.user.id,
        markedAt: now,
        updatedAt: now,
      },
    }).returning();
    return written;
  });
}
