import {describe,it,expect} from "vitest";
import {buildAccreditationStudentRows,type AccreditationStudentOffer} from "../../src/modules/placements/tpo-accreditation-students-model";
const offer=(status:string,kind="OFFER"):AccreditationStudentOffer=>({
 membershipId:"learner",offerId:"offer-"+status+"-"+kind,name:"Example",
 rollNumber:"R1",programme:"BTech",branch:"CSE",batch:"2099",
 company:"Employer",status,kind,annualCtcInr:1000000,joining:null,
});
describe("Accreditation placed student policy",()=>{
 it("TPO-calendar-reports-R01 includes released offers for OFFER_RELEASED but not for OFFER_ACCEPTED",()=>{
  const rows=[offer("ISSUED")];
  expect(buildAccreditationStudentRows(rows,"OFFER_RELEASED")).toHaveLength(1);
  expect(buildAccreditationStudentRows(rows,"OFFER_ACCEPTED")).toHaveLength(0);
  expect(buildAccreditationStudentRows([offer("ACCEPTED")],"OFFER_ACCEPTED")).toHaveLength(1);
 });
 it("TPO-calendar-reports-R01 includes a recorded selection with no released offer",()=>{
  expect(buildAccreditationStudentRows([{...offer("ISSUED"),offerId:"selection-1",status:"SELECTED",selectedOutcome:true}],"SELECTED")).toHaveLength(1);
  expect(buildAccreditationStudentRows([{...offer("ISSUED"),offerId:"selection-1",status:"SELECTED",selectedOutcome:false}],"SELECTED")).toHaveLength(0);
 });
 it("TPO-calendar-reports-R01 never counts an LOI as an accepted full-time offer",()=>{
  expect(buildAccreditationStudentRows([offer("ISSUED","LOI")],"OFFER_RELEASED")).toHaveLength(0);
  expect(buildAccreditationStudentRows([offer("DECLINED")],"OFFER_RELEASED")).toHaveLength(0);
 });
});
