/** Server mutation remains authoritative; this only explains a potentially disruptive change. */
export function describePrimaryDomainSwitch(currentHost:string|null,newHost:string):string {
 if (currentHost === newHost) return "This address is already primary. No change is required.";
 return currentHost
  ? `Replacing ${currentHost} with ${newHost} changes which verified host is the primary college login address. Review redirects, bookmarks and live DNS before confirming. Existing DNS records are not edited.`
  : `Make ${newHost} the college primary login address. Confirm verified DNS and sign-in routing before proceeding. Existing DNS records are not edited.`;
}

/** Primary-host deletion requires an exact, case-sensitive hostname typed by the operator. */
export function canConfirmPrimaryDomainDelete(host:string,typed:string):boolean {
 return Boolean(host && typed === host);
}
