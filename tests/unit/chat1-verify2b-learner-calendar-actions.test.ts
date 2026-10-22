import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("verify2b learner calendar day drawer actions",()=>{
 it("G2-19-005-067 exposes direct attendance and reschedule only for server-verifiable bookings",()=>{
   const page=read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
   const calendar=read("src/components/placements/learner-career-calendar.tsx");
   expect(page).toContain('row.booked&&row.roundKind!=="TALK"&&!pending&&');
   expect(page).toContain('!outcomeByRound.has(key)&&');
   expect(page).toContain('scheduled.getTime()>now.getTime()');
   expect(page).toContain('const actionableRoundKeys=workspace.rounds.filter(roundCanBeManaged)');
   expect(page).toContain('actionableRoundKeys={actionableRoundKeys}');
   expect(page).toContain("roundRescheduleNotices={roundRescheduleNotices}");
   expect(calendar).toContain('roundRescheduleNotices[event.applicationId+":"+event.roundId]');
   expect(calendar).toContain("Reschedule asked");
   expect(calendar).toContain("Reschedule declined");
   expect(calendar).toContain("Placement cell reply: {notice.decisionNote}");
   expect(calendar).toContain('verifiedActionKeys.has(event.applicationId+":"+event.roundId)');
   expect(calendar).toContain('event.eventType==="ROUND" && event.booked');
   expect(calendar).toContain("<LearnerRoundConfirmAttendance");
   expect(calendar).toContain("<LearnerScheduleReschedule");
   expect(calendar).toContain('event.mode==="ON_CAMPUS"||event.mode==="VIRTUAL"');
   expect(calendar).toContain('className="md:!w-[min(440px,100vw)]"');
   expect(calendar).toContain("selectedDayEvents.map((event)");
 });
});
