import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** Raw secrets are issued only once. The database stores the SHA-256 digest. */
export const companyShareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
/** Old job URL slugs are NOT share capabilities. This validator must never
 * be substituted for the independent 256-bit company share secret schema. */
export const legacyJobSlugSchema=z.string().regex(/^smr-[A-Za-z0-9_-]{1,28}$/);
export function isLegacyJobSlug(value:unknown):value is string{
 return legacyJobSlugSchema.safeParse(value).success;
}
export const companyShareJobSchema = z.string().uuid();
export const companyShareIssueSchema = z.object({
  jobId: companyShareJobSchema,
  expiresInDays: z.coerce.number().int().min(1).max(90).default(7),
  selectedColumns:z.array(z.enum(["APPLICATION_ID","NAME","ROLL_NUMBER","BRANCH","UG_BAND","TENTH","TWELFTH","EMAIL","PHONE","RESUME","GITHUB","PORTFOLIO","STAGE"]))
   .min(1).max(11).refine(v=>new Set(v).size===v.length,"Columns must be unique")
   .default(["APPLICATION_ID","NAME","EMAIL"]),
  shortlistBy:z.iso.datetime({offset:true}).nullable().default(null),
  selectedApplicationIds:z.array(z.string().uuid()).min(1).max(200)
   .refine(ids=>new Set(ids).size===ids.length,"Duplicate applicant selection").optional(),
}).strict();
/** Read-only adapter for the old share-column vocabulary. Historical
 * 'projects' mapped to two publicly linkable profile fields; private skill
 * evaluations have no safe equivalent and must be explicitly rejected. */
export function mapLegacyShareColumnSelection(values:readonly string[]){
 const mappings:Record<string,readonly string[]>={
  applicantId:["APPLICATION_ID"],name:["NAME"],roll:["ROLL_NUMBER"],
  branch:["BRANCH"],cgpa:["UG_BAND"],tenth:["TENTH"],twelfth:["TWELFTH"],
  email:["EMAIL"],phone:["PHONE"],resume:["RESUME"],
  github:["GITHUB"],portfolio:["PORTFOLIO"],
  projects:["GITHUB","PORTFOLIO"],stage:["STAGE"],
 };
 const result=new Set<string>(["APPLICATION_ID"]);
 for(const name of values){
  const expanded=mappings[name];
  if(!expanded)throw new Error("This legacy share column is not supported in the protected applicant view");
  for(const value of expanded)result.add(value);
 }
 return companyShareIssueSchema.shape.selectedColumns.parse([...result]);
}
export const companyShareRevokeSchema = z.object({
  shareId: z.string().uuid(),
  jobId: companyShareJobSchema,
}).strict();

export function issueCompanyShareToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, digest: hashCompanyShareToken(token) };
}
export function hashCompanyShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function isCompanyShareLive(
  record: { expiresAt: Date; revokedAt: Date | null },
  now: Date,
) {
  return Number.isFinite(now.getTime()) &&
    Number.isFinite(record.expiresAt.getTime()) &&
    record.revokedAt === null && record.expiresAt.getTime() > now.getTime();
}
export function companyShareExpiry(now: Date, days: number) {
  const parsed = companyShareIssueSchema.shape.expiresInDays.parse(days);
  return new Date(now.getTime() + parsed * 86_400_000);
}

/** PUB-auth-public-50: code is shown to the issuing placement cell ONCE. */
export const companyShareAccessCodeSchema=z.string().regex(/^\d{6}$/);
export function issueCompanyShareAccessCode(){
 const code=String(randomInt(0,1_000_000)).padStart(6,"0");
 const salt=randomBytes(16).toString("hex");
 return {code,salt,hash:hashCompanyShareAccessCode(code,salt)};
}
export function hashCompanyShareAccessCode(code:string,salt:string){
 if(!/^[a-f0-9]{32}$/.test(salt)||!companyShareAccessCodeSchema.safeParse(code).success)
  throw new Error("Invalid company-share challenge");
 return scryptSync(code,Buffer.from(salt,"hex"),32).toString("hex");
}
export function validCompanyShareAccessCode(code:unknown,salt:string,expected:string){
 if(!companyShareAccessCodeSchema.safeParse(code).success||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(expected))return false;
 const actual=hashCompanyShareAccessCode(code as string,salt);
 return timingSafeEqual(Buffer.from(actual,"hex"),Buffer.from(expected,"hex"));
}
/** Proof is bound to a specific share and its challenge; it cannot authorize
 * another share and invalidates automatically if the challenge changes. */
export function companyShareAccessProof(shareId:string,tokenHash:string,codeHash:string){
 const secret=process.env.AUTH_SECRET??process.env.NEXTAUTH_SECRET;
 if(!secret||secret.length<32)return null;
 return createHmac("sha256",secret).update(shareId+"."+tokenHash+"."+codeHash).digest("hex");
}
export function validCompanyShareAccessProof(raw:unknown,expected:string|null){
 return typeof raw==="string"&&/^[a-f0-9]{64}$/.test(raw)&&!!expected&&
  timingSafeEqual(Buffer.from(raw,"hex"),Buffer.from(expected,"hex"));
}
