/** Do not show host internals, unpublished figures or stack traces on a public page. */
export function publicPageAvailabilityMessage(source:"branding"|"metrics"){
 return source==="branding"
  ? "College information is temporarily unavailable. Public placement figures cannot be displayed safely."
  : "Public placement statistics are temporarily unavailable. Individual student information remains private.";
}
