import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {buildTpoCompanyRows} from "@/modules/placements/tpo-companies-view-model";
const source=(path:string)=>readFileSync(path,"utf8");

describe("2026 Companies directory inspector",()=>{
 it("keeps the roster/table mounted while selecting a company summary",()=>{
  const s=source("src/components/tpo/tpo-companies-spreadsheet.tsx");
  expect(s).toContain("const [focusedKey,setFocusedKey]");
  expect(s).toContain("const [dismissed,setDismissed]");
  expect(s).toContain("onOpen:company=>{setFocusedKey(keyOf(company));setDismissed(false);}");
  expect(s).toContain('data-testid="tpo.companies.inspector"');
  expect(s).toContain('aria-label="Verified company numbers"');
  expect(s).toContain("Open company page");
  expect(s).toContain("Earlier-season placement comparisons are unavailable");
 });
 it("distinguishes real canonical employer counts from unlinked CRM strings",()=>{
  const rows=buildTpoCompanyRows({
   companies:[{companyId:"employer-A",relationshipId:"link-A",name:"Acme",websiteUrl:null}],
   contacts:[
    {id:"lead-A",companyRelationshipId:"link-A",companyName:"Acme",name:"One",
      designation:null,email:null,phone:null,stage:"NEW",source:null,updatedAt:new Date()},
    {id:"lead-B",companyRelationshipId:null,companyName:"Acme",name:"Two",
      designation:null,email:null,phone:null,stage:"NEW",source:null,updatedAt:new Date()},
   ],
   drives:[{id:"drive-A",relationshipId:"link-A",title:"Graduate Hiring",status:"PUBLISHED",
     employmentType:"FULL_TIME",createdAt:new Date(),publishedAt:null,closedAt:null,archivedAt:null}],
   offers:[{id:"offer-A",jobId:"drive-A",membershipId:"student-A",candidateName:null,
     roleTitle:"Engineer",status:"ACCEPTED",annualCtcInr:500000,issuedAt:new Date(),
     respondedAt:null,joiningStatus:"JOINED",joiningRecordedAt:new Date()}],
   contactsAvailable:true,
  });
  expect(rows).toHaveLength(2);
  const canonical=rows.find(row=>row.companyId==="employer-A");
  expect(canonical).toMatchObject({contacts:1,drives:1,offers:1,acceptedOffers:1,confirmedJoinedLearners:1});
  expect(rows.find(row=>row.unlinkedLeadGroup)).toMatchObject({
   companyId:null,contacts:1,drives:0,offers:0,confirmedJoinedLearners:0,
  });
 });
 it("uses tenant-scoped company sources and never invents season comparison figures",()=>{
  const s=source("src/modules/placements/tpo-companies-view-service.ts");
  const display=source("src/components/tpo/tpo-companies-spreadsheet.tsx");
  expect(s).toContain("await requireTpoBatchActor(context)");
  expect(s).toContain("await requirePlacementManageScope(context, collegeId)");
  expect(display).toContain('focused.contacts===null?"Unavailable":focused.contacts');
  expect(display).toContain('focused.confirmedJoinedLearners');
  expect(display).toContain("Confirmed joins are not the same as placed students.");
 });
});
