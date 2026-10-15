export function effectiveTpoVerifierSetting(row:{enabled:boolean}|undefined):boolean {
 // Legacy default when the college has never saved the switch.
 return row?.enabled??true;
}
