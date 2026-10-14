import { describe, expect, it } from "vitest";
import { learnerInterviewCalendarArtifacts,foldLearnerCalendarLine } from "@/modules/placements/learner-interview-calendar-model";
const raw={
  applicationId:"81818181-8181-4818-8818-818181818181",
  roundId:"82828282-8282-4828-8828-828282828282",
  companyName:"Test, Co",roleTitle:"Engineering",roundName:"Interview",
  scheduledAt:"2026-10-14T04:30:00.000Z",durationMinutes:45,
  venue:"Tower; 2",mode:"ON_CAMPUS" as const,
};
const timestamp=new Date("2026-10-13T00:00:00Z");
describe("learner calendar export for recorded interview only",()=>{
  it("uses persisted duration and UTC instants in ICS and Google Calendar",()=>{
    const result=learnerInterviewCalendarArtifacts(raw,timestamp)!;
    expect(result.ics).toContain("DTSTART:20261014T043000Z");
    expect(result.ics).toContain("DTEND:20261014T051500Z");
    expect(result.ics).toContain("SUMMARY:Test\\, Co");
    expect(result.ics).toContain("LOCATION:Tower\\; 2");
    expect(result.googleUrl).toContain("calendar.google.com/calendar/render?");
    expect(result.googleUrl).toContain("dates=20261014T043000Z%2F20261014T051500Z");
    expect(result.ics).not.toContain("meetingUrl");
  });
  it("does not invent a duration or schedule and refuses caller controls",()=>{
    expect(learnerInterviewCalendarArtifacts({...raw,durationMinutes:null},timestamp)).toBeNull();
    expect(learnerInterviewCalendarArtifacts({...raw,scheduledAt:null},timestamp)).toBeNull();
    const forged={...raw,collegeId:raw.applicationId};
    expect(()=>learnerInterviewCalendarArtifacts(forged,timestamp)).toThrow();
    expect(()=>learnerInterviewCalendarArtifacts({...raw,durationMinutes:1441},timestamp)).toThrow();
  });
  it("folds long UTF-8 calendar fields without splitting emoji or exceeding 75 octets",()=>{
    const long="SUMMARY:"+("Interview résumé 🎓 — ".repeat(12));
    const folded=foldLearnerCalendarLine(long);
    const lines=folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every(line=>Buffer.byteLength(line,"utf8")<=75)).toBe(true);
    expect(lines.slice(1).every(line=>line.startsWith(" "))).toBe(true);
    expect(lines.map((line,index)=>index===0?line:line.slice(1)).join("")).toBe(long);
  });

  it("prevents CRLF event injection in provider-entered titles",()=>{
    const result=learnerInterviewCalendarArtifacts({...raw,roundName:"Interview\r\nATTENDEE:attacker"},timestamp)!;
    expect(result.ics).toContain("Interview\\nATTENDEE:attacker");
    expect(result.ics).not.toContain("\r\nATTENDEE:");
  });
});
