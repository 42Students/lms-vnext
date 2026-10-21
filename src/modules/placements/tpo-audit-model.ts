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

/** About tab uses an entity-category vocabulary independent of event kind.
 * Keep current event-kind filters intact for existing URLs and counters. */
export const TPO_AUDIT_ABOUT_CATEGORIES=[
 {value:"DRIVE",label:"Drives"},
 {value:"RECRUITER_LEAD",label:"Recruiters"},
 {value:"STUDENT",label:"Students"},
 {value:"OFFER",label:"Offers"},
 {value:"ROUND",label:"Rounds"},
 {value:"SHARE",label:"Shares and downloads"},
 {value:"SETTINGS",label:"Settings"},
 {value:"BULK",label:"Bulk actions"},
 {value:"GENERAL",label:"General"},
] as const;
export type TpoAuditAboutCategory=(typeof TPO_AUDIT_ABOUT_CATEGORIES)[number]["value"];
/** Stable fallback keeps unknown event names in General; it never drops them. */
export function tpoAuditAboutCategory(eventType:string,subjectType?:string|null):TpoAuditAboutCategory{
 const value=(eventType+" "+(subjectType??"")).toUpperCase();
 if(value.includes("BULK"))return "BULK";
 if(value.includes("SETTINGS")||value.includes("RULES")||value.includes("CONFIG"))return "SETTINGS";
 if(value.includes("SHARE")||value.includes("DOWNLOAD"))return "SHARE";
 if(value.includes("RECRUITER")||value.includes("LEAD"))return "RECRUITER_LEAD";
 if(value.includes("STUDENT")||value.includes("LEARNER"))return "STUDENT";
 if(value.includes("OFFER"))return "OFFER";
 if(value.includes("ROUND")||value.includes("RESULT")||value.includes("ATTENDANCE"))return "ROUND";
 if(value.includes("DRIVE")||value.includes("JOB")||value.includes("APPLICATION"))return "DRIVE";
 return "GENERAL";
}

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
   RECRUITER_LEADS_CREATED:"Recruiter lead added",
   RECRUITER_LEADS_CONTACT_UPDATED:"Recruiter contact updated",
   RECRUITER_LEADS_STAGE_SET:"Recruiter lead stage changed",
   RECRUITER_LEADS_INVITE_LINK_CREATED:"Recruiter invite link created",
   RECRUITER_LEADS_OWNER_SET:"Recruiter lead owner changed",
   RECRUITER_LEADS_IMPORTED:"Recruiter leads imported",
   RECRUITER_LEADS_INVITED_BY_EMAIL:"Recruiter invitation emailed",
   PLACEMENTS_RECRUITER_BULK_STAGE:"Bulk recruiter stages updated",
   PLACEMENTS_RECRUITER_BULK_OWNER:"Recruiter lead owner changed",
   PLACEMENTS_RECRUITER_BULK_UNDO:"Bulk recruiter update undone",
   "placements.tpo_team.work_handed_over":"Placement ownership handed over",
   "placements.tpo_team.unowned_assigned":"Unowned placement work assigned",
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
   "placements.tpo_recruiter_access.extended":"Recruiter access extended",
   "placements.tpo_company_visibility.updated":"Company sharing settings changed",
   "placements.tpo_public_placement.updated":"Public placements setting changed",
   "placements.tpo_prep_readiness.updated":"Preparation readiness changed",
   "placements.tpo_blocked_date.created":"Blocked dates changed",
   "placements.tpo_blocked_date.deleted":"Blocked dates changed",
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
