import {z} from "zod";

const area=z.enum(["login","course","lesson-content","quiz","assignment","attendance",
 "classroom","notifications","calendar","projects","placements-tpo","recruiter",
 "student-placements","college-admin","super-admin","groups-electives",
 "people-accounts","reports","tracker","mobile","platform","security","other"]);
const role=z.enum(["public","learner","faculty","mentor","college-admin","tpo","recruiter","super-admin"]);
const severity=z.enum(["critical","high","medium","low"]);
const kind=z.enum(["bug","security","data","ux","copy","performance","accessibility"]);
const repo=z.enum(["lms","lms2-fe","both","infra","other"]);
const findingId=/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-[a-z][a-z-]*[a-z]-[a-z0-9]{4}$/;
const updateId=/^(20\d\d-\d\d-\d\d-[a-z][a-z-]*[a-z]-[a-z0-9]{4})\.u(20\d{10})-[a-z0-9]{4}$/;
const rfc3339=/^20\d\d-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/;
const when=z.string().max(40).regex(rfc3339)
 .refine(value=>!Number.isNaN(Date.parse(value)),"Invalid timestamp");
const text=(max:number)=>z.string().trim().max(max);
const fields=z.array(text(300).min(1)).max(20).refine(
 list=>new Set(list).size===list.length,"Duplicate entries",
);
const common={schema:z.literal(1),id:z.string().max(120)};
const finding=z.strictObject({
 ...common,type:z.literal("finding"),
 id:z.string().regex(findingId),
 title:text(160).min(10),area,roles:z.array(role).min(1).max(8),
 severity,kind,environment:z.enum(["prod","dev","local","code"]),
 where:z.strictObject({
  repo,paths:fields.optional(),pages:fields.optional(),endpoints:fields.optional(),
 }).refine(w=>Boolean(w.paths?.length||w.pages?.length||w.endpoints?.length),
  "Location needs at least one path, page or endpoint"),
 summary:text(4000).min(20),steps:z.array(text(500)).max(20).optional(),
 expected:text(4000).optional(),actual:text(4000).optional(),
 evidence:text(4000).optional(),suggested_fix:text(4000).optional(),
 found_by:z.strictObject({agent:text(60).min(2),session:text(300).optional()}),
 found_at:when,related:z.array(z.string().regex(findingId)).max(20).optional(),
 duplicate_of:z.string().regex(findingId).optional(),
});
const update=z.strictObject({
 ...common,type:z.literal("update"),
 id:z.string().regex(updateId),
 finding:z.string().regex(findingId),
 status:z.enum(["fixed","comment","needs-info","cannot-reproduce","reopen-suggested"]),
 note:text(4000).optional(),
 commits:z.array(z.strictObject({repo,sha:z.string().regex(/^[0-9a-f]{7,40}$/)})).max(10).optional(),
 by:text(60).min(2),at:when,
});
const payload=z.discriminatedUnion("type",[finding,update]);
export type IndependentAuditInboxPayload=z.infer<typeof payload>;
export type IndependentAuditFinding=z.infer<typeof finding>;
export type IndependentAuditUpdate=z.infer<typeof update>;

const secretPatterns=[
 /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/,
 /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/,
 /\b(?:sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,})/,
 /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
 /\b(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[^\s"',]{6,}/i,
 /\b(?:mysql|postgres(?:ql)?|mongodb|redis):\/\/[^\s:@/]+:[^\s@/]+@/,
];
const mail=/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const phone=/(?<!\d)(?:\+?91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})(?!\d)/g;

/** Parse a single immutable inbox file. On failure only validation errors,
 * NEVER untrusted secret-bearing content, may enter the sync diagnostics. */
export function validateIndependentAuditInboxFile(path:string,content:string):
 {ok:true;payload:IndependentAuditInboxPayload}|{ok:false;reasons:string[]} {
 const reasons:string[]=[];
 if(!/^inbox\/[A-Za-z0-9_.-]{1,240}\.json$/.test(path))
  reasons.push("Only JSON files directly inside inbox/ are permitted");
 if(Buffer.byteLength(content,"utf8")>32768)
  reasons.push("File exceeds the 32KB limit");
 let raw:unknown=null;
 try{raw=JSON.parse(content);}catch{reasons.push("Invalid JSON");}
 if(raw!==null){
  const parsed=payload.safeParse(raw);
  if(!parsed.success)
   reasons.push(...parsed.error.issues.slice(0,10).map(issue=>
    issue.path.join(".")+": "+issue.message));
  else{
   const item=parsed.data;
   if(path!=="inbox/"+item.id+".json")reasons.push("Filename does not match finding/update ID");
   if(item.type==="finding"&&item.id.slice(11,-5)!==item.area)
    reasons.push("Finding area does not match its ID");
   if(item.type==="update"){
    if(!item.id.startsWith(item.finding+".u"))
     reasons.push("Update ID is not prefixed by its finding ID");
    if(item.status==="fixed"&&!item.commits?.length)
     reasons.push("Fixed update requires at least one commit");
    if(item.status!=="fixed"&&!item.note?.length)
     reasons.push("Update requires a note");
   }
   for(const pattern of secretPatterns)if(pattern.test(content)){
    reasons.push("Sensitive credential-like content is not permitted");break;
   }
   const matches=Array.from(content.matchAll(mail));
   if(matches.some(match=>!/@(?:example\.(?:com|org|net)|[a-z0-9-]+\.test|test\.42lms\.com)$/i.test(match[0])))
    reasons.push("Personal email addresses are not permitted");
   const phones=Array.from(content.matchAll(phone));
   if(phones.some(match=>{
    const digits=(match[1]??"").replace(/\D/g,"");
    return digits!=="9876543210"&&!/^(\d)\1{9}$/.test(digits);
   }))reasons.push("Personal phone numbers are not permitted");
   return reasons.length?{ok:false,reasons}:{ok:true,payload:item};
  }
 }
 return {ok:false,reasons:reasons.slice(0,12)};
}
