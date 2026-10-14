/** Browser-local editor values are display-only; the command accepts ISO instants. */
export function localDateTimeInput(instant:string){
  const date=new Date(instant);
  if(!Number.isFinite(date.getTime()))return "";
  const pad=(value:number)=>String(value).padStart(2,"0");
  return [date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join("-")+
    "T"+[pad(date.getHours()),pad(date.getMinutes())].join(":");
}
export function validateFacultyScheduleWindow(start:string,end:string):string|null{
  if(!start||!end)return "Choose both a start and an end time.";
  const from=new Date(start).getTime();
  const to=new Date(end).getTime();
  if(!Number.isFinite(from)||!Number.isFinite(to))
    return "Enter valid start and end times.";
  if(to<=from)return "The end time must be later than the start time.";
  return null;
}
