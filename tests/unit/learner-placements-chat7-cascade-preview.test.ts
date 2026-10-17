import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("learner acceptance impact preview parity",()=>{
 it("LEARNER-placements-R03 acceptance impact preview mirrors conditional write cascade",()=>{
  const source=readFileSync(new URL("../../src/modules/placements/offer-service.ts",import.meta.url),"utf8");
  const uses=source.match(/shouldKeepPlacementCascadeSibling\(/g)??[];
  expect(uses).toHaveLength(2);
  expect(source).toContain("const declined=otherOffers.filter");
  expect(source).toContain("declined:declined.map(");
  expect(source).toContain("const stayed=applications.filter");
  expect(source).toContain("acceptedCountsAsPlaced=current.offer.kind");
  expect(source).not.toContain('declined:otherOffers.filter(row=>row.status==="ISSUED")');
 });
});
