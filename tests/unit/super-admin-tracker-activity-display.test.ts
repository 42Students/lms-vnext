import {describe,it,expect} from "vitest";
import {auditActivityTransition as label} from "@/modules/bug-tracker/audit-activity-display-model";
describe("audit finding activity transition",()=>{
 it("shows status changes",()=>expect(label({fromValue:"NEW",toValue:"FIXING"})).toBe("NEW → FIXING"));
 it("shows a cleared resolution",()=>expect(label({fromValue:"FIXED",toValue:null})).toBe("FIXED → (cleared)"));
 it("shows newly set values",()=>expect(label({fromValue:null,toValue:"CLOSED"})).toBe("(unset) → CLOSED"));
 it("does not disguise metadata-only updates as status changes",()=>expect(label({fromValue:null,toValue:null})).toBe("Workflow update"));
});
