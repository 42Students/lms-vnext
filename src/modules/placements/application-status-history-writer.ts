import "server-only";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementApplicationStatusHistory } from "@/db/schema";

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

const transitionSchema=z.strictObject({
 applicationId:z.string().uuid(),
 fromStatus:z.enum(["SUBMITTED","WITHDRAWN"]).nullable(),
 toStatus:z.enum(["SUBMITTED","WITHDRAWN"]),
 actorUserId:z.string().uuid(),
 reason:z.string().trim().max(500).nullable().optional(),
 cascadeId:z.string().uuid().nullable().optional(),
});

/** Reusable V1 JobApplicationStatusHistoryService recorder. The enclosing
 * transaction must first update/lock the parent row and verify scope, actor
 * and optimistic version. The history insert is part of that same transaction:
 * losing an audit write aborts the parent mutation rather than silently
 * committing an unaudited learner status transition.
 *
 * A replay of an already-applied transition is a no-op. Offer, screening and
 * hiring decisions deliberately use their own audit/status tables; the
 * application state machine only accepts SUBMITTED ↔ WITHDRAWN.
 */
export async function recordApplicationStatusTransition(
 tx:Tx, raw:unknown,
):Promise<boolean>{
 const transition=transitionSchema.parse(raw);
 if(transition.fromStatus===transition.toStatus)return false;
 if(transition.fromStatus===null&&transition.toStatus!=="SUBMITTED")
  throw new Error("Initial application status must be submitted");
 const [created]=await tx.insert(placementApplicationStatusHistory).values({
  applicationId:transition.applicationId,
  fromStatus:transition.fromStatus,
  toStatus:transition.toStatus,
  actorUserId:transition.actorUserId,
  reason:transition.reason??null,
  cascadeId:transition.cascadeId??null,
 }).returning({id:placementApplicationStatusHistory.id});
 if(!created)throw new Error("Application status audit entry was not persisted");
 return true;
}
