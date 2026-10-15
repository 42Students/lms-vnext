import {expect,it} from "vitest";
import {facultyResetContentOrder} from "@/modules/courses/faculty-content-order-ui-model";
it("restores the latest authoritative Section order",()=>{
 const server=[{id:"c"},{id:"a"},{id:"b"}];
 const result=facultyResetContentOrder(server);
 expect(result).toEqual(["c","a","b"]);
 result.reverse();
 expect(server.map(row=>row.id)).toEqual(["c","a","b"]);
});
