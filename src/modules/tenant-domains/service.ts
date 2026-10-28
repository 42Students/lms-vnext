import { randomBytes } from "node:crypto";
import {z} from "zod";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {
  createTenantDomainInputSchema,
  normalizeRequestHost,
  tenantDomainCollegeIdSchema,
  tenantDomainIdSchema,
  tenantDomainHostSchema,
} from "./validation";
import {managedBaseDomain} from "./managed-subdomain-model";

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
    | "TXT_VALUE_MISMATCH"
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
    context:RequestContext;
    organizationId:string;
  }): Promise<TenantDomainView>;
  /** Only restores a missing challenge on a still-unverified domain. */
  ensureToken?(input:{
    domainId:string;expectedHost:string;token:string;context:RequestContext;
  }):Promise<TenantDomainView>;
  /** Migration-only recovery: insert a missing challenge without revoking a
   * verified binding; no change to isVerified/verifiedAt/primary. */
  ensureVerifiedToken?(input:{
    domainId:string;expectedHost:string;token:string;context:RequestContext;
  }):Promise<TenantDomainView>;
  editDomainHost(input:{
    domainId:string;
    expectedHost:string;
    host:string;
    verificationToken:string;
    context:RequestContext;
  }):Promise<TenantDomainView>;
  recordVerificationResult(
    domainId: string,
    input: VerificationResult & { checkedAt: Date; expectedHost:string; expectedToken:string; context:RequestContext },
  ): Promise<TenantDomainView>;
  setPrimary(domainId: string,context:RequestContext): Promise<TenantDomainView>;
  deleteDomain(domainId: string, confirmationHost: string | undefined, context:RequestContext): Promise<void>;
  resolveVerifiedHost(host: string): Promise<ResolvedTenantHost | null>;
}

export type TenantDomainServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DOMAIN_NOT_FOUND"
  | "HOST_CONFLICT"
  | "DOMAIN_NOT_VERIFIED"
  | "PRIMARY_HOST_CONFIRMATION_REQUIRED"
  | "DOMAIN_HOST_STALE"
  | "MANAGED_HOST_EDIT_UNSUPPORTED";

export class TenantDomainServiceError extends Error {
  constructor(public readonly code: TenantDomainServiceErrorCode) {
    super(code);
    this.name = "TenantDomainServiceError";
  }
}

/** Drizzle and PostgreSQL drivers may wrap 23505 in one or more causes.
 * Only a genuine duplicate-key SQLSTATE may be converted into an idempotent
 * host create response. Never inspect/log database messages or raw SQL text. */
function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let cursor: unknown = error;
  for (let depth = 0; depth < 6; depth++) {
    if (!cursor || typeof cursor !== "object" || seen.has(cursor)) return false;
    seen.add(cursor);
    const value = cursor as { code?: unknown; cause?: unknown };
    if (value.code === "23505") return true;
    cursor = value.cause;
  }
  return false;
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

/** Read-only crosswalk for imported legacy support history. Do not equate
 * mismatched TXT values with missing records when explaining DNS failures. */
export function legacyDnsCheckResult(result:string|null){
 switch(result){
  case "VERIFIED":return "VERIFIED" as const;
  case "TXT_RECORD_MISSING":case "NO_RECORD":return "NO_RECORD" as const;
  case "TXT_VALUE_MISMATCH":case "WRONG_VALUE":return "WRONG_VALUE" as const;
  case "DNS_LOOKUP_FAILED":case "TIMEOUT_OR_ERROR":return "TIMEOUT_OR_ERROR" as const;
  default:return null;
 }
}

/** Historical TXT challenges cannot verify a new vNext token. Show both
 * protocols during migration, but instruct users to publish CURRENT only. */
export function tenantDomainDnsInstructions(host:string,token:string){
 const validated=tenantDomainHostSchema.parse(host);
 return {
  current:{name:verificationDnsName(validated),value:verificationDnsValue(token)},
  historical:{name:"_42lms-verify."+validated,value:"42lms-verification="+token},
  historicalAlternatives:{
    names:["_42lms-verify."+validated,validated],
    values:["42lms-verification="+token,token],
  },
  guidance:"Legacy LMS accepted TXT records at _42lms-verify.<host> or the host root, with a bare token or 42lms-verification= prefix. Those historical challenges do not prove ownership of a new vNext token. Publish the current _lms-vnext TXT challenge, wait for DNS propagation, and verify again before switching traffic. Preserve the old DNS records until legacy traffic is retired. Custom hosts also require deployed DNS routing and TLS; managed wildcard domains require infrastructure readiness.",
 };
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

  try {
    return await repository.createDomain({
      collegeId: college.id,
      host: input.host,
      verificationToken: tokenFactory(),
      context,organizationId:college.organizationId,
    });
  } catch (error) {
    // Concurrent same-host requests may both pass the read. The registered
    // host UNIQUE index is the final arbiter: recover an identical college
    // claim without issuing duplicate DNS tokens; never borrow a foreign
    // college's domain. Do not translate unrelated database errors.
    if (!isUniqueViolation(error)) throw error;
    const raced = await repository.findByHost(input.host);
    if (raced?.collegeId === college.id) return raced;
    throw new TenantDomainServiceError("HOST_CONFLICT");
  }
}

