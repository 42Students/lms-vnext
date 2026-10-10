import {
  and,
  desc,
  eq,
  isNull,
  ne,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  colleges,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import {
  placementTpoMessages,
  placementTpoMessageThreads,
} from "@/db/schema/tpo-collaboration";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";

const collegeIdSchema = z.string().uuid();
const userIdSchema = z.string().uuid();
const jobIdSchema = z.string().uuid();
const threadIdSchema = z.string().uuid();
const bodySchema = z.string().trim().min(1).max(4000);

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export class TpoMessagingError extends Error {
  constructor(
    readonly code:
      | "TPO_MESSAGE_FORBIDDEN"
      | "TPO_MESSAGE_THREAD_NOT_FOUND"
      | "TPO_MESSAGE_RECRUITER_NOT_FOUND"
      | "TPO_MESSAGE_JOB_NOT_FOUND",
  ) {
    super(code);
    this.name = "TpoMessagingError";
  }
}

type MessagingActor = {
  type: "TPO" | "RECRUITER";
  userId: string;
  collegeId: string;
  recruiterUserId: string | null;
  companyRelationshipId: string | null;
};

async function loadActiveRecruiterGrant(
  db: Db | Tx,
  userId: string,
  collegeId: string,
  lock = false,
) {
  const query = db
    .select({
      recruiterUserId: placementRecruiterProfiles.userId,
      companyRelationshipId:
        placementRecruiterCollegeGrants.companyRelationshipId,
      collegeId: placementCompanyRelationships.collegeId,
      platformStatus: users.platformStatus,
      profileStatus: placementRecruiterProfiles.status,
      companyStatus: placementCompanies.status,
      relationshipStatus: placementCompanyRelationships.status,
      grantStatus: placementRecruiterCollegeGrants.status,
      collegeStatus: colleges.status,
    })
    .from(placementRecruiterProfiles)
    .innerJoin(
      users,
      eq(users.id, placementRecruiterProfiles.userId),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementRecruiterProfiles.companyId,
      ),
    )
    .innerJoin(
      placementRecruiterCollegeGrants,
      eq(
        placementRecruiterCollegeGrants.recruiterUserId,
        placementRecruiterProfiles.userId,
      ),
    )
    .innerJoin(
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementRecruiterCollegeGrants.companyRelationshipId,
      ),
    )
    .innerJoin(
      colleges,
      eq(colleges.id, placementCompanyRelationships.collegeId),
    )
    .where(
      and(
        eq(placementRecruiterProfiles.userId, userId),
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(users.platformStatus, "ACTIVE"),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
      ),
    );
  const [grant] = lock
    ? await query.for("share").limit(1)
    : await query.limit(1);
  return grant ?? null;
}

async function readActor(
  context: RequestContext,
  collegeIdInput: string,
): Promise<MessagingActor> {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  try {
    await requirePlacementManageScope(context, collegeId);
    return {
      type: "TPO",
      userId: context.user.id,
      collegeId,
      recruiterUserId: null,
      companyRelationshipId: null,
    };
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
  }

  const grant = await loadActiveRecruiterGrant(
    getDb(),
    context.user.id,
    collegeId,
  );
  if (!grant) {
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  }
  return {
    type: "RECRUITER",
    userId: context.user.id,
    collegeId,
    recruiterUserId: context.user.id,
    companyRelationshipId: grant.companyRelationshipId,
  };
}

async function mutationActor(
  tx: Tx,
  context: RequestContext,
  collegeIdInput: string,
): Promise<MessagingActor> {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const [college] = await tx
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .for("share")
    .limit(1);

  if (college?.status === "ACTIVE") {
    try {
      await assertPersistedPlatformPermission(
        tx,
        context,
        "placements.manage",
        {
          organizationId: college.organizationId,
          collegeId,
        },
      );
      return {
        type: "TPO",
        userId: context.user.id,
        collegeId,
        recruiterUserId: null,
        companyRelationshipId: null,
      };
    } catch (error) {
      if (!(error instanceof AuthorizationError)) throw error;
    }
  }

  const grant = await loadActiveRecruiterGrant(
    tx,
    context.user.id,
    collegeId,
    true,
  );
  if (!grant) {
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  }
  return {
    type: "RECRUITER",
    userId: context.user.id,
    collegeId,
    recruiterUserId: context.user.id,
    companyRelationshipId: grant.companyRelationshipId,
  };
}

