import {describe,it,expect} from "vitest";
import {matchesWaitingSince} from "@/modules/verification/queue-waiting-since";
describe("waiting since IST",()=>{it("includes the entire selected local calendar day",()=>{
 expect(matchesWaitingSince(new Date("2026-10-15T18:29:59.999Z"),"2026-10-15")).toBe(true);
 expect(matchesWaitingSince(new Date("2026-10-15T18:30:00.000Z"),"2026-10-15")).toBe(false);
 expect(matchesWaitingSince(new Date("2026-10-13T01:00:00.000Z"),"2026-10-15")).toBe(true);
 expect(()=>matchesWaitingSince(new Date(),"2026-02-31")).toThrow("INVALID_WAITING_SINCE");
});});
