/** A submitted decision stays in the drawer until the server answers. */
export function canDismissVerificationDialog(key:string,saving:boolean):boolean {
 return key==="Escape"&&!saving;
}
