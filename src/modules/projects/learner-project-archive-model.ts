export function learnerProjectArchiveState(status:string): {readOnly:boolean;label:string|null} {
  return status === "ARCHIVED"
    ? {readOnly:true,label:"Archived · read only"}
    : {readOnly:false,label:null};
}
