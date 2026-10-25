/** The prototype's quick categories open the existing authorization-checked
 * change-request composer. They do not mutate a drive on navigation. */
export const RECRUITER_CHANGE_SHORTCUTS=[
 {key:"time",label:"A round's date or time",field:"ROUNDS",help:"e.g. start the HR round at 3"},
 {key:"round",label:"Add or remove a round",field:"ROUNDS",help:""},
 {key:"eligibility",label:"Who can apply",field:"BRANCHES",help:"branches, CGPA"},
 {key:"pay",label:"Pay or location",field:"CTC",help:""},
 {key:"other",label:"Something else",field:"OTHER",help:""},
] as const;
export function recruiterChangeShortcut(value:unknown){
 if(typeof value!=="string")return null;
 return RECRUITER_CHANGE_SHORTCUTS.find(row=>row.key===value)??null;
}
