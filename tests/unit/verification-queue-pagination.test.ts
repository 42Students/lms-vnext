import {describe,it,expect} from "vitest";
import {verificationPage} from "@/modules/verification/queue-pagination";
describe("queue pagination",()=>{it("uses bounded 25-row slices",()=>{
 const p=verificationPage(Array.from({length:52},(_,i)=>i),2);
 expect(p.rows).toHaveLength(25);expect(p.rows[0]).toBe(25);
 expect(p.totalPages).toBe(3);expect(p.hasMore).toBe(true);
 expect(()=>verificationPage([],0)).toThrow("INVALID_PAGE");
});});