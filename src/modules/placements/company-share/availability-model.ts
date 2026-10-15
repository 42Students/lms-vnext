export type CompanyShareAvailability =
  | {kind:"READY"}
  | {kind:"MIGRATION_PENDING"};
export function companyShareAvailability(links: boolean, audit: boolean): CompanyShareAvailability {
  return links && audit ? {kind:"READY"} : {kind:"MIGRATION_PENDING"};
}
