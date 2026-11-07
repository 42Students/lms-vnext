import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path, "utf8");
const company = read("src/app/company-join/[token]/page.tsx");
const companyLoading = read("src/app/company-join/[token]/loading.tsx");
const companyError = read("src/app/company-join/[token]/error.tsx");
const hr = read("src/app/hr-invite/[token]/page.tsx");
const hrLoading = read("src/app/hr-invite/[token]/loading.tsx");
const hrError = read("src/app/hr-invite/[token]/error.tsx");
const alias = read("src/modules/placements/recruiter-invite-alias-model.ts");
const canonical = read("src/app/recruiter-invite/[token]/page.tsx");

test("UX-G046 company bearer link is dynamic, noindex, noarchive and never referrered", () => {
  assert.match(company, /export const dynamic = "force-dynamic"/);
  assert.match(company, /index: false, follow: false, noarchive: true/);
  assert.match(company, /referrer: "no-referrer"/);
  assert.match(company, /getPublicJoinPreview\(token, "COMPANY"\)/);
  assert.match(company, /preview\.kind==="READY"/);
  assert.match(company, /scope="COMPANY"/);
  assert.match(company, /publicJoinUnavailableCopy/);
  assert.match(company, /PublicJoinPreviewRetry/);
  assert.match(company, /runAsSystem\("public-page:company-join"/);
  assert.doesNotMatch(company, /\bfetch\(|send-code|\/join"/);
});

test("UX-G046 public failure, retry, loading and error paths preserve accessible recovery", () => {
  const retry = read("src/components/placements/public-join-preview-retry.tsx");
  const form = read("src/components/placements/public-recruiter-join-form.tsx");
  assert.match(companyLoading, /Opening company invitation/);
  assert.match(companyLoading, /Checking invitation access/);
  assert.match(companyLoading, /Skeleton variant="line"/);
  assert.match(companyError, /GracefulErrorBoundary/);
  assert.match(companyError, /homeHref="\/"/);
  assert.match(retry, /Invitation preview unavailable/);
  assert.match(retry, /encodeURIComponent\(token\)/);
  assert.match(form, /submittingRef\.current/);
  assert.match(form, /pattern="\[0-9\]\{6\}"/);
  assert.match(form, /scope === "COMPANY" \? "\/api\/public\/company-join\/send-code"/);
  assert.match(form, /scope === "COMPANY" \? "\/api\/public\/company-join\/join"/);
});

test("UX-G057 legacy alias keeps its validated, single-purpose, privacy-safe redirect", () => {
  assert.match(hr, /export const dynamic = "force-dynamic"/);
  assert.match(hr, /index: false, follow: false, noarchive: true/);
  assert.match(hr, /referrer: "no-referrer"/);
  assert.match(hr, /redirect\(recruiterInviteHref\(token\)\)/);
  assert.match(hr, /error instanceof z\.ZodError/);
  assert.match(hr, /notFound\(\)/);
  assert.match(hr, /runAsSystem\("public-page:hr-invite"/);
  assert.doesNotMatch(hr, /fetch\(|\/accept|\/send-code/);
  assert.match(alias, /encodeURIComponent\(value\)/);
  assert.match(canonical, /referrer: "no-referrer"/);
  assert.match(hrLoading, /Opening recruiter invitation/);
  assert.match(hrError, /GracefulErrorBoundary/);
  assert.match(hrError, /homeHref="\/"/);
});
