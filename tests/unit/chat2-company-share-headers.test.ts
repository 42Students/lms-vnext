import {describe,it,expect} from "vitest";
import {companyShareCsvResponseHeaders} from "../../src/modules/placements/company-share/export-headers-model";

describe("public company-share export headers",()=>{
 it("forbids caching, indexing and forwarding the bearer-token URL",()=>{
  const headers=companyShareCsvResponseHeaders();
  expect(headers["Cache-Control"]).toContain("no-store");
  expect(headers["Referrer-Policy"]).toBe("no-referrer");
  expect(headers["X-Robots-Tag"]).toContain("noindex");
  expect(headers["Content-Disposition"]).toContain("attachment");
  expect(headers["X-Content-Type-Options"]).toBe("nosniff");
 });
});
