import {it,expect} from "vitest";
import {canRecruiterMutateOwnSlot} from "@/modules/placements/hr-interview-slot-model";
it("allows only the creator to mutate internal reservations",()=>{
 expect(canRecruiterMutateOwnSlot("recruiter-a","recruiter-a")).toBe(true);
 expect(canRecruiterMutateOwnSlot("recruiter-a","recruiter-b")).toBe(false);
 expect(canRecruiterMutateOwnSlot("","")).toBe(false);
});
