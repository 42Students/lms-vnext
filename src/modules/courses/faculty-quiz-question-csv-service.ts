import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {getFacultyQuizReport} from "./faculty-assessment-report-service";
import {facultyReportCsvFilename} from "./faculty-report-csv";
import {facultyQuizQuestionAccuracyCsv} from "./faculty-quiz-question-csv";

const inputSchema=z.object({
 quizId:z.string().uuid(),
 deliveryId:z.string().uuid(),
}).strict();

/** Recalculate a question report under current, persisted Faculty Section scope. */
export async function getFacultyQuizQuestionCsvForDownload(context:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 const report=await getFacultyQuizReport(context,input.quizId,input.deliveryId);
 const data=facultyQuizQuestionAccuracyCsv(report.questions);
 return {
  ...data,
  filename:facultyReportCsvFilename("quiz",report.quiz.title+"-questions",report.quiz.sectionName),
 };
}
