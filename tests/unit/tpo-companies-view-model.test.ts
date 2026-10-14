import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildTpoCompanyRows,
  buildTpoCompanyTimeline,
  filterTpoCompanyRows,
  type TpoCompanyActivity,
  type TpoCompanyContact,
  type TpoCompanyDrive,
  type TpoCompanyOffer,
} from "@/modules/placements/tpo-companies-view-model";

const DATE = new Date("2026-10-14T10:00:00.000Z");

const companies = [
  {
    companyId: "company-1",
    relationshipId: "relationship-1",
    name: "Acme Technologies",
    websiteUrl: "https://acme.example",
  },
  {
    companyId: "company-2",
    relationshipId: "relationship-2",
    name: "Beta Systems",
    websiteUrl: null,
  },
];

const contacts: TpoCompanyContact[] = [
  {
    id: "lead-1",
    companyRelationshipId: "relationship-1",
    companyName: "Acme Technologies",
    name: "Recruiter One",
    designation: "Manager",
    email: "one@example.test",
    phone: null,
    stage: "CONTACTED",
    source: "REFERRAL",
    updatedAt: DATE,
  },
  {
    id: "lead-unlinked-1",
    companyRelationshipId: null,
    companyName: "ACME TECHNOLOGIES LTD",
    name: "Unlinked Recruiter",
    designation: null,
    email: "unlinked@example.test",
    phone: null,
    stage: "NEW",
    source: "MANUAL",
    updatedAt: DATE,
  },
  {
    id: "lead-unlinked-2",
    companyRelationshipId: null,
    companyName: "Acme Technologies Limited",
    name: "Another Unlinked Recruiter",
    designation: null,
    email: "other@example.test",
    phone: null,
    stage: "NEW",
    source: null,
    updatedAt: DATE,
  },
];

const drives: TpoCompanyDrive[] = [
  {
    id: "job-1",
    relationshipId: "relationship-1",
    title: "Software Engineer",
    status: "CLOSED",
    employmentType: "FULL_TIME",
    createdAt: DATE,
    publishedAt: DATE,
    closedAt: DATE,
    archivedAt: null,
  },
  {
    id: "job-2",
    relationshipId: "relationship-2",
    title: "Intern",
    status: "DRAFT",
    employmentType: "INTERNSHIP",
    createdAt: DATE,
    publishedAt: null,
    closedAt: null,
    archivedAt: null,
  },
];

const offers: TpoCompanyOffer[] = [
  {
    id: "offer-1",
    jobId: "job-1",
    membershipId: "learner-1",
    candidateName: "Learner One",
    roleTitle: "Software Engineer",
    status: "ACCEPTED",
    annualCtcInr: 1000000,
    issuedAt: DATE,
    respondedAt: DATE,
    joiningStatus: "JOINED",
    joiningRecordedAt: DATE,
  },
  {
    id: "offer-2",
    jobId: "job-1",
    membershipId: "learner-1",
    candidateName: "Learner One",
    roleTitle: "Software Engineer",
    status: "DECLINED",
    annualCtcInr: 1000000,
    issuedAt: DATE,
    respondedAt: DATE,
    joiningStatus: null,
    joiningRecordedAt: null,
  },
];

describe("TPO companies pure aggregation", () => {
  it("counts persisted offers and distinct confirmed joins per canonical company", () => {
    const rows = buildTpoCompanyRows({
      companies,
      contacts,
      drives,
      offers,
      contactsAvailable: true,
    });

    const acme = rows.find(
      (row) => row.companyId === "company-1",
    );

    expect(acme).toMatchObject({
      contacts: 1,
      drives: 1,
      offers: 2,
      acceptedOffers: 1,
      confirmedJoinedLearners: 1,
      unlinkedLeadGroup: false,
    });

    const beta = rows.find(
      (row) => row.companyId === "company-2",
    );

    expect(beta).toMatchObject({
      contacts: 0,
      drives: 1,
      offers: 0,
      confirmedJoinedLearners: 0,
    });
  });

  it("never merges free-text company names into a canonical company ID", () => {
    const rows = buildTpoCompanyRows({
      companies,
      contacts,
      drives,
      offers,
      contactsAvailable: true,
    });

    const unlinked = rows.filter(
      (row) => row.unlinkedLeadGroup,
    );

    expect(unlinked).toHaveLength(1);

    expect(unlinked[0]).toMatchObject({
      companyId: null,
      relationshipId: null,
      contacts: 2,
      drives: 0,
      offers: 0,
      acceptedOffers: 0,
    });
  });

  it("reports unavailable CRM data as null instead of fabricated zeroes", () => {
    const rows = buildTpoCompanyRows({
      companies,
      contacts: [],
      drives,
      offers,
      contactsAvailable: false,
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.contacts === null)).toBe(true);
    expect(rows[0].drives).toBeGreaterThanOrEqual(0);
  });

  it("supports deterministic search and pagination", () => {
    const rows = buildTpoCompanyRows({
      companies,
      contacts: [],
      drives,
      offers,
      contactsAvailable: true,
    });

    expect(
      filterTpoCompanyRows(rows, {
        search: "BETA",
        page: 1,
        pageSize: 25,
      }).items.map((row) => row.name),
    ).toEqual(["Beta Systems"]);

    const first = filterTpoCompanyRows(rows, {
      page: 1,
      pageSize: 1,
    });

    const second = filterTpoCompanyRows(rows, {
      page: 2,
      pageSize: 1,
    });

    expect(first.total).toBe(2);
    expect(first.totalPages).toBe(2);
    expect(first.items[0].companyId).not.toBe(
      second.items[0].companyId,
    );
  });

  it("builds a descending timeline exclusively from persisted timestamps", () => {
    const activities: TpoCompanyActivity[] = [
      {
        id: "activity-1",
        leadId: "lead-1",
        type: "CALL",
        outcome: "REPLIED",
        note: "Discussed campus hiring",
        createdAt: new Date("2026-10-13T10:00:00.000Z"),
      },
    ];

    const timeline = buildTpoCompanyTimeline({
      contacts,
      activities,
      drives: [drives[0]],
      offers: [offers[0]],
    });

    expect(timeline.some((event) =>
      event.id === "activity:activity-1",
    )).toBe(true);

    expect(timeline.some((event) =>
      event.type === "JOINING_RECORDED",
    )).toBe(true);

    expect(timeline.some((event) =>
      event.type === "DRIVE_CREATED",
    )).toBe(true);

    expect(timeline.filter((event) =>
      event.type === "OFFER_ISSUED" || event.type === "OFFER_RESPONSE" ||
      event.type === "JOINING_RECORDED",
    ).every((event) =>
      event.href === "/tpo/placements/jobs/job-1/offers/offer-1",
    )).toBe(true);

    expect(timeline.every(
      (event) => Number.isFinite(event.at.getTime()),
    )).toBe(true);

    for (let index = 1; index < timeline.length; index += 1) {
      expect(
        timeline[index - 1].at.getTime(),
      ).toBeGreaterThanOrEqual(
        timeline[index].at.getTime(),
      );
    }
  });

  it("does not manufacture joining events without persisted joining outcome", () => {
    const timeline = buildTpoCompanyTimeline({
      contacts: [],
      activities: [],
      drives: [],
      offers: [{
        ...offers[0],
        joiningStatus: null,
        joiningRecordedAt: null,
      }],
    });

    expect(timeline.map((event) => event.type)).toEqual([
      "OFFER_ISSUED",
      "OFFER_RESPONSE",
    ]);
  });
});
