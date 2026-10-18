import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("UX-hr-profile-01 preserves shared profile editor and authorized access",()=>{const s=readFileSync("src/app/(authenticated)/hr/profile/page.tsx","utf8");assert.match(s,/<RecruiterProfileDetailsEditor/);assert.match(s,/<RecruiterProfileAccess/);assert.match(s,/title="Profile"/);});
test("UX-hr-round-results-01 preserves shared error, empty and accessible links",()=>{const s=readFileSync("src/app/(authenticated)/hr/round-results/page.tsx","utf8");assert.match(s,/title="Round Results"/);assert.match(s,/<ErrorState/);assert.match(s,/<EmptyState/);assert.match(s,/focus-visible:outline-2/);assert.match(s,/text-\[var\(--lms-teal-deep\)\]/);assert.doesNotMatch(s,/text-primary-text/);});
