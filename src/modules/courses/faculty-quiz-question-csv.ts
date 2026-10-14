import {neutralizeFacultyCsvCell} from "./faculty-report-csv";

export type FacultyQuizQuestionExportRow={
 prompt:string;points:number;answeredCount:number;correctCount:number;
 accuracyPercent:number|null;
};
export const FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS=500;

function cell(raw:string|number|null){
 return '"'+neutralizeFacultyCsvCell(raw).replaceAll('"','""')+'"';
}

/** Only aggregate question accuracy, never raw learner answers or contact. */
export function facultyQuizQuestionAccuracyCsv(rows:readonly FacultyQuizQuestionExportRow[]){
 const kept=rows.slice(0,FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS);
 const omittedRows=Math.max(0,rows.length-kept.length);
 const head=["Question","Points","Answered","Correct","Accuracy (%)"].map(cell).join(",");
 const body=kept.map(row=>[
  row.prompt,row.points,row.answeredCount,row.correctCount,row.accuracyPercent,
 ].map(cell).join(","));
 if(omittedRows){
  body.push([String(omittedRows)+" more questions omitted by the 500-row cap.",null,null,null,null].map(cell).join(","));
 }
 return {csv:[head,...body].join("\r\n")+"\r\n",omittedRows};
}
