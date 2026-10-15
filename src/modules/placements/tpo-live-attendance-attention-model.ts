export function tpoLiveAttendanceAttention(counts:{total:number;checkedIn:number;noShow:number;pending:number;unknown:number}):string{
 if(counts.total>0&&counts.unknown===counts.total)return "No attendance evidence recorded for this roster";
 if(counts.unknown>0)return counts.unknown+" roster entries have unrecorded attendance";
 if(counts.pending>0)return counts.pending+" attendance decisions are pending";
 if(counts.noShow>0)return counts.noShow+" explicit no-shows recorded";
 if(counts.total===0)return "No active roster entries in this round";
 return "No unresolved attendance in the retrieved roster";
}
