import {expect,it} from "vitest";
import {globalTpoRequestsQuerySchema} from "@/modules/placements/tpo-global-requests-service";
it("defaults to actionable pending requests with bounded pages",()=>{
 expect(globalTpoRequestsQuerySchema.parse({})).toEqual({status:"PENDING",search:"",page:1,pageSize:25});
 expect(globalTpoRequestsQuerySchema.safeParse({page:"0"}).success).toBe(false);
 expect(globalTpoRequestsQuerySchema.safeParse({pageSize:5000}).success).toBe(false);
 expect(globalTpoRequestsQuerySchema.safeParse({status:"FOREIGN"}).success).toBe(false);
});
