import {describe,it,expect} from "vitest";
import {matchesWaitingSince} from "@/modules/verification/queue-waiting-since";
describe("waiting since",()=>{it("compares using IST day boundary",()=>{
 expect(matchesWaitingSince(new Date("2026-10-10T00:00:00Z"),"2026-10-15")).toBe(true);
 expect(matchesWaitingSince(new Date("2026-10-16T00:00:00Z"),"2026-10-15")).toBe(false);
 expect(matchesWaitingSince(new Date(),"")).toBe(true);
});});