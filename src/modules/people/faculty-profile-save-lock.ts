/** Ref-based lock prevents two rapid clicks from reusing one optimistic version. */
export function beginFacultyProfileSave(lock:{current:boolean}):boolean{
 if(lock.current)return false;
 lock.current=true;
 return true;
}
