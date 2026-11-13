import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = "src/app/(authenticated)/";
const read = (path) => readFileSync(root + path, "utf8");

test("UX-G073: all Mentor report and review routes authorize before parsing invalid filters", () => {
  for (const route of ["reports", "review-history", "reviews", "sprint-progress", "task-review-history"]) {
    const source = read("mentor/" + route + "/page.tsx");
    const guard = source.indexOf('hasMembershipRole(context,ROLE.MENTOR)') >= 0
      ? source.indexOf('hasMembershipRole(context,ROLE.MENTOR)')
      : source.indexOf('hasMembershipRole(context, ROLE.MENTOR)');
    assert.ok(guard >= 0, route + " must check Mentor membership");
    const parse = Math.min(...[
      source.indexOf("mentorReportsQuerySchema.safeParse"),
      source.indexOf("mentorReviewHistoryQuerySchema.safeParse"),
      source.indexOf("mentorReviewQuerySchema.safeParse"),
      source.indexOf("mentorSprintProgressQuerySchema.safeParse"),
      source.indexOf("mentorTaskHistoryQuerySchema.safeParse"),
    ].filter(x => x >= 0));
    assert.ok(Number.isFinite(parse) && guard < parse, route + " must authorize before showing filter recovery");
    assert.match(source, /redirect\("\/dashboard"\)/);
  }
});

test("UX-G073: actionable recovery never misrepresents failed reads as empty", () => {
  for (const route of ["reports", "review-history", "task-review-history", "sprint-progress"]) {
    const source = read("mentor/" + route + "/page.tsx");
    assert.match(source, /No (project report data|review history|task decisions|sprint progress data) (was|were) loaded/);
    assert.match(source, new RegExp('href="/mentor/' + route + '"'));
  }
  const queue=read("mentor/reviews/page.tsx");
  assert.match(queue, /hasFilters\?"Clear filters":"Projects"/);
  assert.match(queue, /hasFilters\?"\/mentor\/reviews":"\/mentor\/projects"/);
  const history=read("mentor/review-history/page.tsx");
  assert.match(history, /hasFilters\?"Clear filters":"Pending reviews"/);
});

test("UX-G121: Tracker issue recovery shows meaningful states and safe destinations", () => {
  const issues=read("tracker/issues/page.tsx");
  assert.match(issues, /No reported issues yet/);
  assert.match(issues, /No issues match these filters/);
  assert.match(issues, /hasFilters\?"Clear filters":"Report issue"/);
  assert.doesNotMatch(issues, /DB10_TRACKER_READY=DB10_VERIFIED/);
  const detail=read("tracker/issues/[publicId]/page.tsx");
  assert.match(detail, /href=\{isSuperAdmin\(context\)\?"\/tracker\/issues":"\/tracker\/mine"\}/);
  const loading=read("tracker/issues/[publicId]/loading.tsx");
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading the issue and its current status/);
  const audit=read("tracker/audit-findings/[publicId]/page.tsx");
  assert.equal(audit.split("await getCurrentRequestContext()").length-1,1);
  assert.match(audit, /No audit events have been recorded for this finding/);
});
