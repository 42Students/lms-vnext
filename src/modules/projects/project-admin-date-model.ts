/** IIT Dharwad Projects: calendar dates are always in the product's IST zone. */
export function formatProjectAdminUpdatedDateIst(value:Date):string {
  return new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeZone:"Asia/Kolkata",
  }).format(value);
}
