/** The Faculty search matches names/codes, never private learner contact fields. */
export function facultyFindMatches(term:string,values:readonly (string|null|undefined)[]){
 const needle=term.trim().normalize("NFKC").toLocaleLowerCase("en-IN");
 return needle.length>=2&&values.some(value=>
  value?.normalize("NFKC").toLocaleLowerCase("en-IN").includes(needle)??false);
}
export type FacultyFindGroup="Students"|"Colleagues"|"Courses"|"Assignments"|"Quizzes"|"Pages";
export type FacultyFindResult={
 key:string;group:FacultyFindGroup;label:string;context:string;href:string;
};
