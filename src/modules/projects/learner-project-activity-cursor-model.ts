/** Page cursors come from the last fetched, authorized row, regardless of client filters. */
export function learnerProjectActivityLastFetched<T extends {id:string;cursorOccurredAt:string}>(
 fetched:readonly T[],
):T|undefined {return fetched.at(-1);}
