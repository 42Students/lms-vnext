export function platformAuthPostureItems(){
 return [
  {id:"privileged-mfa",title:"Super Admin second factor",state:"RUNTIME UNVERIFIED",description:"A privileged second factor is required before production readiness. This screen does not infer its deployment state."},
  {id:"host",title:"Platform and college sign-in hosts",state:"DEPLOYMENT MANAGED",description:"Tenant-host acceptance and platform-host Super Admin restrictions require actual login isolation tests."},
  {id:"cookie",title:"Session cookie and CSRF policy",state:"SECURITY CONFIGURATION",description:"Cookie attributes and request-origin validation are enforced by the deployed auth stack, not edited here."},
  {id:"allowlist",title:"Privileged network controls",state:"RUNTIME UNVERIFIED",description:"Do not infer allowlist enforcement from missing UI controls; review deployment and infrastructure settings."},
  {id:"otp",title:"One-time code delivery and limits",state:"SOURCE INVENTORY",description:"See Platform settings for non-secret OTP budgets. Provider acceptance is not final device delivery."},
 ] as const;
}
