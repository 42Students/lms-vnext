export function collegeJoinCopy(available:boolean,collegeName:string|null){
 return available&&collegeName?{title:`Join ${collegeName}`,canGrantAccess:false}:
 {title:"Invitation unavailable",canGrantAccess:false};
}
