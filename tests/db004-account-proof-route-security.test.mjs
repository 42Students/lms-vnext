import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const start=readFileSync("src/app/api/auth/account-proof/start/route.ts","utf8");
const verify=readFileSync("src/app/api/auth/account-proof/verify/route.ts","utf8");
const runtime=readFileSync("src/modules/identity/own-account-proof-runtime.ts","utf8");

test("DB-004 issuer and verifier require own live context, same host and real session",()=>{
 for(const source of [start,verify]){
  assert.match(source,/isSameOriginRequest\(request\)/);
  assert.match(source,/getCurrentRequestContext\(\)/);
  assert.match(source,/getCurrentDeviceSession\(\)/);
  assert.match(source,/ownAccountProofScope\(context,device,/);
  assert.match(source,/readBoundedAuthJson\(request,2048\)/);
  assert.doesNotMatch(source,/cookies\.set\(/);
 }
});
test("DB-004 role proof never takes identity or privileged role from request body",()=>{
 for(const source of [start,verify]){
  assert.doesNotMatch(source,/userId:z\./);
  assert.doesNotMatch(source,/membershipId:z\./);
  assert.doesNotMatch(source,/role:z\./);
 }
 assert.match(verify,/redeemScopedAccountProof\(/);
 assert.match(verify,/sessionCreated:false/);
});
test("DB-004 provider transport fail-closes on non-approved environment and rejected delivery",()=>{
 assert.match(runtime,/AUTH_DEV_REAL_DELIVERY/);
 assert.match(runtime,/APP_ENV/);
 assert.match(runtime,/ROLE_PROOF_DELIVERY_DISABLED/);
 assert.match(runtime,/createExotelSmsProvider/);
 assert.match(runtime,/createZeptoMailEmailProvider/);
 assert.match(runtime,/if\(!accepted\)throw new Error\("ROLE_PROOF_DELIVERY_FAILED"\)/);
});
