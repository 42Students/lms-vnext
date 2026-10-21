import { z } from "zod";

export const TPO_RECRUITER_ACCESS_FILTERS = [
  "ALL",
  "ACTIVE",
  "REVOKED",
  "ENDING_SOON",
  "ENDED_OR_REMOVED",
] as const;

export type TpoRecruiterGrantStatus =
  | "ACTIVE"
  | "REVOKED";

export const tpoRecruiterAccessQuerySchema =
  z.object({
    status: z
      .enum(TPO_RECRUITER_ACCESS_FILTERS)
      .default("ALL"),
    q: z.string().trim().max(80).default(""),
    page: z.union([
      z.number().int().min(1).max(10000),
      z.string().regex(/^[0-9]+$/).transform(Number)
        .pipe(z.number().int().min(1).max(10000)),
    ]).default(1),
  }).strict();

export type TpoRecruiterAccessQuery =
  z.infer<typeof tpoRecruiterAccessQuerySchema>;

/** An untrusted URL may repeat one filter or append a foreign identity.
 * Never select the first occurrence and load recruiter grant records. */
export function parseTpoRecruiterAccessParams(
  raw: Record<string,string|string[]|undefined>,
):TpoRecruiterAccessQuery|null{
  if(Object.keys(raw).some(key=>!["status","q","page"].includes(key)))return null;
  if(Object.values(raw).some(Array.isArray))return null;
  const parsed=tpoRecruiterAccessQuerySchema.safeParse({
    status:raw.status||undefined,
    q:raw.q||"",
    page:raw.page||undefined,
  });
  return parsed.success?parsed.data:null;
}


export type TpoRecruiterGrantSourceRow = {
  grantId?: string;
  updatedAt?: Date;
  displayName: string | null;
  designation?:string|null;
  companyName: string;
  status: string;
  grantedAt: Date;
  revokedAt: Date | null;
  validUntil?: Date | null;
  capabilities?: string[];
  verificationStatus?: string;
  grantedByType?: string|null;
};

export type TpoRecruiterGrantView = {
  grantId?: string;
  expectedUpdatedAt?: string;
  displayName: string;
  designation:string|null;
  companyName: string;
  status: TpoRecruiterGrantStatus;
  grantedDate: string;
  revokedDate: string | null;
  validUntilDate: string | null;
  ended: boolean;
  capabilities: string[];
  verificationStatus: string;
  joinedVia: "Public link"|"Company link"|"Invitation"|"Not recorded";
};

const istDateFormatter = new Intl.DateTimeFormat(
  "en-GB",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  },
);

export function formatTpoRecruiterGrantDate(
  value: Date | null,
): string | null {
  return value
    ? istDateFormatter.format(value)
    : null;
}

/**
 * Strip all identifiers and contact fields before
 * constructing the TPO-facing read model.
 *
 * A REVOKED grant remains a historical record even
 * if the profile or company relationship was archived.
 * ACTIVE describes the grant row, not a guarantee
 * of currently usable recruiter account access.
 */
/**
 * Unlike the legacy indefinite grant, vNext access enforcement requires a
 * finite expiry. NULL is a missing-expiry invalid grant, not a live grant.
 * Keeping the four states separate prevents a TPO from interpreting it as
 * "No end date" or quietly treating ACTIVE as effective authorization.
 */
export type TpoRecruiterGrantExpiryState =
  | "CURRENT"
  | "EXPIRED"
  | "REVOKED"
  | "MISSING_EXPIRY_INVALID";

export function tpoRecruiterGrantExpiryState(
  row: Pick<TpoRecruiterGrantSourceRow, "status" | "validUntil">,
  now: Date = new Date(),
): TpoRecruiterGrantExpiryState {
  if (row.status === "REVOKED") return "REVOKED";
  if (!(row.validUntil instanceof Date) ||
      !Number.isFinite(row.validUntil.getTime())) {
    return "MISSING_EXPIRY_INVALID";
  }
  return row.validUntil.getTime() <= now.getTime() ? "EXPIRED" : "CURRENT";
}

/** A safe TPO display label; NEVER claim an invalid grant has no end date. */
export function tpoRecruiterGrantExpiryLabel(
  row: Pick<TpoRecruiterGrantView, "status" | "validUntilDate" | "ended">,
): string {
  if (row.status === "REVOKED") return "Removed";
  if (!row.validUntilDate) return "Missing expiry — access unavailable";
  return row.ended ? "Ended" : `Until ${row.validUntilDate}`;
}

export function toTpoRecruiterGrantView(
  row: TpoRecruiterGrantSourceRow,
): TpoRecruiterGrantView {
  const status = z
    .enum(["ACTIVE", "REVOKED"])
    .parse(row.status);

  return {
    ...(row.grantId && row.updatedAt
      ? { grantId: row.grantId, expectedUpdatedAt: row.updatedAt.toISOString() }
      : {}),
    displayName:
      row.displayName?.trim() ||
      "Unnamed recruiter",
    companyName: row.companyName,
    designation:row.designation?.trim()||null,
    status,
    grantedDate:
      formatTpoRecruiterGrantDate(
        row.grantedAt,
      ) ?? "Not recorded",
    revokedDate:
      formatTpoRecruiterGrantDate(row.revokedAt),
    validUntilDate:formatTpoRecruiterGrantDate(row.validUntil??null),
    ended:tpoRecruiterGrantExpiryState(row)!=="CURRENT",
    capabilities:row.capabilities??[],
    verificationStatus:row.verificationStatus??"UNKNOWN",
    // No separate joinedVia column exists in the new grant schema.
    // Display a provenance badge only for explicitly recorded source values.
    joinedVia:row.grantedByType==="PUBLIC_LINK"?"Public link":
      row.grantedByType==="COMPANY_LINK"?"Company link":
      row.grantedByType==="INVITE"?"Invitation":"Not recorded",
  };
}

export function tpoRecruiterAccessHref(
  filters: {
    status?: TpoRecruiterAccessQuery["status"];
    q?: string;
    page?: number;
  } = {},
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q",filters.q);

  if (
    filters.status &&
    filters.status !== "ALL"
  ) {
    params.set(
      "status",
      filters.status,
    );
  }

  if (
    filters.page &&
    filters.page > 1
  ) {
    params.set(
      "page",
      String(filters.page),
    );
  }

  const query = params.toString();

  return query
    ? `/tpo/settings/recruiters?${query}`
    : "/tpo/settings/recruiters";
}

/** Keep the officer's filtered view while moving between grant pages. */
export function nextTpoRecruiterGrantPage(query:TpoRecruiterAccessQuery,page:number){
 return tpoRecruiterAccessHref({status:query.status,q:query.q,page:page+1});
}
