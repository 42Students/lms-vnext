import { adminUsersQuerySchema } from "./admin-user-directory-model";
export const SUPER_ADMIN_PEOPLE_CSV_CAP = 500;
export const adminUsersExportQuerySchema = adminUsersQuerySchema.omit({ page: true });
export type SuperAdminPeopleCsvRow = {
 membershipId: string; displayName: string | null; collegeName: string;
 platformStatus: string; membershipStatus: string; roles: readonly string[]; updatedAt: Date;
};
const cell = (raw: string) => {
 const safe = /^\s*[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
 return '"' + safe.replaceAll('"', '""') + '"';
};
/** Never export phone/email/identity UID, even in a selected college. */
export function buildSuperAdminPeopleCsv(rows: readonly SuperAdminPeopleCsvRow[], truncated: boolean) {
 const header = ["Membership ID","Name","College","Roles","Platform Status","Membership Status","Updated (IST)"];
 const date = new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 const lines = [header.map(cell).join(",")];
 for(const row of rows.slice(0,SUPER_ADMIN_PEOPLE_CSV_CAP))
  lines.push([row.membershipId,row.displayName??"",row.collegeName,row.roles.join("; "),row.platformStatus,row.membershipStatus,date.format(row.updatedAt)+" IST"].map(cell).join(","));
 if(truncated || rows.length>SUPER_ADMIN_PEOPLE_CSV_CAP)
  lines.push(["EXPORT TRUNCATED","Only first 500 memberships in name order were exported. Narrow filters.","","","","",""].map(cell).join(","));
 return "\ufeff"+lines.join("\r\n");
}
export function superAdminPeopleExportHref(raw: unknown) {
 const query=adminUsersQuerySchema.parse(raw),p=new URLSearchParams();
 if(query.tab!=="ALL")p.set("tab",query.tab);
 if(query.q)p.set("q",query.q);
 if(query.role!=="ALL")p.set("role",query.role);
 if(query.membershipStatus!=="ALL")p.set("membershipStatus",query.membershipStatus);
 if(query.platformStatus!=="ALL")p.set("platformStatus",query.platformStatus);
 return "/api/admin/people/export"+(p.size?"?"+p:"");
}
export function readSuperAdminPeopleExportParams(params:URLSearchParams) {
 const raw:Record<string,string|string[]>={};
 for(const key of params.keys()){const values=params.getAll(key);raw[key]=values.length===1?values[0]!:values;}
 return adminUsersExportQuerySchema.parse(raw);
}
