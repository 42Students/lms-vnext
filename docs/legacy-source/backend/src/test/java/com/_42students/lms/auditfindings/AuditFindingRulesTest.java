package com._42students.lms.auditfindings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The importer's copy of the lms-findings rules (scripts/rules.mjs there): the same files must pass and fail. */
class AuditFindingRulesTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private static ObjectNode finding() throws Exception {
        return (ObjectNode) JSON.readTree("""
                {"schema":1,"type":"finding","id":"2026-10-13-login-k7f3",
                 "title":"An unregistered phone number says Unable to send OTP","area":"login","roles":["public"],
                 "severity":"medium","kind":"bug","environment":"prod",
                 "where":{"repo":"lms2-fe","paths":["src/loginPages/Login.js"],"pages":["/login"]},
                 "summary":"A number with no account gets a generic failure instead of a clear message.",
                 "found_by":{"agent":"claude-code","session":"login audit"},"found_at":"2026-10-13T10:30:00+05:30"}""");
    }

    private static List<String> check(ObjectNode rec) {
        return AuditFindingRules.check(rec, rec.path("id").asText() + ".json");
    }

    @Test
    void aWellFormedFindingPasses() throws Exception {
        assertEquals(List.of(), check(finding()));
    }

    @Test
    void secretsAndRealPeoplesDetailsAreRefused() throws Exception {
        ObjectNode r = finding();
        r.put("evidence", "phone 9849012345, mail ravi.kumar@nsrit.edu.in, Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghij, password=Hunter2xyz");
        List<String> errors = check(r);
        assertTrue(errors.contains("contains a phone number"), errors.toString());
        assertTrue(errors.contains("contains an email address"), errors.toString());
        assertTrue(errors.contains("contains a JWT / bearer token"), errors.toString());
        assertTrue(errors.contains("contains a password or secret value"), errors.toString());
    }

    @Test
    void testDataIsAllowed() throws Exception {
        ObjectNode r = finding();
        r.put("evidence", "Tried 9876543210 and tester@example.com and qa@college.test");
        assertEquals(List.of(), check(r));
    }

    @Test
    void unknownValuesFieldsAndMismatchedIdsAreRefused() throws Exception {
        ObjectNode r = finding();
        r.put("severity", "urgent");
        r.put("area", "quiz");
        r.put("extra", 1);
        List<String> errors = check(r);
        assertTrue(errors.stream().anyMatch(e -> e.startsWith("\"severity\" must be one of")), errors.toString());
        assertTrue(errors.contains("the id's area must match \"area\""), errors.toString());
        assertTrue(errors.contains("unknown field \"extra\""), errors.toString());
        assertTrue(AuditFindingRules.check(finding(), "wrong-name.json").contains("the file must be named 2026-10-13-login-k7f3.json (its id)"));
    }

    @Test
    void agentsCannotMakeDecisionsAndFixedNeedsCommits() throws Exception {
        ObjectNode u = (ObjectNode) JSON.readTree("""
                {"schema":1,"type":"update","id":"2026-10-13-login-k7f3.u202610131145-x9q2","finding":"2026-10-13-login-k7f3",
                 "status":"verified","by":"codex","at":"2026-10-13T11:45:00+05:30"}""");
        List<String> errors = check(u);
        assertTrue(errors.stream().anyMatch(e -> e.startsWith("\"status\" must be one of")), errors.toString());
        u.put("status", "fixed");
        assertTrue(check(u).contains("a \"fixed\" update needs \"commits\""));
        u.putArray("commits").addObject().put("repo", "lms2-fe").put("sha", "38bd0eda");
        assertEquals(List.of(), check(u));
    }
}
