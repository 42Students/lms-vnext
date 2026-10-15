export type VerificationFilterOption={id:string;label:string};
export type VerificationFilterChoiceList={items:VerificationFilterOption[];truncated:boolean};
export function missingSelectedChoice(items:readonly VerificationFilterOption[],selected:string){
 return Boolean(selected)&&!items.some(item=>item.id===selected);
}
