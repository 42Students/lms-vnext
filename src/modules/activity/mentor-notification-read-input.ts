import { z } from "zod";

/** A notification acknowledgment only accepts route identity, never JSON scope. */
export const mentorNotificationReadBodySchema=z.object({}).strict();

export function parseMentorNotificationReadBody(body:string) {
  let value:unknown={};
  if(body.trim()) {
    try {
      value=JSON.parse(body);
    } catch {
      value=body;
    }
  }
  return mentorNotificationReadBodySchema.parse(value);
}
