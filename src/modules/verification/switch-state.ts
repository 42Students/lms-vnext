export function effectiveTpoVerifierSetting(row:{enabled:boolean}|undefined):boolean {
 // Legacy default when the college has never saved the switch.
 return row?.enabled??true;
}

/** A missing delegate row is not a denial: active TPOs inherit the college
 * switch, like legacy. An explicit revocation still overrides that default. */
export function tpoVerifierGrantAllowed(row:{revokedAt:Date|null}|undefined):boolean {
 return row===undefined||row.revokedAt===null;
}
