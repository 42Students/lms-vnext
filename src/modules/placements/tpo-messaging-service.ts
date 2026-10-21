import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  like,
  ne,
  sql,
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
import {hrConversationDetailPageWindow} from "./hr-conversation-detail-pagination-model";
import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
import {formatHrDriveProposal,hrDriveProposalSchema} from "./hr-drive-proposal-model";

const collegeIdSchema = z.string().uuid();
const userIdSchema = z.string().uuid();
const jobIdSchema = z.string().uuid();
const threadIdSchema = z.string().uuid();
const bodySchema = z.string().trim()
  .min(1, "Write a message first")
  .max(4000, "Keep a message under 4000 characters");

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
        // A grant's relationship must belong to the profile's own company.
        // Active flags and college scope alone cannot prevent a cross-company
        // grant row from authorizing recruiter message reads.
        eq(
          placementCompanyRelationships.companyId,
          placementRecruiterProfiles.companyId,
        ),
        eq(users.platformStatus, "ACTIVE"),
        eq(placementRecruiterProfiles.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
        eq(placementRecruiterCollegeGrants.verificationStatus, "VERIFIED"),
        gt(placementRecruiterCollegeGrants.validUntil, new Date()),
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
  const collegeId = collegeIdSchema.parse(input.collegeId);
  const jobId = input.jobId ? jobIdSchema.parse(input.jobId) : null;
  if (context.recruiter?.status !== "ACTIVE" ||
      context.recruiter.userId !== context.user.id)
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  // Never choose TPO permissions when a person holds both TPO and recruiter roles.
  // The persisted employer/college grant is authoritative within this transaction.
  return getDb().transaction(async tx => {
    const grant = await loadActiveRecruiterGrant(tx, context.user.id, collegeId, true);
    if (!grant) throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
    const job = await assertJobForThread(
      tx, collegeId, jobId, grant.companyRelationshipId, true,
    );
    return getOrCreateThread(tx, collegeId, context.user.id, job?.id ?? null);
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

    if(actor.type==="RECRUITER")await notifyTpoOfRecruiterMessage(tx,{
      collegeId:thread.collegeId,threadId:thread.id,messageId:message.id,
      senderUserId:actor.userId,at:now,
    });
    return message;
  });
}

/** Employer-only reply path: persisted exact recruiter ownership wins over any TPO role. */
export async function sendRecruiterThreadMessage(
 context: RequestContext, rawThreadId: unknown, rawBody: unknown,
) {
 const id = threadIdSchema.parse(rawThreadId);
 const body = bodySchema.parse(rawBody);
 if (context.recruiter?.status !== "ACTIVE" ||
     context.recruiter.userId !== context.user.id)
   throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
 return getDb().transaction(async tx => {
   const [thread] = await tx.select({
     id:placementTpoMessageThreads.id,collegeId:placementTpoMessageThreads.collegeId,
     recruiterUserId:placementTpoMessageThreads.recruiterUserId,
     jobId:placementTpoMessageThreads.jobId,
   }).from(placementTpoMessageThreads)
    .where(eq(placementTpoMessageThreads.id,id)).for("update").limit(1);
   if(!thread || thread.recruiterUserId !== context.user.id)
     throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
   const grant = await loadActiveRecruiterGrant(tx,context.user.id,thread.collegeId,true);
   if(!grant)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
   if(thread.jobId)await assertJobForThread(
     tx,thread.collegeId,thread.jobId,grant.companyRelationshipId,true,
   );
   const now=new Date();
   const [message]=await tx.insert(placementTpoMessages).values({
     threadId:thread.id,senderType:"RECRUITER",senderUserId:context.user.id,
     body,createdAt:now,
   }).returning({id:placementTpoMessages.id});
   if(!message)throw new Error("RECRUITER_MESSAGE_PERSISTENCE_FAILED");
   await tx.update(placementTpoMessageThreads).set({lastMessageAt:now})
    .where(eq(placementTpoMessageThreads.id,thread.id));
   await notifyTpoOfRecruiterMessage(tx,{
      collegeId:thread.collegeId,threadId:thread.id,messageId:message.id,
      senderUserId:context.user.id,at:now,
   });
   return {id:message.id,threadId:thread.id};
 });
}

