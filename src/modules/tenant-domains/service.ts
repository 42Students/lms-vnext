import { randomBytes } from "node:crypto";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {
  createTenantDomainInputSchema,
  normalizeRequestHost,
  tenantDomainCollegeIdSchema,
  tenantDomainIdSchema,
} from "./validation";

export type TenantDomainView = {
  id: string;
  collegeId: string;
  organizationId: string;
  host: string;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken: string | null;
  verifiedAt: Date | null;
  lastCheckedAt: Date | null;
  lastCheckResult: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResolvedTenantHost = {
  domainId: string;
  host: string;
  collegeId: string;
  organizationId: string;
};

export type VerificationResult = {
  verified: boolean;
  result:
    | "VERIFIED"
    | "TXT_RECORD_MISSING"
    | "DNS_LOOKUP_FAILED";
};

export interface TenantDomainVerifier {
  verify(host: string, token: string): Promise<VerificationResult>;
}

export interface TenantDomainRepository {
  loadActiveCollege(
    collegeId: string,
  ): Promise<{ id: string; organizationId: string } | null>;
  listByCollege(collegeId: string): Promise<TenantDomainView[]>;
  loadDomain(domainId: string): Promise<TenantDomainView | null>;
  findByHost(host: string): Promise<TenantDomainView | null>;
  createDomain(input: {
    collegeId: string;
    host: string;
    verificationToken: string;
  }): Promise<TenantDomainView>;
  recordVerificationResult(
    domainId: string,
    input: VerificationResult & { checkedAt: Date },
  ): Promise<TenantDomainView>;
  setPrimary(domainId: string): Promise<TenantDomainView>;
  deleteDomain(domainId: string, confirmationHost?: string): Promise<void>;
  resolveVerifiedHost(host: string): Promise<ResolvedTenantHost | null>;
}

export type TenantDomainServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DOMAIN_NOT_FOUND"
  | "HOST_CONFLICT"
  | "DOMAIN_NOT_VERIFIED"
  | "PRIMARY_HOST_CONFIRMATION_REQUIRED";

export class TenantDomainServiceError extends Error {
  constructor(public readonly code: TenantDomainServiceErrorCode) {
    super(code);
    this.name = "TenantDomainServiceError";
  }
}

function verificationToken() {
  return randomBytes(24).toString("base64url");
}

function requireCollegeManage(
  context: RequestContext,
  college: { id: string; organizationId: string },
) {
  if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
  requirePermission(context, "college.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
}

async function loadAuthorizedDomain(
  context: RequestContext,
  domainIdInput: string,
  repository: TenantDomainRepository,
) {
  const domainId = tenantDomainIdSchema.parse(domainIdInput);
  const domain = await repository.loadDomain(domainId);

  if (!domain) {
    throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
  }

  requireCollegeManage(context, {
    id: domain.collegeId,
    organizationId: domain.organizationId,
  });

  return domain;
}

export function verificationDnsName(host: string) {
  return `_lms-vnext.${host}`;
}

export function verificationDnsValue(token: string) {
  return `lms-vnext-verification=${token}`;
}

export async function listTenantDomains(
  context: RequestContext,
  collegeIdInput: string,
  repository: TenantDomainRepository,
) {
  const collegeId = tenantDomainCollegeIdSchema.parse(collegeIdInput);
  const college = await repository.loadActiveCollege(collegeId);

  if (!college) {
    throw new TenantDomainServiceError("COLLEGE_NOT_FOUND");
  }

  requireCollegeManage(context, college);
  return repository.listByCollege(college.id);
}

export async function createTenantDomain(
  context: RequestContext,
  rawInput: unknown,
  repository: TenantDomainRepository,
  tokenFactory: () => string = verificationToken,
) {
  const input = createTenantDomainInputSchema.parse(rawInput);
  const college = await repository.loadActiveCollege(input.collegeId);

  if (!college) {
    throw new TenantDomainServiceError("COLLEGE_NOT_FOUND");
  }

  requireCollegeManage(context, college);

  const existing = await repository.findByHost(input.host);
  if (existing) {
    if (existing.collegeId === college.id) {
      return existing;
    }
    throw new TenantDomainServiceError("HOST_CONFLICT");
  }

  return repository.createDomain({
    collegeId: college.id,
    host: input.host,
    verificationToken: tokenFactory(),
  });
}

export async function verifyTenantDomain(
  context: RequestContext,
  domainIdInput: string,
  repository: TenantDomainRepository,
  verifier: TenantDomainVerifier,
) {
  const domain = await loadAuthorizedDomain(
    context,
    domainIdInput,
    repository,
  );

  if (domain.isVerified) {
    return domain;
  }

  if (!domain.verificationToken) {
    throw new TenantDomainServiceError("DOMAIN_NOT_VERIFIED");
  }

  const result = await verifier.verify(
    domain.host,
    domain.verificationToken,
  );

  return repository.recordVerificationResult(domain.id, {
    ...result,
    checkedAt: new Date(),
  });
}

export async function setPrimaryTenantDomain(
  context: RequestContext,
  domainIdInput: string,
  repository: TenantDomainRepository,
) {
  const domain = await loadAuthorizedDomain(
    context,
    domainIdInput,
    repository,
  );

  if (!domain.isVerified) {
    throw new TenantDomainServiceError("DOMAIN_NOT_VERIFIED");
  }

  return repository.setPrimary(domain.id);
}

export async function deleteTenantDomain(
  context: RequestContext,
  domainIdInput: string,
  repository: TenantDomainRepository,
  confirmationHost?: string,
) {
  const domain = await loadAuthorizedDomain(
    context,
    domainIdInput,
    repository,
  );

  if (domain.isPrimary && confirmationHost !== domain.host) {
    throw new TenantDomainServiceError("PRIMARY_HOST_CONFIRMATION_REQUIRED");
  }
  await repository.deleteDomain(domain.id, confirmationHost);
}

export async function resolveTenantFromHost(
  rawHost: string,
  repository: TenantDomainRepository,
) {
  const host = normalizeRequestHost(rawHost);
  return repository.resolveVerifiedHost(host);
}
