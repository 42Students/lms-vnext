import {describe,it,expect} from "vitest";
import {
  MENTOR_INITIAL_VIEWER_ZONE,
  safeMentorViewerZone,
  mentorViewerDateLabel,
  mentorViewerClockLabel,
  mentorViewerMeetingTimeLabel,
} from "@/modules/projects/mentor-calendar-viewer-time-model";

const slot={
  startsAt:"2026-07-15T12:00:00.000Z",
  endsAt:"2026-07-15T13:00:00.000Z",
};

describe("Mentor viewer-local meeting display (old LMS behavior)",()=>{
  it("retains deterministic India initial render, then validates the viewer zone",()=>{
    expect(MENTOR_INITIAL_VIEWER_ZONE).toBe("Asia/Kolkata");
    expect(safeMentorViewerZone("America/New_York")).toBe("America/New_York");
    expect(safeMentorViewerZone("Invalid/Zone")).toBe("Asia/Kolkata");
    expect(safeMentorViewerZone(null)).toBe("Asia/Kolkata");
  });
  it("renders the same UTC meeting in the viewer zone, including DST offset",()=>{
    expect(mentorViewerMeetingTimeLabel(slot,"Asia/Kolkata"))
      .toBe("05:30 PM – 06:30 PM (GMT+05:30)");
    expect(mentorViewerMeetingTimeLabel(slot,"America/New_York"))
      .toBe("08:00 AM – 09:00 AM (GMT-04:00)");
    expect(mentorViewerMeetingTimeLabel(slot,"UTC"))
      .toBe("12:00 PM – 01:00 PM (GMT+00:00)");
  });
  it("changes the calendar DATE when viewer midnight is crossed",()=>{
    const instant="2026-11-03T20:00:00.000Z";
    expect(mentorViewerDateLabel(instant,"Asia/Kolkata"))
      .toBe("Wed, Nov 4 2026");
    expect(mentorViewerDateLabel(instant,"America/New_York"))
      .toBe("Tue, Nov 3 2026");
    expect(mentorViewerClockLabel(instant,"Asia/Kolkata")).toBe("01:30 AM");
    expect(mentorViewerClockLabel(instant,"America/New_York")).toBe("03:00 PM");
  });
  it("keeps safe fallbacks for invalid instants and malformed zones",()=>{
    expect(mentorViewerDateLabel("not-a-time","UTC")).toBe("Date TBD");
    expect(mentorViewerClockLabel("not-a-time","UTC")).toBeNull();
    expect(mentorViewerMeetingTimeLabel({
      startsAt:"invalid",endsAt:"invalid",
      legacyStartTime:"09:00",legacyEndTime:"10:00",
    },"Asia/Kolkata")).toBe("09:00 – 10:00");
    expect(mentorViewerMeetingTimeLabel(slot,"Invalid/Zone"))
      .toBe(mentorViewerMeetingTimeLabel(slot,"Asia/Kolkata"));
  });
  it("does not change stored UTC timestamps or drop end time",()=>{
    const before=JSON.stringify(slot);
    mentorViewerDateLabel(slot.startsAt,"America/New_York");
    mentorViewerMeetingTimeLabel(slot,"Asia/Kolkata");
    expect(JSON.stringify(slot)).toBe(before);
    expect(mentorViewerMeetingTimeLabel({...slot,endsAt:slot.startsAt},"UTC"))
      .toBe("12:00 PM (GMT+00:00)");
  });
});
