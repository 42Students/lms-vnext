import { z } from "zod";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, USER_PLATFORM_STATUSES } from "@/modules/identity/constants";
export const adminUsersQuerySchema = z.object({
  tab: z.enum(["ALL","FACULTY","STUDENT"]).default("ALL"),
  q: z.string().trim().max(100).default(""),
  role: z.union([z.enum(MEMBERSHIP_ROLES), z.literal("ALL")]).default("ALL"),
  membershipStatus: z.union([z.enum(MEMBERSHIP_STATUSES), z.literal("ALL")]).default("ALL"),
  platformStatus: z.union([z.enum(USER_PLATFORM_STATUSES), z.literal("ALL")]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).strict();
export const ADMIN_USERS_PAGE_SIZE = 30;
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
export function adminUsersPageCount(total:number) {
 return Math.max(1,Math.ceil(total/ADMIN_USERS_PAGE_SIZE));
}

export function roleForPeopleTab(input:{tab:"ALL"|"FACULTY"|"STUDENT";role:string}) {
 return input.tab==="FACULTY"?"FACULTY":input.tab==="STUDENT"?"LEARNER":input.role;
}
