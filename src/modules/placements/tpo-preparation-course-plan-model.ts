export function buildTpoPreparationCoursePlan(input:{
 ready:boolean;courseIds:readonly string[];minimumCompleted:number;
 catalog:readonly {id:string;name:string;code:string}[];
}){
 if(!input.ready)return {ready:false,courses:[],unresolved:0,minimumCompleted:0};
 const wanted=new Set(input.courseIds);
 const courses=input.catalog.filter(course=>wanted.has(course.id));
 return {ready:true,courses,unresolved:Math.max(0,wanted.size-courses.length),minimumCompleted:input.minimumCompleted};
}
