import {describe,it,expect} from "vitest";
import {readTpoBulkRequestBody,TPO_BULK_BODY_MAX_BYTES,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
describe("TPO-students-03, TPO-drive-workspace-25 200-row confirmed preview body bounds",()=>{
 const entry=(i:number)=>({id:"00000000-0000-4000-8000-"+String(i).padStart(12,"0"),version:"a".repeat(64)});
 it("accepts 200 versioned rows within the bounded 64KiB request",async()=>{
  const body={target:"APPLICATIONS",ids:Array.from({length:200},(_,i)=>entry(i).id),
   selections:Array.from({length:200},(_,i)=>entry(i)),action:"SHORTLISTED",note:"Screening reviewed",
   previewToken:"valid-signed-token",confirmed:true};
  const request=new Request("https://local.invalid/bulk",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  expect(TPO_BULK_BODY_MAX_BYTES).toBe(65536);
  expect((await readTpoBulkRequestBody(request)).selections).toHaveLength(200);
 });
 it("refuses oversized JSON without parsing it",async()=>{
  const request=new Request("https://local.invalid/bulk",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({padding:"z".repeat(TPO_BULK_BODY_MAX_BYTES)})});
  await expect(readTpoBulkRequestBody(request)).rejects.toMatchObject({status:413});
 });
});
