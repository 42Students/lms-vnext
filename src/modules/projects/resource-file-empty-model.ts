export type ResourceFileLoadState="LOADING"|"READY"|"UNAVAILABLE"|"DENIED"|"ERROR";
export function resourceFileEmptyPresentation(input:{
 state:ResourceFileLoadState;recordCount:number;filteredCount:number;
}):{title:string;message:string;showRetry:boolean}|null{
 if(input.state==="LOADING")return {title:"Loading files",message:"Checking this resource's files.",showRetry:false};
 if(input.state==="DENIED")return {title:"Files unavailable",message:"You do not have access to these resource files.",showRetry:false};
 if(input.state==="UNAVAILABLE")return {title:"File storage unavailable",message:"Uploads and downloads are not ready for this Project.",showRetry:false};
 if(input.state==="ERROR")return {title:"Files could not be loaded",message:"Refresh the resource to try again.",showRetry:true};
 if(input.recordCount===0)return {title:"No files yet",message:"No file has been attached to this Project resource.",showRetry:false};
 if(input.filteredCount===0)return {title:"No matching files",message:"Clear the search or status filter to see other files.",showRetry:false};
 return null;
}
