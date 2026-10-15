import {z} from "zod";
export const learnerJoiningFilterSchema=z.enum(["all","joined"]);
export type LearnerJoiningFilter=z.infer<typeof learnerJoiningFilterSchema>;
/** Joining must be explicitly persisted; acceptance of an offer is not proof of joining. */
export function filterOwnOffersByJoining<T extends {joining:{status:string}|null}>(rows:readonly T[],filter:LearnerJoiningFilter):T[]{
 return filter==="all"?[...rows]:rows.filter(row=>row.joining?.status==="JOINED");
}
