import { useMemo } from "react";
import ChangeRequests from "@/components/tpo/drive/ChangeRequests";
import {
  acceptRecruiterChangeRequest, answerRecruiterChangeRequest, createRecruiterChangeRequest, listRecruiterChangeRequests,
  replyRecruiterChangeRequest, withdrawRecruiterChangeRequest,
} from "@/api/Services/RecruiterService";

/**
 * The recruiter's side of a drive's change requests (recruiter phase 1, N8/N14): Institutional requests from the placement cell
 * are answered here in one step (Accept, an answer, or a reply), and the company can ask the placement cell for a change.
 * Same component and design as the placement cell's side.
 */
export default function RecruiterChangeRequests({ collegeId, jobId, readOnly, onChanged, onDiscuss, live = false }) {
  const api = useMemo(() => ({
    list: (j) => listRecruiterChangeRequests(collegeId, j),
    create: (j, body) => createRecruiterChangeRequest(collegeId, j, body),
    accept: (id) => acceptRecruiterChangeRequest(collegeId, id),
    answer: (id, value) => answerRecruiterChangeRequest(collegeId, id, value),
    reply: (id, value) => replyRecruiterChangeRequest(collegeId, id, value),
    withdraw: (id) => withdrawRecruiterChangeRequest(collegeId, id),
  }), [collegeId]);
  return <ChangeRequests jobId={jobId} side="company" api={api} readOnly={readOnly} onChanged={onChanged} onDiscuss={onDiscuss} live={live} />;
}
