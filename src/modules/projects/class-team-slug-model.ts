/** Match the POST schema before enabling Create, without a failed server round trip. */
export function isValidClassTeamBaseSlug(value:string):boolean {
 return value.length>=1&&value.length<=50&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