/** Idempotent legacy ensure-token operation; never resets a verified domain. */
export async function ensureTenantDomainVerificationToken(
 context:RequestContext,domainId:string,repository:TenantDomainRepository,
 tokenFactory:()=>string=verificationToken,
){
 const domain=await loadAuthorizedDomain(context,domainId,repository);
 if(domain.verificationToken)return domain;
 if(domain.isVerified){
  // Keep a verified host resolvable while migrating nullable old tokens.
  // Reissuing a DNS token is optional until the repository supports it safely.
  if(!repository.ensureVerifiedToken)return domain;
  return repository.ensureVerifiedToken({domainId:domain.id,expectedHost:domain.host,
   token:tokenFactory(),context});
 }
 if(!repository.ensureToken)throw new TenantDomainServiceError("DOMAIN_NOT_FOUND");
 return repository.ensureToken({domainId:domain.id,expectedHost:domain.host,
  token:tokenFactory(),context});
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

  // A normal repeated check is idempotent. An explicit issued recheck
  // challenge, however, MUST actually query DNS even on a verified host.
  // A failed recheck records diagnostics without revoking the prior proof.
  if (domain.isVerified && !domain.verificationToken) return domain;
  const verificationToken = domain.verificationToken;
  if (!verificationToken) {
    throw new TenantDomainServiceError("DOMAIN_NOT_VERIFIED");
  }

  const result = await verifier.verify(
    domain.host,
    verificationToken,
  );

  return repository.recordVerificationResult(domain.id, {
    ...result,
    checkedAt: new Date(),
    expectedHost:domain.host,
    expectedToken:verificationToken,
    context,
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

  return repository.setPrimary(domain.id,context);
}

/** Replacing a custom domain is not verification. Rotate the DNS challenge
 * and clear primary/verified state atomically so the former host cannot be
 * trusted after an edit. Managed wildcard addresses use their own workflow. */
export async function editTenantDomainHost(
  context:RequestContext,
  domainIdInput:string,
  rawInput:unknown,
  repository:TenantDomainRepository,
  tokenFactory:()=>string=verificationToken,
){
  const input=z.strictObject({
    expectedHost:tenantDomainHostSchema,
    host:tenantDomainHostSchema,
  }).parse(rawInput);
  const domain=await loadAuthorizedDomain(context,domainIdInput,repository);
  if(domain.host!==input.expectedHost)
    throw new TenantDomainServiceError("DOMAIN_HOST_STALE");
  if(input.host===domain.host)return domain;
  const base=managedBaseDomain(process.env["TENANT_MANAGED_BASE_DOMAIN"],true);
  if(base&&(domain.host.endsWith("."+base)||input.host.endsWith("."+base)))
    throw new TenantDomainServiceError("MANAGED_HOST_EDIT_UNSUPPORTED");
  return repository.editDomainHost({
    domainId:domain.id,
    expectedHost:domain.host,
    host:input.host,
    verificationToken:tokenFactory(),
    context,
  });
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
  await repository.deleteDomain(domain.id, confirmationHost, context);
}

/**
 * Read-only host resolution diagnostic for the global platform administrator.
 * Unlike the public resolver it never reads a verification token, returns a
 * private domain row, or changes tenant DNS state. An administrator acting in
 * one organization/college cannot use this to enumerate other tenants.
 */
export type TenantHostResolutionPreview =
  | {
      status: "TENANT_NOT_FOUND";
      tenant: null;
      canonicalHost: null;
      shouldRedirect: false;
    }
  | {
      status: "TENANT";
      tenant: ResolvedTenantHost;
      canonicalHost: string;
      shouldRedirect: boolean;
    };

export async function previewTenantHostResolution(
  context: RequestContext,
  rawHost: string,
  repository: TenantDomainRepository,
): Promise<TenantHostResolutionPreview> {
  if (
    !isSuperAdmin(context) ||
    context.adminScope?.organizationId ||
    context.adminScope?.collegeId
  ) {
    throw new AuthorizationError("admin-scope.select");
  }
  requirePermission(context, "admin-scope.select");
  const host = normalizeRequestHost(rawHost);
  // Only verified hosts belonging to an active college/organization resolve.
  const tenant = await repository.resolveVerifiedHost(host);
  if (!tenant) {
    return {
      status: "TENANT_NOT_FOUND",
      tenant: null,
      canonicalHost: null,
      shouldRedirect: false,
    };
  }
  // The current runtime resolves only exact registered hostnames. Redirect
  // intent can be true only if the resolver actually returns another host;
  // never guess a primary hostname from organization or college metadata.
  return {
    status: "TENANT",
    tenant,
    canonicalHost: tenant.host,
    shouldRedirect: host !== tenant.host,
  };
}

export async function resolveTenantFromHost(
  rawHost: string,
  repository: TenantDomainRepository,
) {
  const host = normalizeRequestHost(rawHost);
  return repository.resolveVerifiedHost(host);
}
