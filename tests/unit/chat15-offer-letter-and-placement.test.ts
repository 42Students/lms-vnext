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
  // Sanitize the persisted URL before it crosses the server-to-client boundary.\n  // The page only forwards the already-safe projection to the offer card.\n  expect(service).toContain("letterHref:safeLearnerOfferLetterHref(row.offer.letterHref)");\n  expect(page).toContain("letterHref: row.offer.letterHref");
  const card=source("src/components/placements/learner-placement-offers.tsx");
  expect(card).toContain('<ButtonLink variant="secondary" href={item.letterHref} rel="noopener noreferrer"');
  expect(card).not.toContain('target="_blank"');
  expect(card).toContain("View offer letter</ButtonLink>");
 });
 it("LEARNER-placements-45 reflects internship and LOI cascade exceptions",()=>{
  // The college's persisted placed-count decision wins over employment type.
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobCountsAsPlaced:true})).toBe(true);
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobCountsAsPlaced:false})).toBe(false);
  expect(learnerOfferCountsAsPlaced({kind:"OFFER",jobCountsAsPlaced:null})).toBeNull();
  expect(learnerOfferCountsAsPlaced({kind:"LOI",jobCountsAsPlaced:true})).toBe(false);
  expect(learnerOfferCountsAsPlaced({kind:"LOI",jobCountsAsPlaced:null})).toBe(false);
  const page=source("src/app/(authenticated)/learn/my-placements/offers/page.tsx");
  expect(page).toContain("countsAsPlaced: learnerOfferCountsAsPlaced");
  expect(page).toContain("jobCountsAsPlaced:row.job.countsAsPlaced");
  const cascade=source("src/modules/placements/offer-service.ts");
  expect(cascade).toContain("const acceptedCountsAsPlaced");
  expect(cascade).toContain("current.job.countsAsPlaced");
  expect(cascade).toContain("siblingCountsAsPlaced");
  expect(cascade).not.toContain("!isPlacementInternship(current.job.employmentType)");
  const card=source("src/components/placements/learner-placement-offers.tsx");
  expect(card).toContain("Counts as placed</dt>");
  expect(card).toContain("No (college policy)");
  expect(card).toContain("Not confirmed");
  expect(card).toContain("No (letter of intent)");
 });
});