async function assertRecruiterForCollege(
  db: Db | Tx,
  collegeId: string,
  recruiterUserIdInput: string,
  lock = false,
) {
  const recruiterUserId = userIdSchema.parse(recruiterUserIdInput);
  const grant = await loadActiveRecruiterGrant(
    db,
    recruiterUserId,
    collegeId,
    lock,
  );
  if (!grant) {
    throw new TpoMessagingError("TPO_MESSAGE_RECRUITER_NOT_FOUND");
  }
  return grant;
}

async function assertJobForThread(
  db: Db | Tx,
  collegeId: string,
  jobIdInput: string | null | undefined,
  companyRelationshipId?: string | null,
  lock = false,
) {
  if (!jobIdInput) return null;
  const jobId = jobIdSchema.parse(jobIdInput);
  const query = db
    .select({
      id: placementJobs.id,
      companyRelationshipId: placementJobs.companyRelationshipId,
    })
    .from(placementJobs)
    .where(
      and(
        eq(placementJobs.id, jobId),
        eq(placementJobs.collegeId, collegeId),
      ),
    );
  const [job] = lock
    ? await query.for("share").limit(1)
    : await query.limit(1);
  if (
    !job ||
    (companyRelationshipId &&
      job.companyRelationshipId !== companyRelationshipId)
  ) {
    throw new TpoMessagingError("TPO_MESSAGE_JOB_NOT_FOUND");
  }
  return job;
}

async function getOrCreateThread(
  db: Db | Tx,
  collegeId: string,
  recruiterUserId: string,
  jobId: string | null,
) {
  const where = jobId
    ? and(
        eq(placementTpoMessageThreads.collegeId, collegeId),
        eq(
          placementTpoMessageThreads.recruiterUserId,
          recruiterUserId,
        ),
        eq(placementTpoMessageThreads.jobId, jobId),
      )
    : and(
        eq(placementTpoMessageThreads.collegeId, collegeId),
        eq(
          placementTpoMessageThreads.recruiterUserId,
          recruiterUserId,
        ),
        isNull(placementTpoMessageThreads.jobId),
      );

  const [existing] = await db
    .select()
    .from(placementTpoMessageThreads)
    .where(where)
    .limit(1);
  if (existing) return existing;

  await db
    .insert(placementTpoMessageThreads)
    .values({ collegeId, recruiterUserId, jobId })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(placementTpoMessageThreads)
    .where(where)
    .limit(1);
  if (!created) {
    throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  }
  return created;
}

export async function openTpoMessageThread(
  context: RequestContext,
  input: {
    collegeId: string;
    recruiterUserId: string;
    jobId?: string | null;
  },
) {
  const actor = await readActor(context, input.collegeId);
  if (actor.type !== "TPO") {
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  }
  const recruiter = await assertRecruiterForCollege(
    getDb(),
    actor.collegeId,
    input.recruiterUserId,
  );
  const job = await assertJobForThread(
    getDb(),
    actor.collegeId,
    input.jobId,
    recruiter.companyRelationshipId,
  );
  return getDb().transaction(async (tx) => {
    const persisted = await mutationActor(tx, context, actor.collegeId);
    if (persisted.type !== "TPO") {
      throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
    }
    const lockedRecruiter = await assertRecruiterForCollege(
      tx,
      persisted.collegeId,
      recruiter.recruiterUserId,
      true,
    );
    const lockedJob = await assertJobForThread(
      tx,
      persisted.collegeId,
      job?.id ?? null,
      lockedRecruiter.companyRelationshipId,
      true,
    );
    return getOrCreateThread(
      tx,
      persisted.collegeId,
      lockedRecruiter.recruiterUserId,
      lockedJob?.id ?? null,
    );
  });
}

