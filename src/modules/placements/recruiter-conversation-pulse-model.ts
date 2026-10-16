import {createHash} from "node:crypto";
/** Stable read-only version of recruiter-authorized conversation metadata. */
export function recruiterConversationPulseSignature(rows:readonly {
 id:string;lastMessageAt:Date|null;createdAt:Date;
}[]):string{
 const sorted=[...rows].sort((a,b)=>a.id.localeCompare(b.id));
 return createHash("sha256").update(JSON.stringify(sorted.map(row=>[
  row.id,row.createdAt.toISOString(),row.lastMessageAt?.toISOString()??null,
 ]))).digest("hex");
}
