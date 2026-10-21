package com._42students.lms.service.tpo;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "Who got until where, for which company": one entry per application, in the words a placement officer reads.
 * Pure rules, no database. Only outcomes are used here, never the private panelist comment on a result.
 * depth: 0 applied, 1 shortlisted or talk, 2 test, 3 group discussion or interview, 4 final round, 5 offer or placed.
 */
public final class StudentJourneyRules {

    public static final String APPLIED = "APPLIED";
    public static final String IN_PROGRESS = "IN_PROGRESS";
    public static final String CLEARED = "CLEARED";
    public static final String WAITLISTED = "WAITLISTED";
    public static final String NOT_SELECTED = "NOT_SELECTED";
    public static final String WITHDRAWN = "WITHDRAWN";
    public static final String OFFERED = "OFFERED";
    public static final String PLACED = "PLACED";

    private StudentJourneyRules() {
    }

    /**
     * @param stage         job_application.application_status
     * @param offerStatus   the live offer (RELEASED or ACCEPTED) or null
     * @param resultSeq     seq of the furthest round that has an applied result, or null
     * @param resultKind    kind of that round
     * @param resultName    name of that round
     * @param resultOutcome PASS, FAIL, HOLD or ABSENT on that round
     * @param currentSeq    seq of the round the student is in now, or null
     * @param currentKind   kind of that round
     * @param currentName   name of that round
     * @param roundsTotal   how many rounds the drive has
     */
    public static Map<String, Object> entry(Integer jobId, String company, String role, String stage, String offerStatus,
                                            Integer resultSeq, String resultKind, String resultName, String resultOutcome,
                                            Integer currentSeq, String currentKind, String currentName, int roundsTotal) {
        boolean inCurrent = currentSeq != null && (resultSeq == null || currentSeq > resultSeq);
        Integer seq = inCurrent ? currentSeq : resultSeq;
        String kind = inCurrent ? currentKind : resultKind;
        String round = inCurrent ? currentName : resultName;
        String lastOutcome = inCurrent ? null : resultOutcome;

        String outcome;
        if (offerStatus != null) outcome = "ACCEPTED".equals(offerStatus) || "HIRED".equals(stage) ? PLACED : OFFERED;
        else if ("HIRED".equals(stage)) outcome = PLACED;
        else if ("OFFERED".equals(stage)) outcome = OFFERED;
        else if ("REJECTED".equals(stage) || "FAIL".equals(lastOutcome) || "ABSENT".equals(lastOutcome)) outcome = NOT_SELECTED;
        else if ("WITHDRAWN".equals(stage)) outcome = WITHDRAWN;
        else if ("WAITLISTED".equals(stage) || "HOLD".equals(lastOutcome)) outcome = WAITLISTED;
        else if ("PASS".equals(lastOutcome)) outcome = CLEARED;
        else if (seq != null) outcome = IN_PROGRESS;
        else outcome = APPLIED;

        int depth;
        if (OFFERED.equals(outcome) || PLACED.equals(outcome)) depth = 5;
        else if (seq == null) depth = "SHORTLISTED".equals(stage) ? 1 : 0;
        else if ("INTERVIEW".equals(kind) && roundsTotal > 0 && seq >= roundsTotal) depth = 4;
        else if ("INTERVIEW".equals(kind) || "GD".equals(kind)) depth = 3;
        else if ("TEST".equals(kind) || "VENDOR_TEST".equals(kind)) depth = 2;
        else depth = 1;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("jobId", jobId);
        m.put("company", company);
        m.put("role", role);
        m.put("depth", depth);
        m.put("outcome", outcome);
        m.put("round", round);
        m.put("label", label(outcome, round));
        return m;
    }

    public static String label(String outcome, String round) {
        String r = round == null || round.isBlank() ? null : round;
        return switch (outcome) {
            case PLACED -> "Placed";
            case OFFERED -> "Offered";
            case NOT_SELECTED -> r == null ? "Not selected" : "Not selected at " + r;
            case CLEARED -> r == null ? "Cleared" : "Cleared " + r;
            case WAITLISTED -> r == null ? "Waitlisted" : "Waitlisted at " + r;
            case WITHDRAWN -> "Withdrew";
            case IN_PROGRESS -> r == null ? "In progress" : "In " + r;
            default -> "Applied";
        };
    }
}
