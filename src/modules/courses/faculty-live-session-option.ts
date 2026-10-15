type SessionLabel={title:string;courseName:string;sectionName:string};
/** Do not mistake equal-named sessions belonging to different Sections. */
export function facultyLiveSessionOption(session:SessionLabel):string {
 return [session.title,session.courseName,session.sectionName].join(" · ");
}
