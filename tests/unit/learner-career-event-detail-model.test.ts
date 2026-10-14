import {describe,expect,it} from "vitest";
import {careerCalendarEvents} from "@/modules/placements/learner-career-calendar-model";
import {findOwnCareerCalendarEvent,learnerCareerCalendarEventTarget} from "@/modules/placements/learner-career-event-detail-model";
const app="81818181-8181-4818-8818-818181818181";
const round="82828282-8282-4828-8828-828282828282";
const event=careerCalendarEvents([{applicationId:app,roundId:round,roundName:"Interview",
  roundKind:"INTERVIEW",companyName:"Acme",roleTitle:"Engineer",
  scheduledAt:"2026-10-16T18:45:00Z",exception:null}])[0]!;
describe("own career-calendar event details",()=>{
  it("returns only matching persisted event and exact round CTA",()=>{
    expect(findOwnCareerCalendarEvent([event],app+":"+round)).toEqual(event);
    expect(learnerCareerCalendarEventTarget(event)).toBe(
      "/learn/my-placements/interviews?applicationId="+app+"&roundId="+round);
  });
  it("rejects forged and malformed IDs without leaking event data",()=>{
    const foreign="83838383-8383-4838-8838-838383838383";
    for(const raw of [foreign+":"+round,app+":"+foreign,"../"+round,{},null]) {
      expect(findOwnCareerCalendarEvent([event],raw)).toBeNull();
    }
  });
});
