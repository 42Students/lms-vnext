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
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(10000)
      .default(1),
  }).strict();

export type TpoRecruiterAccessQuery =
  z.infer<typeof tpoRecruiterAccessQuerySchema>;

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
    ended:status==="REVOKED"||!row.validUntil||row.validUntil.getTime()<=Date.now(),
    capabilities:row.capabilities??[],
    verificationStatus:row.verificationStatus??"UNKNOWN",
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
