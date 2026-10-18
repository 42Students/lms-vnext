import { tenantLifecycleQuerySchema } from "./admin-tenant-lifecycle-model";
export const TENANT_DIRECTORY_CSV_CAP = 1000;
export const tenantDirectoryExportQuerySchema = tenantLifecycleQuerySchema.omit({ page: true });
export type TenantDirectoryExportRow = {
  id: string; name: string; code: string; status: string; organizationId: string;
  organizationName: string; organizationStatus: string; city: string | null;
  state: string | null; country: string | null; createdAt: Date; updatedAt: Date;
};
/** Unicode format controls and combining marks can hide spreadsheet
 * formulas before =, +, -, or @. Guard the complete original field so
 * Excel/LibreOffice cannot reinterpret a tenant-controlled name as a formula. */
export function tenantDirectoryCsvCell(value: string) {
  const firstVisible = value.replace(/^[\s\p{Cf}\p{Mn}]*/u, "");
  const safe = /^[=+@-]/u.test(firstVisible) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function buildTenantDirectoryCsv(rows: readonly TenantDirectoryExportRow[], truncated: boolean) {
  const header = ["College ID", "College Name", "College Code", "College Status", "Organization ID", "Organization Name",
    "Organization Status", "City", "State", "Country", "Created (IST)", "Updated (IST)"];
  const format = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const lines = [header.map(tenantDirectoryCsvCell).join(",")];
  for (const row of rows.slice(0, TENANT_DIRECTORY_CSV_CAP)) lines.push([
    row.id, row.name, row.code, row.status, row.organizationId, row.organizationName, row.organizationStatus,
    row.city ?? "", row.state ?? "", row.country ?? "", format.format(row.createdAt) + " IST", format.format(row.updatedAt) + " IST",
  ].map(tenantDirectoryCsvCell).join(","));
  if (truncated || rows.length > TENANT_DIRECTORY_CSV_CAP) {
    const footer: string[] = Array.from({ length: header.length }, () => "");
    footer[0] = "EXPORT TRUNCATED";
    footer[1] = `Only the first ${TENANT_DIRECTORY_CSV_CAP} matching tenants in name order were exported. Narrow filters for remaining records.`;
    lines.push(footer.map(tenantDirectoryCsvCell).join(","));
  }
  return "\ufeff" + lines.join("\r\n");
}
export function tenantDirectoryExportHref(raw: unknown) {
  const query = tenantDirectoryExportQuerySchema.parse(raw), params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.status !== "ACTIVE") params.set("status", query.status);
  return "/api/admin/tenants/export" + (params.size ? `?${params}` : "");
}
export function readTenantDirectoryExportParams(params: URLSearchParams) {
  const input: Record<string, string | string[]> = {};
  for (const key of params.keys()) {
    const values = params.getAll(key);
    input[key] = values.length === 1 ? values[0] : values;
  }
  return tenantDirectoryExportQuerySchema.parse(input);
}
