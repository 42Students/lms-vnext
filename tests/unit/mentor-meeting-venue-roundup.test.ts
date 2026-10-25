import {describe,expect,it} from "vitest";
import {formatMentorMeetingVenueAgenda,parseMentorMeetingVenueAgenda,
 mentorMeetingScheduleError} from "@/modules/projects/mentor-meeting-form-model";

describe("Mentor in-person meeting scheduling and rescheduling",()=>{
 it("preserves one venue line across repeated edits",()=>{
  const first=formatMentorMeetingVenueAgenda("Review requirements","Lab 2");
  expect(first).toBe("Location: Lab 2\nReview requirements");
  expect(formatMentorMeetingVenueAgenda(first,"Room 304")).toBe(
   "Location: Room 304\nReview requirements");
  expect(parseMentorMeetingVenueAgenda("Venue: Studio 5\nAgenda")).toEqual({
   location:"Studio 5",agenda:"Agenda",
  });
  expect(formatMentorMeetingVenueAgenda(first,"")).toBe("Review requirements");
 });
 it("permits scheduled in-person meetings without a link and checks limits",()=>{
  const base={title:"Sprint review",startsAt:"2026-12-03T11:00",
   endsAt:"2026-12-03T12:00",meetingUrl:"",
   nowMs:Date.parse("2026-12-01T00:00:00Z")};
  expect(mentorMeetingScheduleError({...base,location:"Room 304"})).toBeNull();
  expect(mentorMeetingScheduleError(base)).toBe("Meeting link or physical venue is required.");
  expect(mentorMeetingScheduleError({...base,location:"x".repeat(201)}))
   .toBe("Physical venue must be at most 200 characters.");
  expect(mentorMeetingScheduleError({...base,location:"Room 304",meetingUrl:"javascript:evil()"}))
   .toBe("Enter a valid meeting link.");
 });
 it("keeps drafts possible without any location",()=>{
  const base={title:"Planning",startsAt:"2026-12-03T11:00",
   endsAt:"2026-12-03T12:00",meetingUrl:"",draft:true,
   nowMs:Date.parse("2026-12-01T00:00:00Z")};
  expect(mentorMeetingScheduleError(base)).toBeNull();
 });
});
