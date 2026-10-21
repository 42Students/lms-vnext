import "server-only";
import { randomUUID } from "node:crypto";
import { executeScheduledJobWithLease } from "./scheduled-job-runner";
import { postgresScheduledJobLeaseStore } from "./postgres-scheduled-job-lease-store";
import { TPO_SCHEDULED_JOBS } from "./tpo-scheduled-job-registry";
import { sweepExpiredPlacementOffers } from "@/modules/placements/placement-offer-expiry-sweep-service";
import {finalizeMaturedExternalTpoAcceptances} from "@/modules/placements/tpo-offer-lifecycle-service";

const JOB_NAME = "tpo.expireOverdueOffers";
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TpoOfferExpiryTickResult =
  | { status: "DISABLED"; expired: 0 }
  | { status: "HELD"; expired: 0 }
  | { status: "COMPLETED"; expired: number; batchLimitReached: boolean;
      matured: number; maturityFailed: number; maturityBatchLimitReached: boolean };

/**
 * Called only by the internal POST scheduler route, never by page renders.
 * Postgres enforces one active worker for this exact job key. Expired-offer
 * transitions themselves remain guarded by row locks + ISSUED CAS, so a
 * crash and retry cannot produce a second expiry transition or event.
 */
export async function runTpoOfferExpiryTick(): Promise<TpoOfferExpiryTickResult> {
  if (process.env.TPO_SCHEDULED_OFFER_EXPIRY_ENABLED !== "true") {
    return { status: "DISABLED", expired: 0 };
  }

  // A real, provisioned service actor must satisfy the history/audit FKs.
  // Never synthesize a user ID or record an expiry as an arbitrary learner.
  const actorUserId = (process.env.TPO_SCHEDULER_ACTOR_USER_ID ?? "").trim();
  if (!UUID_FORMAT.test(actorUserId)) {
    throw new Error("TPO_SCHEDULER_ACTOR_UNAVAILABLE");
  }

  const result = await executeScheduledJobWithLease(
    postgresScheduledJobLeaseStore,
    {
      jobName: JOB_NAME,
      holderId: randomUUID(),
      ttlMs: TPO_SCHEDULED_JOBS[JOB_NAME].leaseMs,
    },
    async (fence) => {
      let expired = 0;
      let batchLimitReached = false;
      // Bound each tick to 500 records and let the next scheduled tick
      // drain the rest. Refresh the lease before each transactional batch.
      for (let batch = 0; batch < 5; batch += 1) {
        await fence.renew();
        await fence.assertCurrent();
        const count = await sweepExpiredPlacementOffers(actorUserId, new Date(), 100);
        expired += count;
        if (count < 100) {
          batchLimitReached = false;
          break;
        }
        batchLimitReached = true;
      }
      // Apply the independent 48-hour external-acceptance due selector
      // after expiry. Each acceptance rechecks disputes and serializes
      // membership/offer writes, preserving a retryable failure record.
      let matured = 0;
      let maturityFailed = 0;
      let maturityBatchLimitReached = false;
      for (let batch=0;batch<5;batch+=1) {
        await fence.renew();
        await fence.assertCurrent();
        const result=await finalizeMaturedExternalTpoAcceptances(new Date(),40);
        matured+=result.finalized;
        maturityFailed+=result.failed;
        if(result.examined<40 || result.finalized===0) {
          maturityBatchLimitReached=false;
          break;
        }
        maturityBatchLimitReached=true;
      }
      return { expired, batchLimitReached,matured,maturityFailed,maturityBatchLimitReached };
    },
  );
  if (!result.ran) return { status: "HELD", expired: 0 };
  return { status: "COMPLETED", ...result.result };
}
