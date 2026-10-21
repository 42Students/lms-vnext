package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/** Source-level regression for route ordering; supplement with authenticated MockMvc tests. */
class CollegeAdminPeoplePathGateTest {
    private static String config() throws Exception {
        return Files.readString(Path.of("src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java"));
    }

    @Test
    void peopleWritesAreAdminOnlyBeforeAuthenticatedCatchAll() throws Exception {
        String s = config();
        int gate = s.indexOf(".antMatchers(HttpMethod.POST, PEOPLE_ADMIN_POST_PATHS)");
        int fallback = s.indexOf(".antMatchers(\"/api/v1/**\").authenticated()");
        assertTrue(gate > 0 && gate < fallback, "People mutation gate must precede authenticated fallback");
        String paths = s.substring(s.indexOf("PEOPLE_ADMIN_POST_PATHS = {"), s.indexOf("};", s.indexOf("PEOPLE_ADMIN_POST_PATHS = {")));
        for (String path : List.of("/api/v1/faculty/register", "/api/v1/faculty/bulk-register",
                "/api/v1/faculty/createCourseMapping", "/api/v1/learner/register",
                "/api/v1/learner/bulk-register", "/api/v1/learner/bulk-imports/*/undo")) {
            assertTrue(paths.contains("\"" + path + "\""), path + " must require admin authority");
        }
        assertTrue(s.contains(".antMatchers(HttpMethod.PUT, \"/api/v1/faculty/update/**\", \"/api/v1/learner/update/**\")"));
        assertTrue(s.contains(".antMatchers(HttpMethod.DELETE, \"/api/v1/faculty/delete/**\", \"/api/v1/learner/delete/**\")"));
        assertTrue(s.contains(".hasAnyRole(\"ADMIN\", \"SUPER_ADMIN\")"));
    }

    @Test
    void extendedAcademicPathsAreRoleGatedWithoutBlockingProgressOrOtp() throws Exception {
        String s = config();
        String paths = s.substring(s.indexOf("ACADEMIC_ADMIN_PATHS = {"), s.indexOf("};", s.indexOf("ACADEMIC_ADMIN_PATHS = {")));
        assertTrue(paths.contains("\"/api/v1/new-program/**\""));
        assertTrue(paths.contains("\"/api/v1/program-structure/**\""));
        assertTrue(s.indexOf(".antMatchers(HttpMethod.PUT, \"/api/v1/lesson/contents/progress\").authenticated()")
                < s.indexOf(".antMatchers(HttpMethod.PUT, ACADEMIC_ADMIN_PATHS)"));
        assertTrue(s.indexOf(".antMatchers(\"/api/v1/faculty/login\", \"/api/v1/faculty/verifyOTP\").permitAll()")
                < s.indexOf(".antMatchers(HttpMethod.POST, PEOPLE_ADMIN_POST_PATHS)"));
    }
}
