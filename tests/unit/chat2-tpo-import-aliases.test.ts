import {describe,expect,it} from "vitest";
import {previewTpoLeadCsv,TPO_LEAD_CSV_MAX_ROWS} from "@/modules/placements/tpo-lead-csv-import-model";
import {tpoLeadSourceSchema} from "@/modules/placements/tpo-crm-validation";
describe("TPO-recruiters-23 legacy import aliases",()=>{
 it("accepts reordered headings, company alias, and defaults to IMPORT",()=>{
  const csv="email,company,name,source,designation,phone\n"+
   "talent@business.example,Business,Recruiter,,HR,\n";
  const parsed=previewTpoLeadCsv(csv);
  expect(parsed.rows[0]?.lead).toMatchObject({name:"Recruiter",companyName:"Business",source:"IMPORT"});
 });
 it("refuses duplicate aliases and supports 5000 rows",()=>{
  expect(()=>previewTpoLeadCsv("name,fullName,phone,company,designation,source\nA,B,1234567890,C,,"))
   .toThrow("CSV_HEADER_MISMATCH");
  expect(TPO_LEAD_CSV_MAX_ROWS).toBe(5000);
  expect(tpoLeadSourceSchema.parse("Import")).toBe("IMPORT");
 });
});
