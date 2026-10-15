/** A completed quiz's delayed return must not fire after the attempt view unmounts. */
export function scheduleLearnerQuizReturn(
  action:()=>void, delayMs:number,
  schedule:(action:()=>void,delay:number)=>number,
  cancel:(timerId:number)=>void,
):()=>void {
  const id=schedule(action,delayMs);
  return ()=>cancel(id);
}
