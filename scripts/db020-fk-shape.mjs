// DB020 strictly structural relationship reconciliation. A matching FK shape
// is not proof of tenant policy or cascade-retention behavior.
export const normalizedTable = value =>
  String(value??"").replace(/^public\./,"").replaceAll('"',"");

export const foreignKeyShape = fk => JSON.stringify([
  normalizedTable(fk.child),
  normalizedTable(fk.parent),
  fk.columnsFrom??[],
  fk.columnsTo??[],
  String(fk.onDelete??"no action").toLowerCase(),
  String(fk.onUpdate??"no action").toLowerCase(),
]);

export function compareForeignKeyShapes(typed,catalog) {
  const byName = new Map(catalog.map(fk=>[normalizedTable(fk.child)+"."+fk.name,fk]));
  const allocated = new Set();
  const sameNameSameShape=[],sameNameDrift=[],differentNameSameShape=[],missingTypedShape=[];
  for(const t of typed) {
    const key=normalizedTable(t.child)+"."+t.name;
    const matchedByName=byName.get(key);
    if(matchedByName) {
      allocated.add(matchedByName);
      if(foreignKeyShape(matchedByName)===foreignKeyShape(t))
        sameNameSameShape.push({typed:t.name,catalog:matchedByName.name,child:t.child});
      else sameNameDrift.push({typed:t,catalog:matchedByName});
      continue;
    }
    const candidate=catalog.find(c=>
      !allocated.has(c) && foreignKeyShape(c)===foreignKeyShape(t));
    if(candidate){
      allocated.add(candidate);
      differentNameSameShape.push({child:t.child,typed:t.name,catalog:candidate.name});
    }else missingTypedShape.push(t);
  }
  const catalogShapeWithoutTyped=catalog.filter(c=>!allocated.has(c));
  return {sameNameSameShape,sameNameDrift,differentNameSameShape,
    missingTypedShape,catalogShapeWithoutTyped,
    exactSameShapeCount:sameNameSameShape.length+differentNameSameShape.length};
}
