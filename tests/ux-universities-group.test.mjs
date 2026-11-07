import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(name, "utf8");
const page = read("src/app/universities/page.tsx");
const error = read("src/app/universities/error.tsx");
const loading = read("src/app/universities/loading.tsx");

test("UX-G123 preserves real campus capabilities and truthful public metadata", () => {
  for (const label of ["Academics","Learning","Assessment","Projects","Career readiness","Recruitment","Administration"]) {
    assert.ok(page.includes('title:"' + label + '"'), label);
  }
  assert.match(page, /marketingPageMetadata\("\/universities",title,description\)/);
  assert.match(page, /<MarketingLayout path="\/universities"/);
  assert.match(page, /<MarketingFeatureGrid title="For the entire campus"/);
  assert.doesNotMatch(page, /autonomous AI|AI-powered|guaranteed placement/i);
});
test("UX-G123 has touch-sized demo and direct section jumps", () => {
  assert.match(page, /<nav aria-label="Explore university solutions"/);
  assert.match(page, /href="#university-capabilities"/);
  assert.match(page, /href="#university-journey"/);
  assert.match(page, /href="\/request-demo"/);
  assert.match(page, /id="university-capabilities"/);
  assert.match(page, /id="university-journey"/);
  assert.match(page, /min-h-11 w-full sm:w-auto/);
  assert.doesNotMatch(page, /absolute -right-3/);
});
test("UX-G123 public recovery never strands visitors in a signed-in workspace", () => {
  assert.match(error, /GracefulErrorBoundary/);
  assert.match(error, /homeHref="\/"/);
  assert.doesNotMatch(error, /homeHref="\/dashboard"/);
  assert.match(loading, /GracefulPageLoading label="Loading university information/);
  assert.match(loading, /min-h-dvh/);
  assert.match(loading, /sm:grid-cols-2 lg:grid-cols-3/);
});
