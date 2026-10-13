import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  collegeMemberships,
  departments,
  learnerProfiles,
  learnerProgramEnrollments,
  placementApplications,
  placementApplicationScreenings,
  placementJobRounds,
  placementJobs,
  placementRoundResults,
  programs,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";

import {
  buildPlacementApplicantCsvRows,
  PLACEMENT_APPLICANTS_CSV_HEADINGS,
} from "./applicant-export-model";
import { PlacementsServiceError } from "./errors";
import { placementReportCsv } from "./report-model";
import { requirePlacementManageScope } from "./scope";
import { placementJobIdSchema } from "./validation";

/**
 * Export the persisted applicants of exactly one placement job.
 *
 * Authorization:
 * - Resolve the job from its persisted ID.
 * - Authorize placements.manage against that job's college.
 * - Independently constrain applicant memberships and branch
 *   departments to the same college.
 *
 * The export includes submitted and withdrawn applications.
 * Screening status is taken from the current screening record.
 * Latest round outcome means the highest-sequence non-cancelled
 * round having an APPLIED result for that application.
 *
 * Staged/superseded results are not exported as final outcomes.
 * Missing screening, branch, profile and applied-round data remain
 * blank rather than implying an outcome.
 *
 * No batch-registration or external-offer tables are queried.
 */
export async function exportPlacementJobApplicantsCsv(
  context: RequestContext,
  jobIdInput: string,
): Promise<string> {
  const jobId = placementJobIdSchema.parse(
    jobIdInput,
  );

  const db = getDb();

  const [job] = await db
    .select({
      id: placementJobs.id,
      collegeId: placementJobs.collegeId,
    })
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }

  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  const applications = await db
    .select({
      applicationId: placementApplications.id,
      membershipId:
        placementApplications.membershipId,
      studentName: users.displayName,
      rollNumber: learnerProfiles.rollNumber,
      applicationStatus:
        placementApplications.status,
      screeningStatus:
        placementApplicationScreenings.status,
    })
    .from(placementApplications)
    .innerJoin(
      collegeMemberships,
      and(
        eq(
          collegeMemberships.id,
          placementApplications.membershipId,
        ),
        eq(
          collegeMemberships.collegeId,
          job.collegeId,
        ),
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
    .leftJoin(
      placementApplicationScreenings,
      eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
      ),
    )
    .where(
      eq(
        placementApplications.jobId,
        job.id,
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(placementApplications.id),
    );

  if (applications.length === 0) {
    return placementReportCsv(
      PLACEMENT_APPLICANTS_CSV_HEADINGS,
      [],
    );
  }

  const membershipIds = [
    ...new Set(
      applications.map(
        (application) => application.membershipId,
      ),
    ),
  ];

  const applicationIds = applications.map(
    (application) => application.applicationId,
  );

  const [branches, appliedResults] =
    await Promise.all([
      db
        .select({
          membershipId:
            learnerProgramEnrollments.membershipId,
          branchName: departments.name,
          enrollmentStatus:
            learnerProgramEnrollments.status,
        })
        .from(learnerProgramEnrollments)
        .innerJoin(
          programs,
          eq(
            programs.id,
            learnerProgramEnrollments.programId,
          ),
        )
        .innerJoin(
          departments,
          and(
            eq(
              departments.id,
              programs.departmentId,
            ),
            eq(
              departments.collegeId,
              job.collegeId,
            ),
          ),
        )
        .where(
          inArray(
            learnerProgramEnrollments.membershipId,
            membershipIds,
          ),
        )
        .orderBy(
          desc(
            learnerProgramEnrollments.admittedAt,
          ),
          asc(learnerProgramEnrollments.id),
        ),

      db
        .select({
          applicationId:
            placementRoundResults.applicationId,
          roundId: placementJobRounds.id,
          sequence: placementJobRounds.sequence,
          outcome: placementRoundResults.outcome,
        })
        .from(placementRoundResults)
        .innerJoin(
          placementJobRounds,
          and(
            eq(
              placementJobRounds.id,
              placementRoundResults.roundId,
            ),
            eq(
              placementJobRounds.jobId,
              job.id,
            ),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        )
        .innerJoin(
          placementApplications,
          and(
            eq(
              placementApplications.id,
              placementRoundResults.applicationId,
            ),
            eq(
              placementApplications.jobId,
              job.id,
            ),
          ),
        )
        .innerJoin(
          collegeMemberships,
          and(
            eq(
              collegeMemberships.id,
              placementApplications.membershipId,
            ),
            eq(
              collegeMemberships.collegeId,
              job.collegeId,
            ),
          ),
        )
        .where(
          and(
            eq(
              placementRoundResults.status,
              "APPLIED",
            ),
            inArray(
              placementRoundResults.applicationId,
              applicationIds,
            ),
          ),
        ),
    ]);

  const rows = buildPlacementApplicantCsvRows({
    applications: applications.map((application) => ({
      ...application,
      studentName: application.studentName ?? "",
    })),
    branches,
    appliedResults,
  });

  /*
   * The shared reporting serializer quotes every cell and neutralizes
   * spreadsheet-formula prefixes in user-controlled values.
   */
  return placementReportCsv(
    PLACEMENT_APPLICANTS_CSV_HEADINGS,
    rows,
  );
}
