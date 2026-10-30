/** The delivery ordering API commits the *entire* visible lesson-content set.
 * Faculty can move only their own Section items; shared syllabus entries
 * retain their immutable positions, and assessments are not content-order
 * members. Submit all content IDs to satisfy the server's exact-set CAS.
 */
export function facultyBlueprintFullContentOrder(
 items:readonly {id:string;reorderable:boolean;contentOrderMember?:boolean}[],
 ownedOrder:readonly string[],
):string[]{
 const members=items.filter(item=>item.contentOrderMember);
 const owned=members.filter(item=>item.reorderable).map(item=>item.id);
 if(owned.length!==ownedOrder.length||
    new Set(ownedOrder).size!==ownedOrder.length||
    owned.some(id=>!ownedOrder.includes(id))||
    new Set(members.map(item=>item.id)).size!==members.length)
   throw new Error("Faculty content ordering changed: reload the lesson");
 let index=0;
 return members.map(item=>item.reorderable?ownedOrder[index++]!:item.id);
}
