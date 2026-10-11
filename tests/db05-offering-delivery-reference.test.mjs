/**
 * DB-008: pure source-contract model for offering/delivery graph scope.
 * This is NOT an API, Drizzle, PostgreSQL or concurrency integration test.
 */
import assert from "node:assert/strict";
import test from "node:test";

function offeringAllowed(input) {
  const {
    courseCollege, cohortProgramCollege, offeringPeriodCollege,
    cohortStartCollege, cohortEndCollege,
    offeringStart, offeringEnd, cohortStart, cohortEnd,
  } = input;
  if (!courseCollege || !cohortProgramCollege || !offeringPeriodCollege ||
      !cohortStartCollege) return false;
  if (courseCollege !== cohortProgramCollege ||
      courseCollege !== offeringPeriodCollege ||
      courseCollege !== cohortStartCollege) return false;
  if (cohortEnd !== null &&
      (!cohortEndCollege || courseCollege !== cohortEndCollege)) return false;
  if (offeringStart < cohortStart) return false;
  if (cohortEnd !== null && offeringEnd > cohortEnd) return false;
  return true;
}

function deliveryAllowed(input) {
  const {
    offeringCohort, offeringPeriod, offeringCourseCollege,
    offeringPeriodCollege, sectionCohort, sectionPeriod,
    sectionPeriodCollege, sectionProgramCollege,
  } = input;
  return Boolean(
    offeringCohort && offeringPeriod && offeringCourseCollege &&
    offeringPeriodCollege && sectionCohort && sectionPeriod &&
    sectionPeriodCollege && sectionProgramCollege &&
    offeringCohort === sectionCohort &&
    offeringPeriod === sectionPeriod &&
    offeringCourseCollege === offeringPeriodCollege &&
    offeringCourseCollege === sectionPeriodCollege &&
    offeringCourseCollege === sectionProgramCollege
  );
}
const offering = {
  courseCollege: "college-a",
  cohortProgramCollege: "college-a",
  offeringPeriodCollege: "college-a",
  cohortStartCollege: "college-a",
  cohortEndCollege: "college-a",
  offeringStart: "2026-07-01",
  offeringEnd: "2026-12-31",
  cohortStart: "2026-06-01",
  cohortEnd: "2027-05-31",
};
const delivery = {
  offeringCohort: "cohort-a", offeringPeriod: "period-1",
  offeringCourseCollege: "college-a", offeringPeriodCollege: "college-a",
  sectionCohort: "cohort-a", sectionPeriod: "period-1",
  sectionPeriodCollege: "college-a", sectionProgramCollege: "college-a",
};

const offeringCases = [
  ["valid same-college offering and dates", {}, true],
  ["course college differs from cohort program", { cohortProgramCollege: "college-b" }, false],
  ["offering academic period differs from course college", { offeringPeriodCollege: "college-b" }, false],
  ["cohort start academic period differs", { cohortStartCollege: "college-b" }, false],
  ["cohort expected end academic period differs", { cohortEndCollege: "college-b" }, false],
  ["missing start-period college fails closed", { cohortStartCollege: null }, false],
  ["offering starts before cohort start", { offeringStart: "2026-05-01" }, false],
  ["offering ends after cohort expected end", { offeringEnd: "2027-08-01" }, false],
  ["offering on cohort start boundary allowed", { offeringStart: "2026-06-01" }, true],
  ["offering on expected end boundary allowed", { offeringEnd: "2027-05-31" }, true],
  ["open-ended cohort has no upper-bound restriction", { cohortEnd: null, cohortEndCollege: null, offeringEnd: "2030-01-01" }, true],
];
for (const [name, changes, expected] of offeringCases) {
  test("offering contract: " + name, () =>
    assert.equal(offeringAllowed({ ...offering, ...changes }), expected));
}

const deliveryCases = [
  ["valid same cohort, period and college", {}, true],
  ["different section cohort even inside college", { sectionCohort: "cohort-b" }, false],
  ["different section term even inside college", { sectionPeriod: "period-2" }, false],
  ["different section period college", { sectionPeriodCollege: "college-b" }, false],
  ["different section program college", { sectionProgramCollege: "college-b" }, false],
  ["different offering period college", { offeringPeriodCollege: "college-b" }, false],
  ["missing offering cohort fails closed", { offeringCohort: null }, false],
  ["missing section program college fails closed", { sectionProgramCollege: null }, false],
];
for (const [name, changes, expected] of deliveryCases) {
  test("delivery contract: " + name, () =>
    assert.equal(deliveryAllowed({ ...delivery, ...changes }), expected));
}
