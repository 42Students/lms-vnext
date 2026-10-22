import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {SuperAdminNeedsAttention} from "@/components/placements/super-admin-needs-attention";

describe("W1-2 legacy Needs attention count and sampled detail",()=>{
 const sample={code:"OFFERED_NO_LETTER",jobId:"11111111-1111-4111-8111-111111111111",
  jobTitle:"Campus Hiring",companyName:"Example Industries",
  count:4,priority:"HIGH",detail:"4 accepted or issued offers"};
 it("sums affected records, not flagged drive sample lengths",()=>{
  const html=renderToStaticMarkup(<SuperAdminNeedsAttention
   basePath="/admin/placements" items={[sample]} summary={[{
     code:"OFFERED_NO_LETTER",affected:15,jobs:8,samples:[sample],
   }]}/>);
  expect(html).toContain("Needs attention (15)");
  expect(html).toContain("Offered, no offer letter attached (15)");
  expect(html).toContain("Showing top");
  expect(html).toContain("1 of 8 flagged drives");
  expect(html).toContain("+7 more drives");
  expect(html).toContain("stage=ALL");
  expect(html).toContain("attention=OFFERED_NO_LETTER");
  expect(html).toContain("returnTo=");
  expect(html).not.toContain("stage=OFFERED");
 });
 it("preserves unavailable read separately from the true empty state",()=>{
  expect(renderToStaticMarkup(<SuperAdminNeedsAttention
   basePath="/admin/placements" items={[]} available={false}/>))
   .toContain("Couldn&#x27;t check for anything that needs attention.");
  expect(renderToStaticMarkup(<SuperAdminNeedsAttention
   basePath="/admin/placements" items={[]} summary={[]}/>))
   .toContain("No drives currently flagged in this view.");
 });
});
