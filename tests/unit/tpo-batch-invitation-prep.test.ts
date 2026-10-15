import {it,expect} from "vitest";
import {prepareTpoBatchInvite} from "@/modules/placements/tpo-communication-prep-model";
it("derives a date-aware manual invitation draft without implying send",()=>{
 const value=prepareTpoBatchInvite({batchName:"CSE 2026",deadline:new Date("2026-10-16T10:00:00Z"),invitedAt:null,finishedAt:null});
 expect(value.subject).toContain("CSE 2026");
 expect(value.body).toContain("IST");
 expect(value.warning).toBeNull();
});
it("warns when lifecycle is already invited or finished",()=>{
 const d={batchName:"CSE",deadline:null,invitedAt:new Date("2026-10-15Z"),finishedAt:null};
 expect(prepareTpoBatchInvite(d).warning).toMatch(/already/);
 expect(prepareTpoBatchInvite({...d,finishedAt:new Date("2026-10-16Z")}).warning).toMatch(/finished/);
});
