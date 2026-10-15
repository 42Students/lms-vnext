import {z} from "zod";
import {tpoCompanyAuditKindSchema} from "./audit-kind-model";
import {companyShareAuditPageSchema} from "./audit-page-model";

const auditQuerySchema=z.object({
 kind:tpoCompanyAuditKindSchema,
 page:companyShareAuditPageSchema,
}).strict();

/** Validate before querying any access history; do not silently reset bad URLs. */
export function parseCompanyShareAuditQuery(raw:{kind?:unknown;page?:unknown}){
 return auditQuerySchema.safeParse({kind:raw.kind??"ALL",page:raw.page??1});
}
