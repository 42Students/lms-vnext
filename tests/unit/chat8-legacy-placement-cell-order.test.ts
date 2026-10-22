import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("lane-8 legacy placement cell page section order",()=>{
 it("puts the original requests and rules immediately after registration and before newer extras",()=>{
  const page=readFileSync("src/app/(authenticated)/learn/my-placements/placement/page.tsx","utf8");
  const start=page.indexOf("<LearnerPlacementRegistration");
  const requests=page.indexOf('<section id="requests"');
  const rules=page.indexOf('<section id="rules"');
  const help=page.indexOf('Need help with a placement decision?');
  const offers=page.indexOf("{offerRows.length===0 ? (");
  const schedule=page.indexOf('<section id="schedule"');
  const notices=page.indexOf('<section id="notices"');
  expect(start).toBeGreaterThan(0);
  expect(requests).toBeGreaterThan(start);
  expect(rules).toBeGreaterThan(requests);
  expect(help).toBeGreaterThan(rules);
  expect(offers).toBeGreaterThan(help);
  expect(schedule).toBeGreaterThan(offers);
  expect(notices).toBeGreaterThan(schedule);
  expect(page).toContain('["Your requests","#requests"],["Placement rules","#rules"]');
  expect(page).toContain("Personal placement alerts are temporarily unavailable.");
  expect(page).toContain("Your placement requests are temporarily unavailable.");
  expect(page).toContain("LearnerPlacementOffers");
 });
});
