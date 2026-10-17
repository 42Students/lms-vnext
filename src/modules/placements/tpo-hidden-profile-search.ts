/** Server-side only matching of consented placement profile search facets.
 * Never serialize the extracted contact or skill values back into the roster. */
export function tpoHiddenProfileMatchesSearch(document:unknown,search:string):boolean {
 const term=search.trim().toLocaleLowerCase("en-IN");
 if(!term)return false;
 if(!document||typeof document!=="object"||Array.isArray(document))return false;
 const root=document as Record<string,unknown>;
 const object=(raw:unknown):Record<string,unknown>=>raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const personal=object(root.personalDetails),contact=object(root.contactDetails),
  social=object(root.socialProfiles);
 const keys=["phone","phoneNumber","mobile","mobileNumber","alternatePhone","dateOfBirth","city","district","state","address"];
 const values:unknown[]=[
  ...keys.map(key=>personal[key]),...keys.map(key=>contact[key]),
  ...["linkedinUrl","githubUrl","portfolioUrl","leetcodeUrl","codechefUrl","codeforcesUrl"].map(key=>social[key]),
 ];
 // Skill and course names are searchable, but identity proofs and document IDs are not.
 for(const group of ["skills","projects","certifications","experiences","education"]){
  if(!Array.isArray(root[group]))continue;
  for(const entry of root[group].slice(0,100)){
   const item=object(entry);
   for(const key of ["name","title","institution","institutionName","companyName","technology","description"])
    if(typeof item[key]==="string")values.push(item[key]);
  }
 }
 return values.some(value=>typeof value==="string"&&value.toLocaleLowerCase("en-IN").includes(term));
}
