import {z} from "zod";

/** A stale College Admin archive tab must not overwrite a newer edit.
 * Strict body means client-side clocks or guessed tenant IDs never become
 * extra server-side mutation inputs.
 */
export const archiveProjectInstanceInputSchema=z.strictObject({
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
export function projectArchiveTokenMatches(
 persistedUpdatedAt:Date,
 expectedUpdatedAt:string,
):boolean{
 const timestamp=Date.parse(expectedUpdatedAt);
 return Number.isFinite(timestamp) && persistedUpdatedAt.getTime()===timestamp;
}
