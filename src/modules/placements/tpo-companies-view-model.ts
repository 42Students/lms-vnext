import { tpoCompanyKey } from "./tpo-company-memory-service";

export type TpoCompanyBase = {
  companyId: string;
  relationshipId: string;
  name: string;
  websiteUrl: string | null;
};

export type TpoCompanyContact = {
  id: string;
  companyRelationshipId: string | null;
  companyName: string | null;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string | null;
  updatedAt: Date;
};

export type TpoCompanyDrive = {
  id: string;
  relationshipId: string;
  title: string;
  status: string;
  employmentType: string;
  createdAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
};

export type TpoCompanyOffer = {
  id: string;
  jobId: string;
  membershipId: string;
  candidateName: string | null;
  roleTitle: string;
  status: string;
  annualCtcInr: number | null;
  issuedAt: Date;
  respondedAt: Date | null;
  joiningStatus: string | null;
  joiningRecordedAt: Date | null;
};

export type TpoCompanyActivity = {
  id: string;
  leadId: string;
  type: string;
  outcome: string | null;
  note: string | null;
  createdAt: Date;
};

export type TpoCompanyRow = {
  companyId: string | null;
  relationshipId: string | null;
  name: string;
  websiteUrl: string | null;
  contacts: number | null;
  drives: number;
  offers: number;
  acceptedOffers: number;
  confirmedJoinedLearners: number;
  unlinkedLeadGroup: boolean;
};

export type TpoCompanyTimelineEvent = {
  id: string;
  at: Date;
  type:
    | "CONTACT"
    | "DRIVE_CREATED"
    | "DRIVE_PUBLISHED"
    | "DRIVE_CLOSED"
    | "OFFER_ISSUED"
    | "OFFER_RESPONSE"
    | "JOINING_RECORDED";
  description: string;
  href: string | null;
};

export function buildTpoCompanyRows(input: {
  companies: readonly TpoCompanyBase[];
  contacts: readonly TpoCompanyContact[];
  drives: readonly TpoCompanyDrive[];
  offers: readonly TpoCompanyOffer[];
  contactsAvailable: boolean;
}): TpoCompanyRow[] {
  const rows = new Map<string, TpoCompanyRow>();
  const relationshipToCompany = new Map<string, string>();
  const driveToCompany = new Map<string, string>();
  const joinedByCompany = new Map<string, Set<string>>();

  for (const company of input.companies) {
    rows.set(company.companyId, {
      companyId: company.companyId,
      relationshipId: company.relationshipId,
      name: company.name,
      websiteUrl: company.websiteUrl,
      contacts: input.contactsAvailable ? 0 : null,
      drives: 0,
      offers: 0,
      acceptedOffers: 0,
      confirmedJoinedLearners: 0,
      unlinkedLeadGroup: false,
    });
    relationshipToCompany.set(
      company.relationshipId,
      company.companyId,
    );
  }

  for (const drive of input.drives) {
    const companyId = relationshipToCompany.get(
      drive.relationshipId,
    );
    if (!companyId) continue;

    driveToCompany.set(drive.id, companyId);
    const row = rows.get(companyId);
    if (row) row.drives += 1;
  }

  for (const offer of input.offers) {
    const companyId = driveToCompany.get(offer.jobId);
    if (!companyId) continue;

    const row = rows.get(companyId);
    if (!row) continue;

    row.offers += 1;

    if (offer.status === "ACCEPTED") {
      row.acceptedOffers += 1;
    }

    if (
      offer.status === "ACCEPTED" &&
      offer.joiningStatus === "JOINED"
    ) {
      const members =
        joinedByCompany.get(companyId) ?? new Set<string>();
      members.add(offer.membershipId);
      joinedByCompany.set(companyId, members);
    }
  }

  for (const [companyId, members] of joinedByCompany) {
    const row = rows.get(companyId);
    if (row) {
      row.confirmedJoinedLearners = members.size;
    }
  }

  const unlinked = new Map<string, TpoCompanyRow>();

  for (const contact of input.contacts) {
    const companyId = contact.companyRelationshipId
      ? relationshipToCompany.get(contact.companyRelationshipId)
      : undefined;

    if (companyId) {
      const row = rows.get(companyId);
      if (row && row.contacts !== null) {
        row.contacts += 1;
      }
      continue;
    }

    // A free-text company name is not proof of a canonical
    // relationship. Keep these leads separate rather than
    // attributing offers or drives to an unverified identity.
    const name = contact.companyName?.trim();
    if (!name) continue;

    const key = tpoCompanyKey(name);
    if (!key) continue;

    const current = unlinked.get(key);
    if (current) {
      current.contacts = (current.contacts ?? 0) + 1;
      continue;
    }

    unlinked.set(key, {
      companyId: null,
      relationshipId: null,
      name,
      websiteUrl: null,
      contacts: 1,
      drives: 0,
      offers: 0,
      acceptedOffers: 0,
      confirmedJoinedLearners: 0,
      unlinkedLeadGroup: true,
    });
  }

  return [...rows.values(), ...unlinked.values()].sort(
    (a, b) =>
      a.name.localeCompare(b.name) ||
      Number(a.unlinkedLeadGroup) -
        Number(b.unlinkedLeadGroup) ||
      (a.companyId ?? "").localeCompare(b.companyId ?? ""),
  );
}

