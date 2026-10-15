/** Exact college account-menu copy from legacy-copy-A.md profiledropdown.js. */
export function accountActionCopy(legacyCollege: boolean) {
  return legacyCollege
    ? {accountLabel:"My Account",accountHref:"/college/profile",signOutLabel:"Logout"}
    : {accountLabel:"Security",accountHref:"/account/security",signOutLabel:"Sign out"};
}
