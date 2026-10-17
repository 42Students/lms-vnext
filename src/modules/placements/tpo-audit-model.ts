export const TPO_AUDIT_KINDS = [
  "ACTIVITY",
  "APPLICATION",
  "SCREENING",
  "ROUND",
  "RESULT",
  "OFFER",
  "JOINING",
  "SHARE",
] as const;

export type TpoAuditKind =
  (typeof TPO_AUDIT_KINDS)[number];

export type TpoAuditKindFilter =
  | "ALL"
  | TpoAuditKind;

export const TPO_AUDIT_KIND_LABELS: Record<
  TpoAuditKind,
  string
> = {
  ACTIVITY: "Placement activity",
  APPLICATION: "Application changes",
  SCREENING: "Screening decisions",
  ROUND: "Round changes",
  RESULT: "Round results",
  OFFER: "Offer decisions",
  JOINING: "Joining changes",
  SHARE: "Shares and downloads",
};

export type TpoAuditUrlFilters = {
  kind?: TpoAuditKindFilter;
  from?: string;
  to?: string;
  q?: string;
  who?:string;
  page?: number;
  pageSize?: number;
};

export function tpoAuditHref(
  filters: TpoAuditUrlFilters,
): string {
  const params = new URLSearchParams();

  if (filters.kind && filters.kind !== "ALL") {
    params.set("kind", filters.kind);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }
  if(filters.who?.trim())params.set("who",filters.who.trim());

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (
    filters.pageSize &&
    filters.pageSize !== 25
  ) {
    params.set(
      "pageSize",
      String(filters.pageSize),
    );
  }

  const query = params.toString();

  return query
    ? `/tpo/audit?${query}`
    : "/tpo/audit";
}

export function summarizeTpoAuditKinds(
  groups: readonly {
    kind: TpoAuditKind;
    total: number;
  }[],
): {
  total: number;
  byKind: Record<TpoAuditKind, number>;
  decisionsAndChanges: number;
  shares: number;
  canonicalEvents: number;
} {
  const byKind: Record<TpoAuditKind, number> = {
    ACTIVITY: 0,
    APPLICATION: 0,
    SCREENING: 0,
    ROUND: 0,
    RESULT: 0,
    OFFER: 0,
    JOINING: 0,
    SHARE: 0,
  };

  for (const group of groups) {
    byKind[group.kind] += group.total;
  }

  return {
    total: Object.values(byKind).reduce(
      (sum, count) => sum + count,
      0,
    ),
    byKind,
    decisionsAndChanges:
      byKind.APPLICATION +
      byKind.SCREENING +
      byKind.ROUND +
      byKind.RESULT +
      byKind.OFFER +
      byKind.JOINING,
    shares: byKind.SHARE,
    canonicalEvents: byKind.ACTIVITY,
  };
}

export function formatTpoAuditEventType(
  value: string,
): string {
  const legacy:Record<string,string>={
   PLACEMENTS_COLLEGE_RULES_UPDATED:"Placement rules changed",
   "placements.tpo_job_type.created":"Job types changed",
   "placements.tpo_job_type.updated":"Job types changed",
   "placements.tpo_job_type.deleted":"Job types changed",
   "placements.tpo_bulk_undo.applied":"Bulk action undone",
   "placements.tpo_college_rules.changed":"Placement rules changed",
   "placements.tpo_communication_setting.updated":"Placement settings changed",
   "placements.tpo_followup.created":"Recruiter follow-up added",
   "placements.tpo_followup.moved":"Recruiter follow-up moved",
   "PLACEMENTS_RECRUITER_ACCESS_GRANTED":"Recruiter access granted",
   "PLACEMENTS_RECRUITER_ACCESS_REVOKED":"Recruiter access revoked",
  };
  if(Object.prototype.hasOwnProperty.call(legacy,value))return legacy[value];
  return value
    .replaceAll(/[._]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (character) =>
      character.toUpperCase(),
    );
}

/** TPO-settings-audit-90: show a safe actor name or an honest fallback, never UUIDs. */
export function tpoAuditActorLabel(displayName:string|null|undefined):string{
 return displayName?.trim()||"System / unknown";
}
