import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-17-23-080 stable learner offer acceptance lock order",()=>{
 it("serializes membership first and locks offer/application siblings in canonical UUID order",()=>{
  const src=readFileSync("src/modules/placements/offer-service.ts","utf8");
  const from=src.indexOf("const otherOffers = await tx.select(");
  const to=src.indexOf("const acceptedNoticeEvent=",from);
  expect(from).toBeGreaterThan(0);
  expect(to).toBeGreaterThan(from);
  const cascade=src.slice(from,to);
  expect(cascade).toContain('inArray(placementOffers.status,["ISSUED","ACCEPTED"])');
  expect(cascade).toContain('.orderBy(asc(placementOffers.id)).for("update")');
  expect(cascade).toContain('.orderBy(asc(placementApplications.id)).for("update")');
  expect(cascade).toContain("PLACEMENT_OFFER_ACTIVE_EXISTS");
  expect(cascade).toContain("eq(placementOffers.status,\"ISSUED\")");
  expect(cascade).toContain("eq(placementApplications.status,\"SUBMITTED\")");
  expect(src).toContain("// Serialize competing acceptances for the same learner.");
 });
});
