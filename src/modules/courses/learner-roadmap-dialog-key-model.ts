/** The focused-item identity must change on client navigation between
 * Learning Path deep links so React initializes the correct modal. */
export function learnerRoadmapDialogKey(
 lessonId:string,itemId:string,focused:boolean,
):string{
 return lessonId+":"+itemId+":"+(focused?"focused":"normal");
}
