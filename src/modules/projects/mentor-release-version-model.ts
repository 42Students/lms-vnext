import {z} from "zod";

/** Required for destructive operations: a stale mentor tab must never delete a newer release. */
export const mentorReleaseDeleteSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({offset: true}),
});

/** Compare actual instants; accept equivalent UTC/IST offsets, never malformed dates. */
export function mentorReleaseVersionMatches(current:Date, expected:string):boolean {
  const currentMs=current.getTime();
  const expectedMs=new Date(expected).getTime();
  return Number.isFinite(currentMs) && Number.isFinite(expectedMs) && currentMs===expectedMs;
}
