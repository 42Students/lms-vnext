import { describe, expect, it } from "vitest";
import {
  buildTpoCompanyRows,
  buildTpoCompanyTimeline,
  filterTpoCompanyRows,
  type TpoCompanyContact,
  type TpoCompanyDrive,
  type TpoCompanyOffer,
} from "@/modules/placements/tpo-companies-view-model";
import {
  tpoCompaniesQuerySchema,
  tpoCompanyDetailQuerySchema,
} from "@/modules/placements/tpo-companies-view-service";

const COLLEGE = "22222222-2222-4222-8222-222222222222";
const ACME = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BETA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REL_ACME = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const REL_BETA = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const T = new Date("2026-10-18T09:00:00.000Z");

const contacts: TpoCompanyContact[] = [
  { id: "1", companyRelationshipId: REL_ACME, companyName: "Acme", name: "Primary recruiter", designation: null, email: null, phone: null, stage: "CONNECTED", source: null, updatedAt: T },
  { id: "2", companyRelationshipId: null, companyName: "Acme", name: "Unverified recruiter", designation: null, email: null, phone: null, stage: "NEW", source: null, updatedAt: T },
  { id: "3", companyRelationshipId: null, companyName: "Beta Inc", name: "Other unverified recruiter", designation: null, email: null, phone: null, stage: "NEW", source: null, updatedAt: T },
];
const drives: TpoCompanyDrive[] = [
  { id: "drive-acme", relationshipId: REL_ACME, title: "Engineer", status: "PUBLISHED", employmentType: "FULL_TIME", createdAt: T, publishedAt: T, closedAt: null, archivedAt: null },
  { id: "drive-beta", relationshipId: REL_BETA, title: "Analyst", status: "CLOSED", employmentType: "FULL_TIME", createdAt: T, publishedAt: T, closedAt: T, archivedAt: null },
  { id: "foreign-drive", relationshipId: "other-college-relationship", title: "Other tenant", status: "PUBLISHED", employmentType: "FULL_TIME", createdAt: T, publishedAt: null, closedAt: null, archivedAt: null },
];
const offers: TpoCompanyOffer[] = [
  { id: "offer1", jobId: "drive-acme", membershipId: "learner-1", candidateName: "A", roleTitle: "Engineer", status: "ACCEPTED", annualCtcInr: 100000, issuedAt: T, respondedAt: T, joiningStatus: "JOINED", joiningRecordedAt: T },
  { id: "offer2", jobId: "drive-acme", membershipId: "learner-1", candidateName: "A", roleTitle: "Engineer II", status: "ACCEPTED", annualCtcInr: 100000, issuedAt: T, respondedAt: T, joiningStatus: "JOINED", joiningRecordedAt: T },
  { id: "offer3", jobId: "drive-acme", membershipId: "learner-2", candidateName: "B", roleTitle: "Engineer", status: "ISSUED", annualCtcInr: 100000, issuedAt: T, respondedAt: null, joiningStatus: null, joiningRecordedAt: null },
  { id: "offer4", jobId: "foreign-drive", membershipId: "foreign-learner", candidateName: "C", roleTitle: "Engineer", status: "ACCEPTED", annualCtcInr: 100000, issuedAt: T, respondedAt: T, joiningStatus: "JOINED", joiningRecordedAt: T },
];
const input = {
  companies: [
    { companyId: ACME, relationshipId: REL_ACME, name: "Acme", websiteUrl: "https://acme.example" },
    { companyId: BETA, relationshipId: REL_BETA, name: "Beta", websiteUrl: null },
  ],
  contacts, drives, offers, contactsAvailable: true,
};