export async function openRecruiterMessageThread(
  context: RequestContext,
  input: { collegeId: string; jobId?: string | null },
) {
  const actor = await readActor(context, input.collegeId);
  if (actor.type !== "RECRUITER" || !actor.recruiterUserId) {
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  }
  const job = await assertJobForThread(
    getDb(),
    actor.collegeId,
    input.jobId,
    actor.companyRelationshipId,
  );
  return getDb().transaction(async (tx) => {
    const persisted = await mutationActor(tx, context, actor.collegeId);
    if (persisted.type !== "RECRUITER" || !persisted.recruiterUserId) {
      throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
    }
    const lockedJob = await assertJobForThread(
      tx,
      persisted.collegeId,
      job?.id ?? null,
      persisted.companyRelationshipId,
      true,
    );
    return getOrCreateThread(
      tx,
      persisted.collegeId,
      persisted.recruiterUserId,
      lockedJob?.id ?? null,
    );
  });
}

export async function listMessageThreads(
  context: RequestContext,
  collegeIdInput: string,
) {
  const actor = await readActor(context, collegeIdInput);
  const conditions = [
    eq(placementTpoMessageThreads.collegeId, actor.collegeId),
  ];
  if (actor.type === "RECRUITER") {
    conditions.push(
      eq(
        placementTpoMessageThreads.recruiterUserId,
        actor.userId,
      ),
    );
  }
  return getDb()
    .select()
    .from(placementTpoMessageThreads)
    .where(and(...conditions))
    .orderBy(
      desc(placementTpoMessageThreads.lastMessageAt),
      desc(placementTpoMessageThreads.createdAt),
    );
}

export async function listThreadMessages(
  context: RequestContext,
  threadIdInput: string,
) {
  const threadId = threadIdSchema.parse(threadIdInput);
  return getDb().transaction(async (tx) => {
    const [thread] = await tx
      .select()
      .from(placementTpoMessageThreads)
      .where(eq(placementTpoMessageThreads.id, threadId))
      .for("share")
      .limit(1);
    if (!thread) {
      throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    }
    const actor = await mutationActor(tx, context, thread.collegeId);
    if (
      actor.type === "RECRUITER" &&
      actor.userId !== thread.recruiterUserId
    ) {
      throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    }
    if (actor.type === "RECRUITER" && thread.jobId) {
      await assertJobForThread(
        tx,
        actor.collegeId,
        thread.jobId,
        actor.companyRelationshipId,
        true,
      );
    }
    if (actor.type === "TPO") {
      await assertRecruiterForCollege(
        tx,
        thread.collegeId,
        thread.recruiterUserId,
        true,
      );
    }

    await tx
      .update(placementTpoMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(placementTpoMessages.threadId, thread.id),
          ne(placementTpoMessages.senderType, actor.type),
          isNull(placementTpoMessages.readAt),
        ),
      );

    return tx
      .select()
      .from(placementTpoMessages)
      .where(eq(placementTpoMessages.threadId, thread.id))
      .orderBy(
        placementTpoMessages.createdAt,
        placementTpoMessages.id,
      );
  });
}

export async function sendThreadMessage(
  context: RequestContext,
  threadIdInput: string,
  bodyInput: string,
) {
  const body = bodySchema.parse(bodyInput);
  const threadId = threadIdSchema.parse(threadIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [thread] = await tx
      .select()
      .from(placementTpoMessageThreads)
      .where(eq(placementTpoMessageThreads.id, threadId))
      .for("update")
      .limit(1);
    if (!thread) {
      throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    }

    const actor = await mutationActor(tx, context, thread.collegeId);
    if (
      actor.type === "RECRUITER" &&
      actor.userId !== thread.recruiterUserId
    ) {
      throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    }
    if (actor.type === "RECRUITER" && thread.jobId) {
      await assertJobForThread(
        tx,
        actor.collegeId,
        thread.jobId,
        actor.companyRelationshipId,
        true,
      );
    }
    if (actor.type === "TPO") {
      await assertRecruiterForCollege(
        tx,
        thread.collegeId,
        thread.recruiterUserId,
        true,
      );
    }

    const now = new Date();
    const [message] = await tx
      .insert(placementTpoMessages)
      .values({
        threadId: thread.id,
        senderType: actor.type,
        senderUserId: actor.userId,
        body,
        createdAt: now,
      })
      .returning();
    await tx
      .update(placementTpoMessageThreads)
      .set({ lastMessageAt: now })
      .where(eq(placementTpoMessageThreads.id, thread.id));

    return message;
  });
}
