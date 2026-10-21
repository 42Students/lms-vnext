package com._42students.lms.configuration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins the academic-structure mutation gate in {@link WebSecurityConfig}.
 *
 * <p>Creating, editing and deleting academic structure (batches, classes, semesters, programs,
 * courses, lessons, lesson content, class schedules, lecture halls) is gated in exactly one place:
 * the four antMatchers over ACADEMIC_ADMIN_PATHS. That single gate is load-bearing, because an
 * audit of every mutating endpoint under those prefixes found 32 of them relying on nothing
 * stronger than a requireAccessX call — which, for any non-learner, reduces to a bare college-id
 * match with no role test at all. Widening this rule back to FACULTY therefore does not degrade
 * gracefully: it immediately re-opens batch promotion, semester deletion and lesson deletion
 * (which cascade-deletes content rows and the backing R2 files) to every faculty account in the
 * college.
 *
 * <p>The controller-slice access tests cannot cover this: they all run with addFilters = false and
 * explicitly exclude WebSecurityConfig, so no test in the suite exercises these matchers. This
 * reads the configuration source directly rather than standing up a full servlet context — the
 * thing that can regress is the text of the rule, and that is precisely what is asserted.
 */
class AcademicAdminPathGateTest {

    private static final Path CONFIG = Paths.get(
            "src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java");

    /** The prefixes the gate covers. Dropping one silently un-gates a whole controller. */
    private static final List<String> EXPECTED_PATHS = List.of(
            "/api/v1/courses/**",
            "/api/v1/lesson/**",
            "/api/v1/batch/**",
            "/api/v1/class/**",
            "/api/v1/semester/**",
            "/api/v1/program/**",
            "/api/v1/scheduleClass/**",
            "/api/v1/lectureHall/**",
            "/api/v1/faculty-course-associations/**");

    private String source() throws IOException {
        assertTrue(Files.exists(CONFIG), "WebSecurityConfig.java not found at " + CONFIG.toAbsolutePath()
                + " — run this test from the backend module root.");
        return Files.readString(CONFIG);
    }

    @Test
    @DisplayName("every mutating verb over ACADEMIC_ADMIN_PATHS is gated, and none of them admits FACULTY")
    void mutatingVerbsRequireAnAdminRole() throws IOException {
        String src = source();

        Pattern rule = Pattern.compile(
                "\\.antMatchers\\(HttpMethod\\.(POST|PUT|PATCH|DELETE),\\s*ACADEMIC_ADMIN_PATHS\\)\\s*\\.(\\w+)\\(([^)]*)\\)");
        Matcher m = rule.matcher(src);

        List<String> verbsSeen = new ArrayList<>();
        while (m.find()) {
            String verb = m.group(1);
            String roles = m.group(3);
            verbsSeen.add(verb);

            assertFalse(roles.contains("\"FACULTY\""),
                    verb + " over ACADEMIC_ADMIN_PATHS admits FACULTY (" + roles.trim() + "). A non-admin "
                            + "faculty account would regain the ability to promote batches, delete semesters "
                            + "and delete lessons, because the controllers underneath enforce no role of their own.");
            assertTrue(roles.contains("\"ADMIN\""),
                    verb + " over ACADEMIC_ADMIN_PATHS must still admit ADMIN — that is the college admin "
                            + "console's own role. Found: " + roles.trim());
            assertTrue(roles.contains("\"SUPER_ADMIN\""),
                    verb + " over ACADEMIC_ADMIN_PATHS must name SUPER_ADMIN explicitly, rather than relying "
                            + "on the synthetic super-admin principal happening to carry facultyType=ADMIN. Found: "
                            + roles.trim());
        }

        assertEquals(List.of("POST", "PUT", "PATCH", "DELETE"), verbsSeen,
                "Expected exactly one gate for each mutating verb over ACADEMIC_ADMIN_PATHS. A missing verb "
                        + "falls through to the catch-all \"/api/v1/** -> authenticated()\" rule, which any "
                        + "logged-in learner satisfies.");
    }

    @Test
    @DisplayName("ACADEMIC_ADMIN_PATHS still covers every controller prefix it was written for")
    void pathListIsIntact() throws IOException {
        String src = source();
        int start = src.indexOf("ACADEMIC_ADMIN_PATHS = {");
        assertTrue(start > 0, "ACADEMIC_ADMIN_PATHS constant not found");
        String block = src.substring(start, src.indexOf("};", start));

        for (String path : EXPECTED_PATHS) {
            assertTrue(block.contains("\"" + path + "\""),
                    "ACADEMIC_ADMIN_PATHS no longer covers " + path + ". Every mutating endpoint under that "
                            + "prefix would fall back to its controller's own check, which is a bare college-id "
                            + "match with no role test.");
        }
    }

    @Test
    @DisplayName("the faculty carve-out covers only editing, deleting and reordering lesson content")
    void facultyCarveOutStaysNarrow() throws IOException {
        String src = source();
        Pattern rule = Pattern.compile("\\.antMatchers\\(HttpMethod\\.(PUT|DELETE),([^)]*)\\)\\s*\\.hasAnyRole\\(([^)]*\"FACULTY\"[^)]*)\\)");
        Matcher m = rule.matcher(src);
        List<String> paths = new ArrayList<>();
        while (m.find()) {
            for (String p : m.group(2).split(",")) {
                String t = p.trim().replace("\"", "");
                if (t.startsWith("/api/v1/lesson")) paths.add(m.group(1) + " " + t);
            }
        }
        assertEquals(List.of(
                "PUT /api/v1/lesson/contents/update/**",
                "PUT /api/v1/lesson/contents/class-content-order",
                "DELETE /api/v1/lesson/contents/delete/**"), paths,
                "Only these lesson-content routes may admit FACULTY. Lessons themselves (create, delete, reorder) "
                        + "stay admin-only: deleting a lesson cascades to its content and files.");
    }
}