describe("TPO-companies-05/07 TPO canonical directory isolation", () => {
  it("keeps unlinked, name-equal recruiters apart from canonical companies", () => {
    const rows = buildTpoCompanyRows(input);
    const canonical = rows.find(row => row.companyId === ACME);
    const unlinked = rows.find(row => row.unlinkedLeadGroup && row.name === "Acme");
    expect(canonical).toMatchObject({ contacts: 1, drives: 1, offers: 3, acceptedOffers: 2, confirmedJoinedLearners: 1, unlinkedLeadGroup: false });
    expect(unlinked).toMatchObject({ companyId: null, contacts: 1, drives: 0, offers: 0, confirmedJoinedLearners: 0 });
    expect(rows.find(row => row.companyId === BETA)?.drives).toBe(1);
    expect(rows.some(row => row.name === "Other tenant")).toBe(false);
    expect(rows.reduce((sum, row) => sum + row.confirmedJoinedLearners, 0)).toBe(1);
  });

  it("represents unknown CRM migration as unavailable, not zero", () => {
    const rows = buildTpoCompanyRows({ ...input, contacts: [], contactsAvailable: false });
    expect(rows.find(row => row.companyId === ACME)?.contacts).toBeNull();
  });

  it("does not count two accepted offers as two joined learners", () => {
    const rows = buildTpoCompanyRows(input);
    expect(rows.find(row => row.companyId === ACME)?.acceptedOffers).toBe(2);
    expect(rows.find(row => row.companyId === ACME)?.confirmedJoinedLearners).toBe(1);
  });
});

describe("TPO-companies-10/11 directory pagination and validation", () => {
  const rows = buildTpoCompanyRows(input);
  it("uses deterministic sorting, trims search and never returns an out-of-range page as the first page", () => {
    const first = filterTpoCompanyRows(rows, { page: 1, pageSize: 2, sort: "CONTACTS" });
    const second = filterTpoCompanyRows(rows, { page: 2, pageSize: 2, sort: "CONTACTS" });
    expect(first.total).toBe(4);
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(new Set([...first.items, ...second.items].map(x => x.name + String(x.unlinkedLeadGroup))).size).toBe(4);
    expect(filterTpoCompanyRows(rows, { search: "  ACME  ", page: 1, pageSize: 25 }).total).toBe(2);
    expect(filterTpoCompanyRows(rows, { page: 999, pageSize: 25 }).items).toEqual([]);
  });

  it("rejects malformed tenant, excessive page size, unknown filter keys and malformed company IDs", () => {
    expect(tpoCompaniesQuerySchema.safeParse({ collegeId: COLLEGE }).success).toBe(true);
    expect(tpoCompaniesQuerySchema.safeParse({ collegeId: "forged" }).success).toBe(false);
    expect(tpoCompaniesQuerySchema.safeParse({ collegeId: COLLEGE, pageSize: 200 }).success).toBe(false);
    expect(tpoCompaniesQuerySchema.safeParse({ collegeId: COLLEGE, malicious: "cross-tenant" }).success).toBe(false);
    expect(tpoCompanyDetailQuerySchema.safeParse({ collegeId: COLLEGE, companyId: ACME }).success).toBe(true);
    expect(tpoCompanyDetailQuerySchema.safeParse({ collegeId: COLLEGE, companyId: "../private" }).success).toBe(false);
  });
});

describe("TPO-companies-24 activity chronology", () => {
  it("reports only persisted activity and uses stable chronological ordering without invented contacts", () => {
    const events = buildTpoCompanyTimeline({ contacts, activities: [], drives: [drives[0]], offers: [offers[0]] });
    expect(events.some(event => event.type === "CONTACT")).toBe(false);
    expect(events.map(event => event.type)).toContain("DRIVE_PUBLISHED");
    expect(events.map(event => event.type)).toContain("JOINING_RECORDED");
    expect(events.length).toBe(5);
    expect(events.every(event => event.at.getTime() === T.getTime())).toBe(true);
    expect(events.every((e, idx) => idx === 0 || events[idx - 1].id.localeCompare(e.id) <= 0)).toBe(true);
  });
});
