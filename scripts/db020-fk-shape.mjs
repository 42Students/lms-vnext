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
  // Match as a multiset, not by name first. A stale same-name catalog FK
  // must not hide another correctly shaped FK with a different name.
  // Pair all exact name+shape matches first, then remaining shape matches,
  // then classify genuinely unmatched same-name pairs as drift.
  const usedTyped=new Set(),usedCatalog=new Set();
  const sameNameSameShape=[],sameNameDrift=[],differentNameSameShape=[],missingTypedShape=[];
  const sameName=(t,c)=>normalizedTable(t.child)===normalizedTable(c.child)&&t.name===c.name;
  const match=(predicate,record)=>{
    for(let i=0;i<typed.length;i++){
      if(usedTyped.has(i))continue;
      const j=catalog.findIndex((c,index)=>!usedCatalog.has(index)&&predicate(typed[i],c));
      if(j===-1)continue;
      usedTyped.add(i);
      usedCatalog.add(j);
      record(typed[i],catalog[j]);
    }
  };
  match((t,c)=>sameName(t,c)&&foreignKeyShape(t)===foreignKeyShape(c),
    (t,c)=>sameNameSameShape.push({typed:t.name,catalog:c.name,child:t.child}));
  match((t,c)=>foreignKeyShape(t)===foreignKeyShape(c),
    (t,c)=>differentNameSameShape.push({child:t.child,typed:t.name,catalog:c.name}));
  match(sameName,(t,c)=>sameNameDrift.push({typed:t,catalog:c}));
  typed.forEach((t,i)=>{if(!usedTyped.has(i))missingTypedShape.push(t);});
  const catalogShapeWithoutTyped=catalog.filter((c,j)=>!usedCatalog.has(j));
  return {sameNameSameShape,sameNameDrift,differentNameSameShape,
    missingTypedShape,catalogShapeWithoutTyped,
    exactSameShapeCount:sameNameSameShape.length+differentNameSameShape.length};
}
