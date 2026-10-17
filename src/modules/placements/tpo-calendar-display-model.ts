import type {PlacementCalendarEvent} from "./placement-calendar-model";

/** Labels taken from the legacy TPO calendar's event projection and header. */
export const TPO_CALENDAR_SUBTITLE =
 "Coordinate rounds, talks, deadlines and recruiter follow-ups without losing the wider placement schedule.";
export const TPO_EMPTY_AGENDA = "Nothing scheduled in this period";
export function tpoLegacyCalendarEventTitle(event:Pick<PlacementCalendarEvent,"kind"|"title"|"companyName">):string{
 if(event.kind==="ROUND")return event.companyName+" · "+event.title;
 if(event.kind==="APPLICATION_DEADLINE")return "Deadline: "+event.companyName;
 return event.title;
}