/** Recruiter-only, read-only message history; opening a GET never marks messages read. */
export async function readRecruiterThreadMessages(
 context:RequestContext,threadIdInput:unknown,rawPage:unknown=1,
){
 const threadId=threadIdSchema.parse(threadIdInput);
 const page=z.coerce.number().int().min(1).max(10000).parse(rawPage);
 if(!context.recruiter||context.recruiter.status!=="ACTIVE" ||
    context.recruiter.userId!==context.user.id)
  throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
 return getDb().transaction(async tx=>{
  const [thread]=await tx.select({
    id:placementTpoMessageThreads.id,collegeId:placementTpoMessageThreads.collegeId,
    recruiterUserId:placementTpoMessageThreads.recruiterUserId,
    jobId:placementTpoMessageThreads.jobId,
  }).from(placementTpoMessageThreads)
   .where(eq(placementTpoMessageThreads.id,threadId)).for("share").limit(1);
  if(!thread||thread.recruiterUserId!==context.user.id)
   throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  // The account may also be TPO: recruiter reads must check recruiter grants
  // directly rather than routing through the TPO-first messaging actor resolver.
  const grant=await loadActiveRecruiterGrant(tx,context.user.id,thread.collegeId,true);
  if(!grant)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  if(thread.jobId)await assertJobForThread(
   tx,thread.collegeId,thread.jobId,grant.companyRelationshipId,true,
  );
  const [count]=await tx.select({total:sql<number>`count(*)::integer`})
   .from(placementTpoMessages).where(eq(placementTpoMessages.threadId,thread.id));
  const total=Number(count?.total??0);
  const [pending]=await tx.select({
   unread:sql<number>`count(*)::integer`,
  }).from(placementTpoMessages).where(and(
   eq(placementTpoMessages.threadId,thread.id),
   eq(placementTpoMessages.senderType,"TPO"),
   isNull(placementTpoMessages.readAt),
  ));
  const window=hrConversationDetailPageWindow(page,total);
  const descending=await tx.select({
    id:placementTpoMessages.id,senderType:placementTpoMessages.senderType,
    senderUserId:placementTpoMessages.senderUserId,
    body:placementTpoMessages.body,readAt:placementTpoMessages.readAt,
    createdAt:placementTpoMessages.createdAt,
  }).from(placementTpoMessages)
   .where(eq(placementTpoMessages.threadId,thread.id))
   .orderBy(desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id))
   .limit(40).offset(window.offset);
  const actors=[...new Set(descending.map(message=>message.senderUserId))];
  const senderRows=actors.length?await tx.select({
    id:users.id,displayName:users.displayName,
  }).from(users).where(inArray(users.id,actors)):[];
  const senderNames=new Map(senderRows.map(row=>[row.id,row.displayName]));
  return {thread,messages:descending.reverse().map(message=>({
    ...message,senderDisplayName:senderNames.get(message.senderUserId)??null,
  })),page:window.page,pages:window.pages,total,unread:Number(pending?.unread??0)};
 });
}

/**
 * Explicit recruiter acknowledgement. This operation never runs from a GET.
 * Revalidates the persisted employer grant before updating only incoming TPO messages.
 */
export async function acknowledgeRecruiterThread(
  context: RequestContext,
  threadIdInput: unknown,
) {
  const threadId = threadIdSchema.parse(threadIdInput);
  if (context.recruiter?.status !== "ACTIVE" ||
      context.recruiter.userId !== context.user.id)
    throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  return getDb().transaction(async (tx) => {
    const [thread] = await tx.select({
      id: placementTpoMessageThreads.id,
      collegeId: placementTpoMessageThreads.collegeId,
      recruiterUserId: placementTpoMessageThreads.recruiterUserId,
      jobId: placementTpoMessageThreads.jobId,
    }).from(placementTpoMessageThreads)
      .where(eq(placementTpoMessageThreads.id, threadId))
      .for("update").limit(1);
    if (!thread || thread.recruiterUserId !== context.user.id)
      throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    const grant = await loadActiveRecruiterGrant(tx, context.user.id, thread.collegeId, true);
    if (!grant) throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
    if (thread.jobId)
      await assertJobForThread(tx, thread.collegeId, thread.jobId, grant.companyRelationshipId, true);
    const rows = await tx.update(placementTpoMessages).set({readAt: new Date()})
      .where(and(
        eq(placementTpoMessages.threadId, thread.id),
        eq(placementTpoMessages.senderType, "TPO"),
        isNull(placementTpoMessages.readAt),
      )).returning({id: placementTpoMessages.id});
    return {acknowledged: rows.length};
  });
}

/** Atomic recruiter-only acknowledgement of at most 20 visible private threads. */
export const recruiterBulkAcknowledgeSchema = z.array(threadIdSchema).min(1).max(20)
  .refine(ids => new Set(ids).size === ids.length, "DUPLICATE_THREAD_IDS");

