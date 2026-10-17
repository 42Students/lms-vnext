export type HrAccountStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DISABLED";

export type HrGrant = {
  id: string;
  recruiterUserId: string;
  companyRelationshipId: string;
  companyId: string;
  collegeId: string;
  collegeName: string;
  organizationId: string;
  status: string;
  validUntil: string | null;
  verificationStatus: string;
};

export type HrAccount = {
  userId: string;
  displayName: string | null;
  phoneE164: string | null;
  email: string | null;
  companyId: string;
  companyName: string;
  title: string | null;
  status: HrAccountStatus;
  accountManageable:boolean;
  grants: HrGrant[];
  grantHistory?: HrGrant[];
};

export type HrAccountsPageData = {
  items: HrAccount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type HrListFilters = {
  q: string;
  status: "" | HrAccountStatus;
  page: number;
  pageSize: number;
};

export type HrCollegeOption = {collegeId:string;collegeName:string;organizationId:string};
export type HrRelationshipOption = {
  companyRelationshipId: string;
  companyId: string;
  companyName: string;
  collegeId: string;
  collegeName: string;
  organizationId: string;
};

export type HrAccountFormValues = {
  companyRelationshipId: string;
  companyRelationshipIds?: string[];
  newCompany?: {name:string;collegeId:string;primaryDomain?:string};
  displayName: string;
  phoneE164: string;
  email: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED";
};

export function hrStatusTone(
  status: HrAccountStatus,
): "success" | "warning" | "neutral" {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "ARCHIVED") {
    return "warning";
  }

  return "neutral";
}

export function hrDisplayName(
  account: Pick<HrAccount, "displayName" | "phoneE164">,
) {
  return (
    account.displayName?.trim() ||
    account.phoneE164 ||
    "Unnamed recruiter"
  );
}

export function hrApiErrorMessage(
  payload: unknown,
  status: number,
): string {
  const data =
    payload && typeof payload === "object"
      ? (payload as {
          error?: unknown;
          issues?: Array<{ message?: string }>;
        })
      : null;

  const code =
    typeof data?.error === "string"
      ? data.error
      : null;

  if (status === 401) {
    return "Your session has expired. Sign in again.";
  }

  if (status === 403 || code === "FORBIDDEN") {
    return "You do not have permission for this action in the current administrative scope.";
  }

  if (code === "IDENTITY_COLLISION") {
    return "The phone or email belongs to an incompatible existing identity.";
  }

  if (code === "PLACEMENT_RECRUITER_COMPANY_CONFLICT") {
    return "This account already belongs to another company, or the requested company conflicts with its recruiter profile.";
  }

  if (code === "PLACEMENT_RECRUITER_RELATIONSHIP_INACTIVE") {
    return "The company or college relationship is no longer active.";
  }

  if (
    code === "PLACEMENT_RECRUITER_USER_NOT_FOUND"
  ) {
    return "This recruiter is no longer available in the selected administrative scope.";
  }

  if (
    code === "PLACEMENT_RECRUITER_GRANT_NOT_FOUND"
  ) {
    return "This college-access grant is no longer available.";
  }

  if (code === "PLACEMENT_RECRUITER_OUTSIDE_ADMIN_SCOPE") {
    return "This recruiter has active grants outside the selected college or organization. Clear the scope before changing their global account or sessions.";
  }
  if (code === "INVALID_ORIGIN") {
    return "The request was rejected by the origin security check. Refresh the page and try again.";
  }

  if (code === "INVALID_REQUEST") {
    const message = data?.issues?.find(
      (issue) => typeof issue.message === "string",
    )?.message;

    return message
      ? `Invalid request: ${message}`
      : "Some fields are invalid. Review the form and try again.";
  }

  return `The request could not be completed (HTTP ${status}). Please try again.`;
}
