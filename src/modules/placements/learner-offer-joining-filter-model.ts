import { z } from "zod";
export const learnerJoiningFilterSchema = z.enum(["all", "joined", "pending", "deferred", "did-not-join", "not-recorded"]);
export type LearnerJoiningFilter = z.infer<typeof learnerJoiningFilterSchema>;
/** Never infer a joining outcome from an accepted offer. Only recorded rows qualify. */
export function filterOwnOffersByJoining<T extends { joining: { status: string } | null }>(
 rows: readonly T[], filter: LearnerJoiningFilter,
): T[] {
 if (filter === "all") return [...rows];
 if (filter === "not-recorded") return rows.filter(row => row.joining === null);
 const statuses: Record<Exclude<LearnerJoiningFilter, "all" | "not-recorded">, string> = {
  joined: "JOINED", pending: "PENDING", deferred: "DEFERRED", "did-not-join": "DID_NOT_JOIN",
 };
 return rows.filter(row => row.joining?.status === statuses[filter]);
}
