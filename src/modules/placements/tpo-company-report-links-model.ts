import type { PlacementReportCompanyRow } from "./report-model";

/** The report is already scoped by college/season before this projection. */
export function buildTpoCompanyReportLinks(
  companies: readonly Pick<PlacementReportCompanyRow, "companyId" | "companyName">[],
) {
  const unique = [...new Map(companies.filter(item =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.companyId)
  ).map(item => [item.companyId, item])).values()]
    .sort((a,b)=>a.companyName.localeCompare(b.companyName)||a.companyId.localeCompare(b.companyId));
  return {
    total: unique.length,
    truncated: unique.length > 100,
    rows: unique.slice(0,100).map(item => ({
      id: item.companyId,
      name: item.companyName,
      href: "/tpo/companies/" + encodeURIComponent(item.companyId),
    })),
  };
}
