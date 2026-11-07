import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(path,"utf8");
const share=read("src/app/company-share/[token]/page.tsx");
const shareLoading=read("src/app/company-share/[token]/loading.tsx");
const shareError=read("src/app/company-share/[token]/error.tsx");
const shareNotFound=read("src/app/company-share/[token]/not-found.tsx");
const pending=read("src/app/(authenticated)/recruiter-invitations/page.tsx");
const pendingLoading=read("src/app/(authenticated)/recruiter-invitations/loading.tsx");
const pendingError=read("src/app/(authenticated)/recruiter-invitations/error.tsx");
const pendingClient=read("src/components/hr/recruiter-pending-invitations.tsx");
const invite=read("src/app/recruiter-invite/[token]/page.tsx");
const inviteLoading=read("src/app/recruiter-invite/[token]/loading.tsx");
const inviteError=read("src/app/recruiter-invite/[token]/error.tsx");
const inviteClient=read("src/components/tpo/recruiter-invite-landing.tsx");

test("G047 company-share token view stays private and enforces code, grant, expiry and selected columns",()=>{
 assert.match(share,/index: false, follow: false, noarchive: true/);
 assert.match(share,/referrer: "no-referrer"/);
 assert.match(share,/export const dynamic="force-dynamic"/);
 assert.match(share,/getPublicCompanyApplicantShare\(token,page\?\?1,"VIEW",q\?\?"",proof\)/);
 assert.match(share,/result.kind==="CODE_REQUIRED"/);
 assert.match(share,/canEmailAuthorizedCompanyShareCode\(context,token\)/);
 assert.match(share,/safeCompanyShareColumns\(result.selectedColumns\)/);
 assert.match(share,/mobileMode="cards"/);
 assert.match(share,/companyShareApplicantHref/);
 assert.match(share,/Everything you open is logged/);
 assert.match(share,/confidential/);
 assert.match(share,/https:/);
 assert.match(shareLoading,/Loading shared applicants/);
 assert.match(shareError,/onClick=\{reset\}/);
 assert.match(shareNotFound,/Expired or invalid applicant share/);
});

test("G083 pending recruiter invitations authorize before reading actor-bound data",()=>{
 assert.match(pending,/SessionAuthenticationError/);
 assert.match(pending,/redirect\("\/login\?"\+query\.toString\(\)\)/);
 assert.match(pending,/returnTo:"\/recruiter-invitations"/);
 assert.match(pending,/platformStatus!=="ACTIVE"/);
 assert.match(pending,/throw new AuthorizationError/);
 assert.match(pending,/listSignedInRecruiterPendingInvites\(context\)/);
 assert.match(pending,/if\(error instanceof AuthorizationError\)throw error/);
 assert.match(pending,/index: false, follow: false, noarchive: true/);
 assert.match(pending,/referrer: "no-referrer"/);
 assert.match(pendingLoading,/GracefulPageLoading/);
 assert.match(pendingError,/insideShell/);
 assert.match(pendingError,/homeHref="\/dashboard"/);
 assert.match(pendingClient,/busyRef.current=true/);
 assert.match(pendingClient,/busyRef.current=false/);
 assert.match(pendingClient,/min-h-11 flex-1/);
 assert.match(pendingClient,/method:"POST",credentials:"same-origin"/);
 assert.match(pendingClient,/No invitations are awaiting your decision/);
});

test("G084 canonical invite verification remains server-attested, no-archive and keyboard accessible",()=>{
 assert.match(invite,/dynamic = "force-dynamic"/);
 assert.match(invite,/index: false, follow: false, noarchive: true/);
 assert.match(invite,/referrer: "no-referrer"/);
 assert.match(invite,/RecruiterInviteLanding token=\{token\}/);
 assert.match(inviteLoading,/PublicPageLoading label="Loading recruiter invitation/);
 assert.match(inviteError,/homeHref="\/"/);
 assert.match(inviteClient,/document.getElementById\("invite-code"\)\?\.focus\(\)/);
 assert.match(inviteClient,/codeDeliveryCount/);
 assert.match(inviteClient,/busyRef.current=true/);
 assert.match(inviteClient,/result\["accepted"\]!==true/);
 assert.match(inviteClient,/result\["signInEmail"\].trim\(\).toLowerCase\(\)!==verifiedRecipient.toLowerCase\(\)/);
 assert.match(inviteClient,/state==="pending"/);
});
