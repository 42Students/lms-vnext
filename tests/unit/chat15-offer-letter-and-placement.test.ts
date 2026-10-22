import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {learnerOfferCountsAsPlaced,safeLearnerOfferLetterHref} from "@/modules/placements/learner-offer-letter-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-15 learner offers and internship truth",()=>{
 it("LEARNER-placements-45 only reveals persisted safe HTTPS employer letters",()=>{
  expect(safeLearnerOfferLetterHref("https://employer.example/offer.pdf")).toBe("https://employer.example/offer.pdf");
  for(const malformed of ["javascript:alert(1)","http://employer.example/offer.pdf",
   "https://user:secret@employer.example/offer.pdf","/api/admin/offers","data:text/html,hello",
   "https://employer.example/offer.pdf#fragment"]){
   expect(safeLearnerOfferLetterHref(malformed)).toBeNull();
  }
  expect(safeLearnerOfferLetterHref(null)).toBeNull();
  const service=source("src/modules/placements/offer-service.ts");
  expect(service).toContain("offer: placementOffers");
  expect(service).toContain("employmentType: placementJobRoleOptions.employmentType");
  const page=source("src/app/(authenticated)/learn/my-placements/offers/page.tsx");
  expect(page).toContain("safeLearnerOfferLetterHref(row.offer.offerLetterUrl)");
  const card=source("src/components/placements/learner-placement-offers.tsx");
  expect(card).toContain('<a href={item.letterHref} rel="noopener noreferrer"');
  expect(card).not.toContain('target="_blank"');
  expect(card).toContain("View offer letter</a>");
 });
 it("LEARNER-placements-45 reflects internship and LOI cascade exceptions",()=>{
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobEmploymentType:"FULL_TIME",roleEmploymentType:"FULL_TIME"})).toBe(true);
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobEmploymentType:"INTERNSHIP",roleEmploymentType:"FULL_TIME"})).toBe(false);
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobEmploymentType:"FULL_TIME",roleEmploymentType:"INTERNSHIP"})).toBe(false);
  expect(learnerOfferCountsAsPlaced({kind:"LOI",jobEmploymentType:"FULL_TIME",roleEmploymentType:"FULL_TIME"})).toBe(false);
  const page=source("src/app/(authenticated)/learn/my-placements/offers/page.tsx");
  expect(page).toContain("countsAsPlaced: learnerOfferCountsAsPlaced");
  expect(page).toContain("roleEmploymentType:row.role.employmentType");
  const cascade=source("src/modules/placements/offer-service.ts");
  expect(cascade).toContain("const acceptedCountsAsPlaced");
  expect(cascade).toContain("isPlacementInternship");
  const card=source("src/components/placements/learner-placement-offers.tsx");
  expect(card).toContain("Counts as placed</dt>");
  expect(card).toContain("No (internship)");
 });
});
