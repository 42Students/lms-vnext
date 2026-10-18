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

/** Ensure a persisted release version advances even during two edits in the
 * same millisecond; a stale tab must never replay a just-accepted token. */
export function nextMentorReleaseUpdateAt(current:Date,now:Date):Date|null{
 const before=current.getTime(),clock=now.getTime();
 if(!Number.isFinite(before)||!Number.isFinite(clock))return null;
 return new Date(Math.max(clock,before+1));
}
