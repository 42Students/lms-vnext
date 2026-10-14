import { z } from "zod";
import type { CareerCalendarEvent } from "./learner-career-calendar-model";

const careerEventKeySchema=z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
);

/** A matching ID from the own persisted event set is required for any detail. */
export function findOwnCareerCalendarEvent(
  ownEvents:readonly CareerCalendarEvent[],rawKey:unknown,
) {
  const key=careerEventKeySchema.safeParse(rawKey);
  return key.success ? ownEvents.find(item=>item.key===key.data)??null : null;
}
export function learnerCareerCalendarEventTarget(event:CareerCalendarEvent) {
  const key=event.kind==="ASSESSMENT"
    ? "assessments"
    :event.kind==="INTERVIEW"?"interviews":null;
  if(!key)return "/learn/my-placements/applications/"+encodeURIComponent(event.applicationId);
  return "/learn/my-placements/"+key+"?applicationId="+encodeURIComponent(event.applicationId)+
    "&roundId="+encodeURIComponent(event.roundId);
}
