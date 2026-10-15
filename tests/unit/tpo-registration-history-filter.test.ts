import {expect,it} from "vitest";
import {filterTpoRegistrationEvents,tpoRegistrationHistoryQuery} from "@/modules/placements/tpo-registration-history-filter-model";
it("filters bounded immutable source rows by persisted actor-source and prior choice",()=>{
 const rows=[{source:"SELF",previousChoice:null},{source:"TPO",previousChoice:"PLACEMENTS"},{source:"SELF",previousChoice:"HIGHER_STUDIES"}];
 expect(filterTpoRegistrationEvents(rows,{source:"SELF",event:"INITIAL"})).toEqual([rows[0]]);
 expect(filterTpoRegistrationEvents(rows,{source:"ALL",event:"CHANGE"})).toEqual([rows[1],rows[2]]);
 expect(tpoRegistrationHistoryQuery.safeParse({source:"OTHER"}).success).toBe(false);
});
