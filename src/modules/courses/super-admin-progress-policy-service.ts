import "server-only";
import type { RequestContext } from "@/modules/identity/context";
import { listAdminTenantSettings } from "@/modules/platform-settings/admin-editor-service";
import { COURSE_PROGRESS_POLICY_CARDS } from "./course-progress-policy";

export type PolicyCardKey = keyof typeof COURSE_PROGRESS_POLICY_CARDS;

/** Stored GLOBAL override for one policy card; only valid with no college selected (as the editor requires). */
export async function getSuperAdminPolicyCardState(context: RequestContext, card: PolicyCardKey) {
  const spec = COURSE_PROGRESS_POLICY_CARDS[card];
  const listing = await listAdminTenantSettings(context, "GLOBAL");
  const entry = listing.entries.find((row) => row.key === spec.key);
  const parsed = entry ? Number(entry.value) : null;
  return {
    ready: listing.ready,
    storedValue: parsed !== null && Number.isFinite(parsed) ? parsed : null,
    version: entry?.version ?? 0,
  };
}
