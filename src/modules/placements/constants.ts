export const PLACEMENT_COMPANY_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;

export type PlacementCompanyStatus =
  (typeof PLACEMENT_COMPANY_STATUSES)[number];

export const PLACEMENT_COMPANY_RELATIONSHIP_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
] as const;

export type PlacementCompanyRelationshipStatus =
  (typeof PLACEMENT_COMPANY_RELATIONSHIP_STATUSES)[number];
