/** REC-calendar-messages-profile-25: local optional mobile validation.
 * Server repeats this invariant and alone converts to E.164. */
export function recruiterMobileNumberValid(input:string):boolean {
 if(!input.trim())return true;
 const normal=input.trim().replace(/[\s()-]/g,"");
 const national=normal.startsWith("+91")?normal.slice(3):normal.startsWith("91")?normal.slice(2):normal;
 return /^\d{10}$/.test(national);
}
