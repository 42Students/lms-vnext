import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const start=readFileSync("src/app/api/auth/email-ownership/start/route.ts","utf8");
const redeem=readFileSync("src/app/api/auth/email-ownership/redeem/route.ts","utf8");
const sender=readFileSync("src/modules/identity/own-email-ownership-runtime.ts","utf8");
const adapter=readFileSync("src/modules/notifications/zeptomail-email.ts","utf8");
const page=readFileSync("src/app/verify-email/page.tsx","utf8");
test("DB004 email-link routes reject cross origin and derive live signed-in user and device",()=>{
 for(const source of [start,redeem]){
  assert.match(source,/isSameOriginRequest\(request\)/);
  assert.match(source,/getCurrentRequestContext\(\)/);
  assert.match(source,/getCurrentDeviceSession\(\)/);
  assert.match(source,/readBoundedAuthJson\(request,2048\)/);
  assert.match(source,/ownEmailOwnershipScope\(context,device/);
  assert.doesNotMatch(source,/cookies\.set\(/);
  for(const field of ["userId","membershipId","collegeId","toEmail","redirectUrl"])
   assert.doesNotMatch(source,new RegExp(field+":z\\."));
 }
});
test("DB004 only explicit verified ownership-link template is permitted",()=>{
 assert.match(adapter,/ZEPTOMAIL_TEMPLATE_EMAIL_OWNERSHIP_LINK/);
 assert.match(adapter,/EMAIL_OWNERSHIP_LINK/);
 assert.match(adapter,/verificationUrl/);
 assert.match(adapter,/expiryHours/);
 assert.doesNotMatch(sender,/sendOtpEmail\(/);
 assert.match(sender,/sendZeptoMailTemplate\(/);
 assert.match(sender,/EMAIL_LINK_DELIVERY_DISABLED/);
 assert.match(sender,/verificationUrl=base\.origin\+["']\/verify-email#token=/);
});
test("DB004 account-link page strips bearer fragment and POSTs to same host only",()=>{
 assert.match(page,/window\.location\.hash/);
 assert.match(page,/window\.history\.replaceState/);
 assert.match(page,/fetch\("\/api\/auth\/email-ownership\/redeem"/);
 assert.match(page,/credentials:"same-origin"/);
 assert.match(page,/cache:"no-store"/);
 assert.match(redeem,/sessionCreated:false/);
 assert.doesNotMatch(redeem,/createSession|signSession|cookie/);
});
