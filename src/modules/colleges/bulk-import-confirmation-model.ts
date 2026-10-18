/** Destructive college imports need a current organization and CSV snapshot. */
export function canApplyConfirmedCollegeBulkImport(input:{
 confirmed:boolean;
 inFlight:boolean;
 validRows:number;
 validationError:string;
 organizationId:string;
 selectionVersion:number;
 confirmationVersion:number;
}):boolean{
 return input.confirmed&&!input.inFlight&&
  Number.isSafeInteger(input.validRows)&&input.validRows>0&&input.validRows<=200&&
  !input.validationError&&Boolean(input.organizationId)&&
  input.selectionVersion===input.confirmationVersion;
}
