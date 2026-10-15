import {expect,it} from "vitest";
import {filteredResourceFiles} from "@/modules/projects/resource-file-filter-model";
const make=(name:string,status:"READY"|"FAILED"|"VERIFYING",day:string,id:string)=>({id,projectId:id,resourceId:id,name,bytes:100,contentType:"text/plain",status,createdAt:day});
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222",c="33333333-3333-4333-8333-333333333333";
const rows=[make("A.txt","READY","2026-10-10T00:00:00Z",a),make("B.txt","FAILED","2026-10-11T00:00:00Z",b),make("C.txt","VERIFYING","2026-10-12T00:00:00Z",c)] as const;
it("filters backend-scoped file metadata and keeps deterministic pages",()=>{
 expect(filteredResourceFiles(rows,{state:"AVAILABLE"}).items.map(x=>x.name)).toEqual(["A.txt"]);
 expect(filteredResourceFiles(rows,{state:"PENDING"}).total).toBe(1);
 expect(filteredResourceFiles(rows,{order:"OLDEST",page:3,pageSize:1})).toMatchObject({page:3,pages:3,total:3});
});
it("clamps an out-of-range page and rejects malformed filters",()=>{
 expect(filteredResourceFiles(rows,{page:55,pageSize:2})).toMatchObject({page:2,pages:2});
 expect(()=>filteredResourceFiles(rows,{page:-1})).toThrow();
 expect(()=>filteredResourceFiles(rows,{unknown:"bad"})).toThrow();
});