export function filterTpoCompanyRows(
  rows: readonly TpoCompanyRow[],
  filter: {
    search?: string;
    page: number;
    pageSize: number;
  },
) {
  const search =
    filter.search?.trim().toLocaleLowerCase("en-IN") ?? "";

  const filtered = rows.filter((row) =>
    !search ||
    [row.name, row.websiteUrl].some((value) =>
      value?.toLocaleLowerCase("en-IN").includes(search),
    ),
  );

  const start = (filter.page - 1) * filter.pageSize;

  return {
    total: filtered.length,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages: Math.ceil(
      filtered.length / filter.pageSize,
    ),
    items: filtered.slice(start, start + filter.pageSize),
  };
}

/**
 * Timeline entries represent persisted timestamps only.
 * No inferred contact, invitation, selection or joining
 * event is inserted.
 */
export function buildTpoCompanyTimeline(input: {
  contacts: readonly TpoCompanyContact[];
  activities: readonly TpoCompanyActivity[];
  drives: readonly TpoCompanyDrive[];
  offers: readonly TpoCompanyOffer[];
}): TpoCompanyTimelineEvent[] {
  const people = new Map(
    input.contacts.map((contact) => [
      contact.id,
      contact.name,
    ]),
  );

  const events: TpoCompanyTimelineEvent[] = [];

  for (const activity of input.activities) {
    const person =
      people.get(activity.leadId) ?? "Recruiter contact";

    events.push({
      id: `activity:${activity.id}`,
      at: activity.createdAt,
      type: "CONTACT",
      description: [
        person,
        activity.type.replaceAll("_", " "),
        activity.outcome,
        activity.note,
      ].filter(Boolean).join(" · "),
      href: `/tpo/recruiters/${encodeURIComponent(
        activity.leadId,
      )}`,
    });
  }

  for (const drive of input.drives) {
    const href =
      `/tpo/placements/jobs/${encodeURIComponent(drive.id)}`;

    events.push({
      id: `drive-created:${drive.id}`,
      at: drive.createdAt,
      type: "DRIVE_CREATED",
      description: `Drive created: ${drive.title}`,
      href,
    });

    if (drive.publishedAt) {
      events.push({
        id: `drive-published:${drive.id}`,
        at: drive.publishedAt,
        type: "DRIVE_PUBLISHED",
        description: `Drive published: ${drive.title}`,
        href,
      });
    }

    if (drive.closedAt) {
      events.push({
        id: `drive-closed:${drive.id}`,
        at: drive.closedAt,
        type: "DRIVE_CLOSED",
        description: `Drive closed: ${drive.title}`,
        href,
      });
    }
  }

  for (const offer of input.offers) {
    const href =
      `/tpo/placements/jobs/${encodeURIComponent(offer.jobId)}`;

    events.push({
      id: `offer-issued:${offer.id}`,
      at: offer.issuedAt,
      type: "OFFER_ISSUED",
      description:
        `Offer issued: ${offer.roleTitle} · ` +
        (offer.candidateName || "Learner"),
      href,
    });

    if (offer.respondedAt) {
      events.push({
        id: `offer-response:${offer.id}`,
        at: offer.respondedAt,
        type: "OFFER_RESPONSE",
        description:
          `Current offer status: ${offer.status} · ` +
          (offer.candidateName || "Learner"),
        href,
      });
    }

    if (
      offer.joiningRecordedAt &&
      offer.joiningStatus &&
      offer.joiningStatus !== "PENDING"
    ) {
      events.push({
        id: `joining:${offer.id}`,
        at: offer.joiningRecordedAt,
        type: "JOINING_RECORDED",
        description:
          `Joining outcome: ${offer.joiningStatus} · ` +
          (offer.candidateName || "Learner"),
        href,
      });
    }
  }

  return events.sort(
    (a, b) =>
      b.at.getTime() - a.at.getTime() ||
      a.id.localeCompare(b.id),
  );
}
