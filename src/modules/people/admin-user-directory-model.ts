import { z } from "zod";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, USER_PLATFORM_STATUSES } from "@/modules/identity/constants";
export const adminUsersQuerySchema = z.object({
  tab: z.enum(["ALL","FACULTY","STUDENT"]).default("ALL"),
  q: z.string().trim().max(100).default(""),
  role: z.union([z.enum(MEMBERSHIP_ROLES), z.literal("ALL")]).default("ALL"),
  membershipStatus: z.union([z.enum(MEMBERSHIP_STATUSES), z.literal("ALL")]).default("ALL"),
  platformStatus: z.union([z.enum(USER_PLATFORM_STATUSES), z.literal("ALL")]).default("ALL"),
  page: z.union([z.number().int(), z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int())])
    .pipe(z.number().int().min(1).max(100000)).default(1),
}).strict();
/** Backend cursors remain 30 records; the legacy contact viewport shows 10
 * and offers 10/20/50 without changing tenant-scoped read authorization. */
export const ADMIN_USERS_PAGE_SIZE = 30;
export const ADMIN_USERS_VIEW_PAGE_SIZE = 10;
export const ADMIN_USERS_VIEW_PAGE_CHOICES = [10,20,50] as const;

/** The old ?view= bookmark is an alias, not a second persisted tab state.
 * Explicit vNext ?tab= takes precedence over ?view= as in the page route. */
export function adminUsersLegacyViewTab(view:unknown,tab:unknown){
  if(tab!==undefined)return z.enum(["ALL","FACULTY","STUDENT"]).parse(tab);
  const value=typeof view==="string"?view.toLowerCase():"all";
  return value==="faculty"?"FACULTY":
    ["student","students","learner","learners"].includes(value)?"STUDENT":"ALL";
}

export const adminPopularDirectoryQuerySchema=z.strictObject({
  collegeId:z.string().uuid(),
  limit:z.union([z.number().int(),z.string().regex(/^[0-9]+$/).transform(Number)])
    .pipe(z.number().int().min(1).max(50)).default(10),
});
/** Popularity must be provided by a trusted tenant-scoped search-usage
 * counter, not guessed from alphabetical order or a user's raw contacts.
 * A college mismatch is never ranked or exposed even to a read-only client. */
export function popularDirectoryResults<T extends {collegeId:string;searchCount:number}>(
  scopedResults:readonly T[],raw:unknown):T[]{
  const query=adminPopularDirectoryQuerySchema.parse(raw);
  return scopedResults.filter(row=>row.collegeId===query.collegeId&&
    Number.isSafeInteger(row.searchCount)&&row.searchCount>0)
   .sort((left,right)=>right.searchCount-left.searchCount)
   .slice(0,query.limit);
}
export function adminUsersHref(query:z.infer<typeof adminUsersQuerySchema>) {
 const u=new URLSearchParams();
 if(query.tab!=="ALL")u.set("tab",query.tab);
 if(query.q)u.set("q",query.q);
 if(query.role!=="ALL")u.set("role",query.role);
 if(query.membershipStatus!=="ALL")u.set("membershipStatus",query.membershipStatus);
 if(query.platformStatus!=="ALL")u.set("platformStatus",query.platformStatus);
 if(query.page>1)u.set("page",String(query.page));
 return "/admin/people/directory"+(u.size?"?"+u:"");
}
export function adminUsersPageCount(total:number,pageSize=ADMIN_USERS_PAGE_SIZE) {
 return Math.max(1,Math.ceil(total/pageSize));
}

export function roleForPeopleTab(input:{tab:"ALL"|"FACULTY"|"STUDENT";role:string}) {
 return input.tab==="FACULTY"?"FACULTY":input.tab==="STUDENT"?"LEARNER":input.role;
}

/** Render form intent independently from server validation; switching tabs resets conflicting role filters. */
export function adminPeopleSearchState(input: {
 tab: "ALL"|"FACULTY"|"STUDENT"; role: string;
}) {
 return {
  hiddenTab: input.tab,
  showExplicitRoleFilter: input.tab==="ALL",
  effectiveRole: roleForPeopleTab(input),
 };
}

export function adminUserDirectoryPaging(total: number, requestedPage: number) {
 const totalPages = adminUsersPageCount(total);
 const page = Math.min(adminUsersQuerySchema.parse({ page: requestedPage }).page, totalPages);
 return { total, totalPages, page, offset: (page - 1) * ADMIN_USERS_PAGE_SIZE };
}
