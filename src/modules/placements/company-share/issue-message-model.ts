export function companyShareIssueFailureMessage(code:string|undefined){
 return code==="ACTIVE_LINK_LIMIT"
  ?"This drive already has 10 active share links. Revoke one before creating another."
  :"Link could not be created. Confirm access and try again.";
}
