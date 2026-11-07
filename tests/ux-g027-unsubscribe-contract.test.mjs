import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const token = read("src/app/campaign-unsubscribe/[token]/page.tsx");
const confirm = read("src/components/placements/campaign-unsubscribe-confirm.tsx");
const completed = read("src/app/campaign-unsubscribe/confirmed/page.tsx");
const api = read("src/app/api/public/campaign-unsubscribe/route.ts");

test("UX-G027 link GET does not reveal recipient validity or mutate opt-out", () => {
  assert.match(token, /robots: \{ index: false, follow: false \}/);
  assert.match(token, /Opening this link does not unsubscribe you\./);
  assert.match(token, /No preference was changed\./);
  assert.doesNotMatch(token, /campaignUnsubscribeTokenKind\(|unsubscribeTpoCampaignRecipient\(/);
  assert.match(token, /<CampaignUnsubscribeConfirm token=\{token\} cell=\{true\}\/>/);
  assert.match(api, /if\(!isSameOriginRequest\(request\)\)/);
  assert.match(api, /if\(!claim\)return successResponse\(request,"placement-cell"\)/);
});

test("UX-G027 keyboard/screen-reader semantics, narrow tap target, failure recovery", () => {
  assert.match(token, /aria-labelledby="unsubscribe-heading"/);
  assert.match(token, /id="unsubscribe-details"/);
  assert.match(token, /max-w-xl/);
  assert.match(confirm, /aria-describedby="unsubscribe-details"/);
  assert.match(confirm, /aria-busy=\{pending\}/);
  assert.match(confirm, /role="status" aria-live="polite"/);
  assert.match(confirm, /role="alert"/);
  assert.match(confirm, /min-h-11 w-full sm:w-auto/);
  assert.match(confirm, /pendingRef\.current\|\|confirmed\|\|!token\.trim\(\)/);
  assert.match(confirm, /!response\.ok\|\|!response\.redirected/);
  assert.match(confirm, /url\.pathname!=="\/campaign-unsubscribe\/confirmed"/);
  assert.match(confirm, /That didn’t work\. Please try again\./);
});

test("UX-G027 confirmation preserves campaign scope and does not claim success on a failed POST", () => {
  assert.match(completed, /robots: \{ index: false, follow: false \}/);
  assert.match(completed, /scope === "placement-cell"/);
  assert.match(completed, /This placement cell will not email you again/);
  assert.match(completed, /Transactional account messages may use separate preferences/);
  assert.match(completed, /id="confirmation-title"/);
  assert.match(completed, /role="status"/);
  assert.match(completed, /min-h-11 w-full sm:w-auto/);
  assert.match(confirm, /setConfirmed\(true\)/);
  assert.match(confirm, /router\.replace\(url\.pathname\+url\.search\)/);
});
