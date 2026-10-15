import {expect,it} from "vitest";
import {companyShareAvailability} from "@/modules/placements/company-share/availability-model";
it("never exposes public rows without durable audit storage",()=>{
 expect(companyShareAvailability(true,false)).toEqual({kind:"MIGRATION_PENDING"});
 expect(companyShareAvailability(false,true)).toEqual({kind:"MIGRATION_PENDING"});
 expect(companyShareAvailability(true,true)).toEqual({kind:"READY"});
});
