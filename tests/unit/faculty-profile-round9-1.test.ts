import {it,expect} from "vitest";
import {restoreFacultyProfileRows} from "@/modules/people/faculty-profile-repeatable-actions";
it("recreates the persisted rows without changing the original snapshot",()=>{
 const row={id:"a",title:"Award"};const initial=[row];const copy=restoreFacultyProfileRows(initial);
 expect(copy).toEqual(initial);expect(copy).not.toBe(initial);expect(copy[0]).not.toBe(row);
 copy[0]!.title="Different";expect(initial[0]?.title).toBe("Award");
});
