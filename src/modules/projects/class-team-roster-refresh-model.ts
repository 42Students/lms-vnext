/** The class team preview is disposable; refresh only while no mutation or load is in flight. */
export function canRefreshClassTeamRoster(classId:string,loading:boolean,pending:boolean){
 return classId.trim().length>0&&!loading&&!pending;
}
