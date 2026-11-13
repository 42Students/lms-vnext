#!/usr/bin/env node
/**
 * #101 role x API-method census. This is the second half of the route matrix:
 * all exported HTTP methods, not just the 571 authenticated App Router pages.
 *
 * IMPORTANT: A path name, central auth wrapper or permission function call
 * cannot prove a role is ALLOWED or DENIED against a concrete resource.
 * Until the endpoint's actor, object, tenant and state cases have passing
 * negative and positive runtime evidence, its verdict remains UNVERIFIED.
 *
 *   node scripts/security/role-api-matrix.mjs --summary
 *   node scripts/security/role-api-matrix.mjs --json out.json
 *
 * Deliberately read-only and offline. Never calls an app, DB or provider.
 */
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {inventoryApi} from "./api-method-inventory.mjs";

export const ACCOUNT_ROLES=Object.freeze([
  "SUPER_ADMIN","COLLEGE_ADMIN","TPO","FACULTY","MENTOR","LEARNER","RECRUITER",
]);

/** Route names only inform the review queue, never an authorization decision. */
export function pathReviewFamily(route){
  if(/^\/api\/auth(?:\/|$)/.test(route))return "IDENTITY";
  if(/^\/api\/(?:public|v1\/public)(?:\/|$)/.test(route))return "PUBLIC_REVIEW";
  if(/^\/api\/internal(?:\/|$)/.test(route))return "MACHINE_REVIEW";
  if(/^\/api\/admin(?:\/|$)/.test(route))return "PLATFORM_REVIEW";
  if(/^\/api\/placements\/recruiter(?:\/|$)/.test(route))return "RECRUITER_REVIEW";
  if(/^\/api\/placements\/tpo(?:\/|$)/.test(route))return "TPO_REVIEW";
  if(/^\/api\/(?:learn|learner)(?:\/|$)/.test(route))return "LEARNER_REVIEW";
  if(/^\/api\/(?:teach|teacher|faculty)(?:\/|$)/.test(route))return "FACULTY_REVIEW";
  if(/^\/api\/mentor(?:\/|$)/.test(route))return "MENTOR_REVIEW";
  if(/^\/api\/college(?:\/|$)/.test(route))return "COLLEGE_REVIEW";
  return "CROSS_ROLE_REVIEW";
}

export function buildRoleApiMethodMatrix(inventory=inventoryApi()){
  const rows=[];
  for(const endpoint of inventory.methods){
    const key=endpoint.method+" "+endpoint.route;
    const pathFamily=pathReviewFamily(endpoint.route);
    for(const role of ACCOUNT_ROLES){
      rows.push({
        key,role,pathFamily,
        file:endpoint.file,
        method:endpoint.method,route:endpoint.route,
        verdict:"UNVERIFIED",
        testedPositive:false,testedNegative:false,
        directSessionEvidence:endpoint.has_direct_session_evidence,
        directPermissionEvidence:endpoint.has_direct_permission_evidence,
        // Sources are only discovery evidence, not a claim that the guard
        // actually runs before an action or checks the right resource.
      });
    }
  }
  const uniqueMethods=new Set(inventory.methods.map(m=>m.method+" "+m.route));
  if(uniqueMethods.size!==inventory.methods.length)
    throw new Error("Duplicate API method+route encountered in role matrix.");
  if(rows.length!==inventory.methods.length*ACCOUNT_ROLES.length)
    throw new Error("Role API-method matrix coverage is incomplete.");
  return {
    snapshot:"ROLE_API_METHOD_MATRIX_V1",
    headNote:"UNVERIFIED means no allow/deny conclusion may be drawn from static discovery.",
    routeFiles:inventory.summary.route_files,
    exportedMethods:inventory.summary.exported_methods,
    roles:[...ACCOUNT_ROLES],
    rows,
    counts:{
      roleMethodPairs:rows.length,
      verifiedAllow:rows.filter(row=>row.verdict==="ALLOWED_VERIFIED").length,
      verifiedDeny:rows.filter(row=>row.verdict==="DENIED_VERIFIED").length,
      unverified:rows.filter(row=>row.verdict==="UNVERIFIED").length,
    },
  };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=buildRoleApiMethodMatrix();
  const at=process.argv.indexOf("--json");
  if(at>=0){
    const out=process.argv[at+1];
    if(!out||out.startsWith("--"))throw new Error("--json expects an output file.");
    writeFileSync(out,JSON.stringify(result,null,2)+"\n");
  }
  console.log(JSON.stringify({
    snapshot:result.snapshot,
    routeFiles:result.routeFiles,
    exportedMethods:result.exportedMethods,
    roles:result.roles.length,
    ...result.counts,
    note:"Every role/API-method decision is still UNVERIFIED without runtime object-and-tenant tests.",
  },null,2));
}
