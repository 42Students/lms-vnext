import {describe,expect,it} from "vitest";
import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
describe("learner drive persisted deadline urgency",()=>{
 const now="2026-10-14T12:00:00Z";
 it("uses persisted deadline and snapshot without browser-local time",()=>{
 expect(learnerDriveDeadlineUrgency("2026-10-15T11:00:00Z",false,now).kind).toBe("today");
 expect(learnerDriveDeadlineUrgency("2026-10-17T11:00:00Z",false,now).kind).toBe("soon");
 expect(learnerDriveDeadlineUrgency("2026-11-17T11:00:00Z",false,now).kind).toBe("future");
 expect(learnerDriveDeadlineUrgency("2026-10-13T00:00:00Z",false,now).kind).toBe("closed");
 });
 it("never claims a deadline without persisted evidence",()=>{
 expect(learnerDriveDeadlineUrgency(null,false,now).kind).toBe("no-deadline");
 expect(learnerDriveDeadlineUrgency("2026-10-17T11:00:00Z",true,now).kind).toBe("closed");
 expect(learnerDriveDeadlineUrgency("2026-10-17T11:00:00Z",false,null).label).toBe("Deadline listed");
 });
});