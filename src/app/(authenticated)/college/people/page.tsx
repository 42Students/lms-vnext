import CollegeContactsPage from "../contacts/page";

/** Keep the historical /college-admin/people destination on the canonical
 * college workspace URL. The old shared directory maps to role-specific
 * /college/people (browse) and /admin/people/directory (Super Admin);
 * /college/contacts remains the explicit contact lookup URL. The college
 * layout owns its People group tab, and the shared directory reauthorizes
 * the selected active COLLEGE_ADMIN membership before any query.
 */
export default async function CollegePeoplePage({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 return CollegeContactsPage({searchParams});
}
