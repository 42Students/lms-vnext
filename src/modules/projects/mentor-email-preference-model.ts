import {z} from "zod";

/** One opt-in controls only final-submission and meeting-request emails.
 * All other Mentor notifications remain in-app regardless of this value.
 */
export const mentorEmailPreferenceSaveSchema=z.strictObject({
 enabled:z.boolean(),
 expectedVersion:z.uuid().nullable(),
});
export type MentorEmailPreferenceState={enabled:boolean;version:string|null};
export function mentorEmailPreferenceFromSavedEvent(
 event:{id:string;metadata:Record<string,unknown>}|null|undefined,
):MentorEmailPreferenceState{
 return {enabled:event?.metadata["enabled"]===true,version:event?.id??null};
}
