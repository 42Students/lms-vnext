import "server-only";
import {createHash} from "node:crypto";

/** Resource-library CAS includes membership, saved order, visibility and
 * content, so an unrelated resource add/edit/archive invalidates a draft.
 */
export type ResourceLibraryTokenRow={
 id:string;updatedAt:Date;sequence:number;title:string;description:string|null;
 url:string|null;status:string;resourceType:string;required:boolean;pinned:boolean;
 accessNotes:string|null;visibility:string;legacyResourceKind:string|null;
 legacyResourceKey:string|null;templateKey:string|null;
};
export function projectResourceLibraryToken(rows:readonly ResourceLibraryTokenRow[]){
  const hash=createHash("sha256");
  for(const row of [...rows].sort((a,b)=>a.id.localeCompare(b.id))){
    hash.update(JSON.stringify([
      row.id,row.updatedAt.toISOString(),row.sequence,row.title,row.description,
      row.url,row.status,row.resourceType,row.required,row.pinned,row.accessNotes,
      row.visibility,row.legacyResourceKind,row.legacyResourceKey,row.templateKey,
    ])+"\n");
  }
  return hash.digest("hex");
}
