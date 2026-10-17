import {describe,it,expect} from "vitest";
import {buildTpoCompanyEngagement,joinTpoCompanyEngagementWithPlacement} from "../../src/modules/placements/tpo-company-engagement-model";
describe("TPO recruiter engagement evidence",()=>{
 it("TPO-calendar-reports-49 counts contacts, invited and joined from recorded CRM events only",()=>{
  const leads=[{id:"lead-1",companyRelationshipId:"rel-1",companyName:"Acme",inviteSentAt:"2099-05-01",recruiterUserId:null},
   {id:"lead-2",companyRelationshipId:"rel-1",companyName:"Acme",inviteSentAt:null,recruiterUserId:"recruiter-1"}];
  const rows=buildTpoCompanyEngagement(leads,[{leadId:"lead-1"},{leadId:"lead-1"}]);
  expect(rows).toMatchObject([{leads:2,contacts:2,invited:1,joined:1}]);
  const combined=joinTpoCompanyEngagementWithPlacement(rows.map(row=>({...row,companyId:"company-1"})),
   [{companyId:"company-1",companyName:"Acme",drives:2,placed:3}],new Map([["company-1",1]]));
  expect(combined[0]).toMatchObject({ranDrives:1,placed:3,contacts:2});
 });
});