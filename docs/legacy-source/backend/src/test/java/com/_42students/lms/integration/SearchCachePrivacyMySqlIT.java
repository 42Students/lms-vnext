package com._42students.lms.integration;

import com._42students.lms.search.faculty.FacultySearchCache;
import com._42students.lms.search.learners.LearnerSearchCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tenant/privacy/staleness evidence for the two search caches containing user PII.
 */
class SearchCachePrivacyMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 109601;
    private static final int COLLEGE_B = 109602;
    private static final int ADMIN_A = 109611;
    private static final int LECTURER_A = 109612;
    private static final int FACULTY_B = 109613;
    private static final int LEARNER_A = 109621;
    private static final int LEARNER_B = 109622;
    private static final int DEPT_A = 109631;
    private static final int PROGRAM_A = 109641;
    private static final long BATCH_A = 109651L;
    private static final int CLASS_A = 109661;
    private static final int COURSE_A = 109671;
    private static final int ASSIGNMENT_ID = 109681;

    @Autowired
    private LearnerSearchCache learnerCache;

    @Autowired
    private FacultySearchCache facultyCache;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from faculty_teaching_assignment where id = ?", ASSIGNMENT_ID);
        jdbc.update("delete from learner where id in (?, ?)", LEARNER_A, LEARNER_B);
        jdbc.update("delete from course where id = ?", COURSE_A);
        jdbc.update("delete from class where id = ?", CLASS_A);
        jdbc.update("delete from batch where id = ?", BATCH_A);
        jdbc.update("delete from new_program where id = ?", PROGRAM_A);
        jdbc.update("delete from department where id = ?", DEPT_A);
        jdbc.update("delete from faculty where id in (?, ?, ?)", ADMIN_A, LECTURER_A, FACULTY_B);
        jdbc.update("delete from college where id in (?, ?)", COLLEGE_A, COLLEGE_B);
        learnerCache.refresh();
        facultyCache.refresh();
    }

    private void seedPeople() {
        seedCollege(COLLEGE_A, "Search Privacy College A");
        seedCollege(COLLEGE_B, "Search Privacy College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "SearchAdminA");
        seedFaculty(LECTURER_A, COLLEGE_A, "SearchFacultyOwn");
        seedFaculty(FACULTY_B, COLLEGE_B, "SearchFacultyForeign");
        seedLearner(LEARNER_A, COLLEGE_A, "SearchLearnerOwn");
        seedLearner(LEARNER_B, COLLEGE_B, "SearchLearnerForeign");
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    @Test
    void collegeAdminLearnerSearchAndExistsCannotEnumerateSiblingCollege() throws Exception {
        seedPeople();
        learnerCache.refresh();

        String body = mvc.perform(get("/api/v2/learners/search")
                        .param("query", "SearchLearner")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("SearchLearnerOwn"), body);
        assertTrue(!body.contains("SearchLearnerForeign"), body);

        String exists = mvc.perform(get("/api/v2/learners/exists/{learnerName}", "SearchLearnerForeign Integration")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(exists.contains("false"), exists);
    }

    @Test
    void learnerPopularRankingCannotSurfaceForeignTenantEvenAfterOwnSelection() throws Exception {
        seedPeople();
        learnerCache.refresh();

        mvc.perform(post("/api/v2/learners/{learnerId}/select", LEARNER_A)
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        String body = mvc.perform(get("/api/v2/learners/popular")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("SearchLearnerOwn"), body);
        assertTrue(!body.contains("SearchLearnerForeign"), body);
    }

    @Test
    void assignedFacultyCanSearchOwnClassButLearnerEmailAndPhoneAreRedacted() throws Exception {
        seedPeople();
        seedDepartment(DEPT_A, COLLEGE_A, "Search Privacy Dept");
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) "
                + "values (?, 'Search Privacy Program', ?, 4, 0)", PROGRAM_A, DEPT_A);
        jdbc.update("insert into batch "
                + "(id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Search Privacy Batch', ?, 1, 1, '2026-27', 'ACTIVE', now(), now())",
                BATCH_A, PROGRAM_A);
        jdbc.update("insert into class "
                + "(id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Search Privacy Section', ?, ?, 60, 0, 'SECTION', 0)",
                CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into course "
                + "(id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'SPC', ?, 'Search Privacy Course', 0, 1, 1, 1, 'search-privacy-course-it', 0, 0)",
                COURSE_A, DEPT_A);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?",
                PROGRAM_A, CLASS_A, LEARNER_A);
        jdbc.update("insert into faculty_teaching_assignment "
                + "(id, faculty_id, course_id, class_id, batch_id, semester_number, academic_year, role, is_active, is_deleted) "
                + "values (?, ?, ?, ?, ?, 1, '2026-27', 'PRIMARY', 1, 0)",
                ASSIGNMENT_ID, LECTURER_A, COURSE_A, CLASS_A, BATCH_A);
        learnerCache.refresh();

        String body = mvc.perform(get("/api/v2/learners/search")
                        .param("query", "SearchLearnerOwn")
                        .param("classId", String.valueOf(CLASS_A))
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(LECTURER_A, "LECTURER", COLLEGE_A))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("SearchLearnerOwn"), body);
        assertTrue(!body.contains("learner-" + LEARNER_A + "@integration.test"), body);
        assertTrue(!body.contains(String.format("98%08d", Math.floorMod(LEARNER_A, 100_000_000))), body);
    }

    @Test
    void facultySearchAndPopularAreTenantScopedEvenForLearnerCaller() throws Exception {
        seedPeople();
        facultyCache.refresh();
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        String search = mvc.perform(get("/api/v2/faculty/search")
                        .param("query", "SearchFaculty")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(search.contains("SearchFacultyOwn"), search);
        assertTrue(!search.contains("SearchFacultyForeign"), search);

        String popular = mvc.perform(get("/api/v2/faculty/popular")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!popular.contains("SearchFacultyForeign"), popular);
    }

    @Test
    void manualRefreshEvictsSoftDeletedLearnerFromCacheAndSearch() throws Exception {
        seedPeople();
        learnerCache.refresh();

        String before = mvc.perform(get("/api/v2/learners/search")
                        .param("query", "SearchLearnerOwn")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(before.contains("SearchLearnerOwn"), before);

        jdbc.update("update learner set is_deleted = 1 where id = ?", LEARNER_A);
        mvc.perform(post("/api/v2/learners/refresh")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        String after = mvc.perform(get("/api/v2/learners/search")
                        .param("query", "SearchLearnerOwn")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!after.contains("SearchLearnerOwn"), after);
    }
}
