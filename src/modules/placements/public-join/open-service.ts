import "server-only";
import {createHash} from "node:crypto";
import {and,eq,gt,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementPublicJoinLinks} from "@/db/schema";
import {publicCollegeJoinTokenSchema} from "../public-college-join-model";
import {publicJoinTablesReady} from "./readiness";
/** Signed visitor POST, never a GET/SSR mutation. */
export async function recordPublicJoinOpen(token:string,scope:"COLLEGE"|"COMPANY"){
 if(!publicCollegeJoinTokenSchema.safeParse(token).success||!await publicJoinTablesReady())return false;
 const now=new Date(),hash=createHash("sha256").update(token).digest("hex");
 const [row]=await getDb().update(placementPublicJoinLinks)
  .set({opensCount:sql`${placementPublicJoinLinks.opensCount} + 1`})
  .where(and(eq(placementPublicJoinLinks.tokenHash,hash),eq(placementPublicJoinLinks.scope,scope),
   isNull(placementPublicJoinLinks.revokedAt),gt(placementPublicJoinLinks.expiresAt,now),
   sql`EXISTS (SELECT 1 FROM colleges c JOIN organizations o ON o.id=c.organization_id
       WHERE c.id=${placementPublicJoinLinks.collegeId} AND c.status='ACTIVE' AND o.status='ACTIVE')`))
  .returning({id:placementPublicJoinLinks.id});
 return Boolean(row);
}
