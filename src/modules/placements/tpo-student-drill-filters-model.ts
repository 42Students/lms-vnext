export function tpoJourneyDrillFilters(filters:{
 branchId?:string;search?:string;pageSize:number;columns?:string;
},journeyState:string){
 return {...filters,journeyState,page:1};
}
export function tpoBranchDrillFilters(filters:{
 journeyState?:string;search?:string;pageSize:number;columns?:string;
},branchId:string){
 return {...filters,branchId,page:1};
}
