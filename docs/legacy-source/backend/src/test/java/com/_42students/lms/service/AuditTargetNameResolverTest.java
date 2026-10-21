package com._42students.lms.service;

import com._42students.lms.model.AdminAuditLog;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuditTargetNameResolverTest {

    private static AdminAuditLog row(String action, String type, String id) {
        AdminAuditLog r = new AdminAuditLog();
        r.setActionKey(action);
        r.setEntityType(type);
        r.setEntityId(id);
        return r;
    }

    @Test
    void picksTheTableForEachKindOfRow() {
        assertEquals("learner", AuditTargetNameResolver.kindOf(row("LEARNER_SUSPEND", "user", "160")));
        assertEquals("faculty", AuditTargetNameResolver.kindOf(row("FACULTY_REACTIVATE", "user", "19")));
        assertEquals("learner", AuditTargetNameResolver.kindOf(row("LEARNER_IDENTITY_READ", "learner_profile", "56")));
        assertEquals("batch", AuditTargetNameResolver.kindOf(row("BATCH_PROMOTE", "batch", "12")));
        assertEquals("project", AuditTargetNameResolver.kindOf(row("PROJECT_DELETE", "PROJECT", "proj-6-x")));
        assertEquals("project_template", AuditTargetNameResolver.kindOf(row("PROJECT_TEMPLATE_UPDATE", "PROJECT_TEMPLATE", "ai-platform")));
        assertEquals("program", AuditTargetNameResolver.kindOf(row("PROGRAM_UPDATE", "program", "8")));
        assertNull(AuditTargetNameResolver.kindOf(row("COLLEGE_UPDATE", "college", "6")));
        assertEquals("project:proj-6-x", AuditTargetNameResolver.keyOf(row("PROJECT_DELETE", "PROJECT", "proj-6-x")));
    }

    @Test
    void noDatabaseMeansNoNamesNotAnError() {
        assertTrue(new AuditTargetNameResolver().resolve(java.util.List.of(row("BATCH_PROMOTE", "batch", "12"))).isEmpty());
    }
}
