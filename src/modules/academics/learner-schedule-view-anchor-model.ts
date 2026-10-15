import { z } from "zod";
import { learnerScheduleDateFromDay } from "./learner-ist-schedule-model";
/** Switching Month/Week/Day keeps the learner's selected agenda date in view. */
export function learnerScheduleAnchorForView(selectedDay:string,currentAnchor:Date):Date {
  const parsed=z.iso.date().safeParse(selectedDay);
  return parsed.success ? learnerScheduleDateFromDay(parsed.data) : currentAnchor;
}
