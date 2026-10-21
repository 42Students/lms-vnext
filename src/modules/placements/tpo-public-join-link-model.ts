import { z } from "zod";

const change = z.object({
  action: z.enum(["CREATE", "REPLACE"]),
  confirmed: z.literal(true),
  // TPO-settings-audit-55: same-looking stale tabs must never rotate a new
  // one-time token issued by somebody else. IDs are never bearer secrets.
  expectedLinkId: z.string().uuid().optional(),
});

export const tpoPublicJoinLinkChangeSchema = z.discriminatedUnion("scope", [
  change.extend({ scope: z.literal("COLLEGE") }).strict(),
  change.extend({
    scope: z.literal("COMPANY"),
    companyId: z.string().uuid(),
  }).strict(),
]).superRefine((input,ctx)=>{
  if(input.action==="REPLACE"&&!input.expectedLinkId)ctx.addIssue({
    code:"custom",path:["expectedLinkId"],message:"Refresh the current join link before replacing it",
  });
  if(input.action==="CREATE"&&input.expectedLinkId)ctx.addIssue({
    code:"custom",path:["expectedLinkId"],message:"New join links must not claim an existing link",
  });
});

export type TpoPublicJoinLinkStatus = {
  ready: boolean;
  domain: string | null;
  link: { id?:string;createdAt: string;opensCount:number;joinsCount:number;enabled:boolean } | null;
};

export function publicJoinLinkPath(scope: "COLLEGE" | "COMPANY", token: string) {
  return (scope === "COMPANY" ? "/company-join/" : "/college-join/") + encodeURIComponent(token);
}

export const PUBLIC_JOIN_LINK_COPY = {
  company: "Company link",
  college: "Public link for recruiters",
  initial: "Make a link",
  publicInitial: "Make the link",
  replace: "New link",
  replaceTitle: "Make a new link?",
  replaceExplanation: "The old link stops working.",
  replaceConfirm: "Make a new link",
  once: "Copy it now: for safety it is shown only once.",
  copied: "Link copied",
  copyError: "Couldn't copy. Select the link and copy it.",
} as const;

export const tpoPublicJoinLinkToggleSchema=z.discriminatedUnion("scope", [
 z.strictObject({scope:z.literal("COLLEGE"),expectedLinkId:z.string().uuid(),enabled:z.boolean()}),
 z.strictObject({scope:z.literal("COMPANY"),companyId:z.string().uuid(),expectedLinkId:z.string().uuid(),enabled:z.boolean()}),
]);

/** Legacy public URL slug format. Bad input is a non-throwing invalid link,
 * not a TPO settings error or an opportunity to probe link-token hashes. */
export function isLegacyJobSlug(value:unknown):boolean {
 return typeof value==="string" && value.length>=4 && value.length<=32 &&
  /^smr-[A-Za-z0-9\-_!@#$%&*]+$/.test(value);
}

/** Posting policy is independent of link enabled state. A null old-LMS
 * field means "not changed"; acceptance alone must NEVER bypass review.
 * Wiring requires a separate authenticated, versioned policy mutation. */
export const tpoPublicJoinPostingPolicySchema=z.discriminatedUnion("scope",[
 z.strictObject({scope:z.literal("COLLEGE"),expectedLinkId:z.string().uuid(),
  postDirect:z.boolean().nullable()}),
 z.strictObject({scope:z.literal("COMPANY"),companyId:z.string().uuid(),
  expectedLinkId:z.string().uuid(),postDirect:z.boolean().nullable()}),
]);
