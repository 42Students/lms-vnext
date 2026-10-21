import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { dnsTenantDomainVerifier } from "./dns-verifier";
import { drizzleTenantDomainRepository } from "./repository";
import {
  createTenantDomain,
  deleteTenantDomain,
  editTenantDomainHost,
  listTenantDomains,
  resolveTenantFromHost,
  previewTenantHostResolution,
  setPrimaryTenantDomain,
  verifyTenantDomain,
} from "./service";

export function listTenantDomainsWithRuntime(
  context: RequestContext,
  collegeId: string,
) {
  return listTenantDomains(
    context,
    collegeId,
    drizzleTenantDomainRepository,
  );
}

export function createTenantDomainWithRuntime(
  context: RequestContext,
  rawInput: unknown,
) {
  return createTenantDomain(
    context,
    rawInput,
    drizzleTenantDomainRepository,
  );
}

export function verifyTenantDomainWithRuntime(
  context: RequestContext,
  domainId: string,
) {
  return verifyTenantDomain(
    context,
    domainId,
    drizzleTenantDomainRepository,
    dnsTenantDomainVerifier,
  );
}

export function editTenantDomainHostWithRuntime(
  context:RequestContext,
  domainId:string,
  input:{expectedHost:string;host:string},
){
  return editTenantDomainHost(context,domainId,input,drizzleTenantDomainRepository);
}

export function setPrimaryTenantDomainWithRuntime(
  context: RequestContext,
  domainId: string,
) {
  return setPrimaryTenantDomain(
    context,
    domainId,
    drizzleTenantDomainRepository,
  );
}

export function deleteTenantDomainWithRuntime(
  context: RequestContext,
  domainId: string,
  confirmationHost?: string,
) {
  return deleteTenantDomain(
    context,
    domainId,
    drizzleTenantDomainRepository,
    confirmationHost,
  );
}

export function resolveTenantFromHostWithRuntime(host: string) {
  return resolveTenantFromHost(host, drizzleTenantDomainRepository);
}

/** Global-only diagnostic: never resolves an unverified host or fetches DNS. */
export function previewTenantHostResolutionWithRuntime(
 context:RequestContext,host:string,
){
 return previewTenantHostResolution(context,host,drizzleTenantDomainRepository);
}