export async function acknowledgeRecruiterThreads(context:RequestContext,rawIds:unknown) {
 const ids=recruiterBulkAcknowledgeSchema.parse(rawIds);
 if(context.recruiter?.status!=="ACTIVE" || context.recruiter.userId!==context.user.id)
  throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
 return getDb().transaction(async tx=>{
  const threads=await tx.select({
   id:placementTpoMessageThreads.id,
   collegeId:placementTpoMessageThreads.collegeId,
   recruiterUserId:placementTpoMessageThreads.recruiterUserId,
   jobId:placementTpoMessageThreads.jobId,
  }).from(placementTpoMessageThreads)
   .where(inArray(placementTpoMessageThreads.id,ids))
   .orderBy(asc(placementTpoMessageThreads.id)).for("update");
  if(threads.length!==ids.length || threads.some(t=>t.recruiterUserId!==context.user.id))
   throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  for(const thread of threads) {
   const grant=await loadActiveRecruiterGrant(tx,context.user.id,thread.collegeId,true);
   if(!grant)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
   if(thread.jobId)await assertJobForThread(
    tx,thread.collegeId,thread.jobId,grant.companyRelationshipId,true,
   );
  }
  const changed=await tx.update(placementTpoMessages).set({readAt:new Date()})
   .where(and(
    inArray(placementTpoMessages.threadId,ids),
    eq(placementTpoMessages.senderType,"TPO"),
    isNull(placementTpoMessages.readAt),
   )).returning({id:placementTpoMessages.id});
  return {threads:threads.length,acknowledged:changed.length};
 });
}

/**
 * Persists a recruiter-authored proposal in a private placement-cell conversation.
 * This does NOT create or approve a placement drive or a structured approval request.
 * Repeated submissionId is replay-safe within the same recruiter/college thread.
 */
export async function sendRecruiterDriveProposal(context:RequestContext,raw:unknown){
 const input=hrDriveProposalSchema.parse(raw);
 const body=formatHrDriveProposal(input);
 if(context.recruiter?.status!=="ACTIVE" || context.recruiter.userId!==context.user.id)
  throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
 return getDb().transaction(async tx=>{
  const grant=await loadActiveRecruiterGrant(tx,context.user.id,input.collegeId,true);
  if(!grant)throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
  if(input.sourceJobId)await assertJobForThread(
   tx,input.collegeId,input.sourceJobId,grant.companyRelationshipId,true,
  );
  const thread=await getOrCreateThread(tx,input.collegeId,context.user.id,null);
  // Serializes retries (including concurrent tabs) against this exact thread.
  const [locked]=await tx.select({id:placementTpoMessageThreads.id})
   .from(placementTpoMessageThreads)
   .where(eq(placementTpoMessageThreads.id,thread.id)).for("update").limit(1);
  if(!locked)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  const prefix="Drive proposal for placement cell discussion — NOT a submitted approval request\n"+
   "Proposal reference: "+input.submissionId+"\n";
  const [existing]=await tx.select({
   id:placementTpoMessages.id,body:placementTpoMessages.body,
  }).from(placementTpoMessages).where(and(
   eq(placementTpoMessages.threadId,thread.id),
   eq(placementTpoMessages.senderType,"RECRUITER"),
   eq(placementTpoMessages.senderUserId,context.user.id),
   like(placementTpoMessages.body,prefix+"%"),
  )).limit(1);
  if(existing){
   if(existing.body!==body)throw new Error("DRIVE_PROPOSAL_STALE_SUBMISSION");
   return {threadId:thread.id,messageId:existing.id,replayed:true};
  }
  const now=new Date();
  const [message]=await tx.insert(placementTpoMessages).values({
   threadId:thread.id,senderType:"RECRUITER",senderUserId:context.user.id,
   body,createdAt:now,
  }).returning({id:placementTpoMessages.id});
  if(!message)throw new Error("DRIVE_PROPOSAL_PERSISTENCE_FAILED");
  await tx.update(placementTpoMessageThreads).set({lastMessageAt:now})
   .where(eq(placementTpoMessageThreads.id,thread.id));
  await notifyTpoOfRecruiterMessage(tx,{
    collegeId:input.collegeId,threadId:thread.id,messageId:message.id,
    senderUserId:context.user.id,at:now,
  });
  return {threadId:thread.id,messageId:message.id,replayed:false};
 });
}

/**
 * Minimal recruiter-only guard for proposal history.
 * Revalidates the registered ACTIVE grant without fetching private conversation bodies.
 */
export async function verifyRecruiterGeneralThreadAccess(
 context:RequestContext,rawThreadId:unknown,rawCollegeId:unknown,
):Promise<void>{
 const threadId=threadIdSchema.parse(rawThreadId);
 const collegeId=collegeIdSchema.parse(rawCollegeId);
 if(context.recruiter?.status!=="ACTIVE" || context.recruiter.userId!==context.user.id)
  throw new TpoMessagingError("TPO_MESSAGE_FORBIDDEN");
 await getDb().transaction(async tx=>{
  const [thread]=await tx.select({id:placementTpoMessageThreads.id})
   .from(placementTpoMessageThreads).where(and(
    eq(placementTpoMessageThreads.id,threadId),
    eq(placementTpoMessageThreads.collegeId,collegeId),
    eq(placementTpoMessageThreads.recruiterUserId,context.user.id),
    isNull(placementTpoMessageThreads.jobId),
   )).for("share").limit(1);
  if(!thread)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
  const grant=await loadActiveRecruiterGrant(tx,context.user.id,collegeId,true);
  if(!grant)throw new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND");
 });
}
