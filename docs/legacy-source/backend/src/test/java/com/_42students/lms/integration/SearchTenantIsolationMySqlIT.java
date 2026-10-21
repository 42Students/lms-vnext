package com._42students.lms.integration;

import com._42students.lms.search.batches.BatchSearchCache;
import com._42students.lms.search.classes.ClassSearchCache;
import com._42students.lms.search.colleges.CollegeSearchCache;
import com._42students.lms.search.courses.CourseSearchCache;
import com._42students.lms.search.departments.DepartmentSearchCache;
import com._42students.lms.search.faculty.FacultySearchCache;
import com._42students.lms.search.learners.LearnerSearchCache;
import com._42students.lms.search.programs.ProgramSearchCache;
import com._42students.lms.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real-MySQL + real-cache tenant isolation for the high-value v2 directory/search surfaces.
 *
 * <p>No rollback transaction on purpose: these caches are application singletons. Each test
 * explicitly seeds, refreshes, cleans and refreshes again so an in-memory DTO cannot survive a
 * rolled-back fixture and contaminate a later test.</p>
 */
class SearchTenantIsolationMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 989960;
    private static final int COLLEGE_B = 989961;
    private static final int ADMIN_A = 989962;
    private static final int FACULTY_A = 989963;
    private static final int FACULTY_B = 989964;
    private static final int LEARNER_A = 989965;
    private static final int LEARNER_B = 989966;
    private static final int DEPT_A = 989967;
    private static final int DEPT_B = 989968;
    private static final int PROGRAM_A = 989969;
    private static final int PROGRAM_B = 989970;
    private static final long BATCH_A = 989971L;
    private static final long BATCH_B = 989972L;
    private static final int CLASS_A = 989973;
    private static final int CLASS_B = 989974;
    private static final int COURSE_A = 989975;
    private static final int COURSE_B = 989976;

    @Autowired private LearnerSearchCache learnerCache;
    @Autowired private FacultySearchCache facultyCache;
    @Autowired private DepartmentSearchCache departmentCache;
    @Autowired private CourseSearchCache courseCache;
    @Autowired private ProgramSearchCache programCache;
    @Autowired private BatchSearchCache batchCache;
    @Autowired private ClassSearchCache classCache;
    @Autowired private CollegeSearchCache collegeCache;

    @BeforeEach
    void seedAndRefresh() {
        cleanupDb();

        seedCollege(COLLEGE_A, "Search Tenant Alpha College");
        seedCollege(COLLEGE_B, "Search Tenant Beta College");
        jdbc.update("update college set city='AlphaCity', state='AlphaState' where id=?", COLLEGE_A);
        jdbc.update("update college set city='BetaCity', state='BetaState' where id=?", COLLEGE_B);

        seedDepartment(DEPT_A, COLLEGE_A, "Alpha Engineering");
        seedDepartment(DEPT_B, COLLEGE_B, "Beta Engineering");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted, created_at, updated_at) "
                + "values (?, 'Alpha Program', ?, 4, 0, now(), now())", PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted, created_at, updated_at) "
                + "values (?, 'Beta Program', ?, 4, 0, now(), now())", PROGRAM_B, DEPT_B);

        jdbc.update("insert into batch (id, batch_name, program_id, academic_year, current_semester, status, created_at, updated_at) "
                + "values (?, 'Alpha Batch', ?, '2026-27', 1, 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, academic_year, current_semester, status, created_at, updated_at) "
                + "values (?, 'Beta Batch', ?, '2026-27', 1, 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);

        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, is_deleted, created_at, updated_at) "
                + "values (?, 'Alpha Section', ?, ?, 60, 0, 0, now(), now())", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, is_deleted, created_at, updated_at) "
                + "values (?, 'Beta Section', ?, ?, 60, 0, 0, now(), now())", CLASS_B, PROGRAM_B, BATCH_B);

        jdbc.update("insert into course (id, course_name, short_title, dept_id, parent_course_id, active, enabled, slug, version, is_deleted, created_at, updated_at) "
                + "values (?, 'Alpha Algorithms', 'ALPHAALG', ?, 0, 1, 1, 'alpha-alg-it', 0, 0, now(), now())", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, course_name, short_title, dept_id, parent_course_id, active, enabled, slug, version, is_deleted, created_at, updated_at) "
                + "values (?, 'Beta Databases', 'BETADB', ?, 0, 1, 1, 'beta-db-it', 0, 0, now(), now())", COURSE_B, DEPT_B);

        seedFaculty(ADMIN_A, COLLEGE_A, "AlphaAdmin");
        jdbc.update("update faculty set faculty_type=0, dept_id=?, department='Alpha Engineering' where id=?", DEPT_A, ADMIN_A);
        seedFaculty(FACULTY_A, COLLEGE_A, "AlphaFaculty");
        jdbc.update("update faculty set dept_id=?, department='Alpha Engineering' where id=?", DEPT_A, FACULTY_A);
        seedFaculty(FACULTY_B, COLLEGE_B, "BetaSecretFaculty");
        jdbc.update("update faculty set dept_id=?, department='Beta Engineering' where id=?", DEPT_B, FACULTY_B);

        seedLearner(LEARNER_A, COLLEGE_A, "AlphaLearner");
        jdbc.update("update learner set program_id=?, class_id=?, department='Alpha Engineering' where id=?", PROGRAM_A, CLASS_A, LEARNER_A);
        seedLearner(LEARNER_B, COLLEGE_B, "BetaSecretLearner");
        jdbc.update("update learner set program_id=?, class_id=?, department='Beta Engineering' where id=?", PROGRAM_B, CLASS_B, LEARNER_B);

        refreshAll();
    }

    @AfterEach
    void cleanupAndRefresh() {
        cleanupDb();
        refreshAll();
    }

    @Test
    void collegeAdminLearnerDirectoryCannotSearchSiblingCollegeLearner() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        String body = mvc.perform(get("/api/v2/learners/search")
                        .header("Authorization", "Bearer " + token)
                        .param("query", "BetaSecretLearner"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(body.contains("BetaSecretLearner"), body);
        assertFalse(body.contains("learner-" + LEARNER_B + "@integration.test"), body);
    }

    @Test
    void facultySearchIgnoresForgedSiblingCollegeFilterAndDoesNotLeakFaculty() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        String body = mvc.perform(get("/api/v2/faculty/search")
                        .header("Authorization", "Bearer " + token)
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .param("query", "BetaSecretFaculty"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(body.contains("BetaSecretFaculty"), body);
        assertTrue(body.contains("\"data\":[]") || !body.contains(String.valueOf(FACULTY_B)), body);
    }

    @Test
    void departmentAndCourseSearchCannotCrossCollegeThroughExplicitIds() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        mvc.perform(get("/api/v2/departments/college/" + COLLEGE_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v2/courses/department/" + DEPT_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        String ownSearch = mvc.perform(get("/api/v2/courses/search")
                        .header("Authorization", "Bearer " + token)
                        .param("query", "Beta Databases"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(ownSearch.contains("Beta Databases"), ownSearch);
    }

    @Test
    void programBatchAndClassSearchRejectForeignHierarchyIds() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        mvc.perform(get("/api/v2/programs/department/" + DEPT_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v2/batches/program/" + PROGRAM_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v2/classes/program/" + PROGRAM_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void scopedSearchStatsAndExistsRemainInsideCollege() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        String facultyExists = mvc.perform(get("/api/v2/faculty/exists/BetaSecretFaculty")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(facultyExists.contains("false"), facultyExists);

        String courseExists = mvc.perform(get("/api/v2/courses/exists/Beta Databases")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(courseExists.contains("false"), courseExists);

        String learnerStats = mvc.perform(get("/api/v2/learners/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(learnerStats.contains("BetaSecretLearner"), learnerStats);
    }

    @Test
    void scopedUsersCannotInflatePopularityForForeignEntities() throws Exception {
        String token = accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v2/faculty/" + FACULTY_B + "/select")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v2/courses/" + COURSE_B + "/select")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v2/classes/" + CLASS_B + "/select")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void collegeSearchWithinOrganizationDoesNotReturnOtherOrganizationCollege() throws Exception {
        final int orgTwo = 989980;
        final int collegeOrgTwo = 989981;
        jdbc.update("insert into organization (id, name, is_deleted) values (?, 'Other Search Org', 0)", orgTwo);
        jdbc.update("insert into college (id, name, org_id, city, state, is_deleted) "
                + "values (?, 'Other Org Secret College', ?, 'HiddenCity', 'HiddenState', 0)", collegeOrgTwo, orgTwo);
        collegeCache.refresh();

        UserPrincipal orgScoped = new UserPrincipal(ADMIN_A, "FACULTY", "ADMIN", 1, null, 0);
        String token = accessToken(orgScoped);

        String body = mvc.perform(get("/api/v2/colleges/search")
                        .header("Authorization", "Bearer " + token)
                        .param("query", "Other Org Secret College")
                        .param("orgId", String.valueOf(orgTwo)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertFalse(body.contains("Other Org Secret College"), body);

        jdbc.update("delete from college where id=?", collegeOrgTwo);
        jdbc.update("delete from organization where id=?", orgTwo);
        collegeCache.refresh();
    }

    @Test
    void collegeStateAndCityFiltersCannotLeakOtherOrganization() throws Exception {
        final int orgTwo = 989980;
        final int collegeOrgTwo = 989981;
        jdbc.update("insert into organization (id, name, is_deleted) values (?, 'Other Search Org', 0)", orgTwo);
        jdbc.update("insert into college (id, name, org_id, city, state, is_deleted) "
                + "values (?, 'Other Org Secret College', ?, 'HiddenCity', 'HiddenState', 0)", collegeOrgTwo, orgTwo);
        collegeCache.refresh();

        UserPrincipal orgScoped = new UserPrincipal(ADMIN_A, "FACULTY", "ADMIN", 1, null, 0);
        String token = accessToken(orgScoped);

        String byState = mvc.perform(get("/api/v2/colleges/search")
                        .header("Authorization", "Bearer " + token)
                        .param("state", "HiddenState")
                        .param("orgId", String.valueOf(orgTwo))
                        .param("limit", "50"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(byState.contains("Other Org Secret College"), byState);

        String byCity = mvc.perform(get("/api/v2/colleges/search")
                        .header("Authorization", "Bearer " + token)
                        .param("city", "HiddenCity")
                        .param("orgId", String.valueOf(orgTwo))
                        .param("limit", "50"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertFalse(byCity.contains("Other Org Secret College"), byCity);

        jdbc.update("delete from college where id=?", collegeOrgTwo);
        jdbc.update("delete from organization where id=?", orgTwo);
        collegeCache.refresh();
    }

    @Test
    void collegeExistsCannotActAsCrossOrganizationExistenceOracle() throws Exception {
        final int orgTwo = 989980;
        final int collegeOrgTwo = 989981;
        jdbc.update("insert into organization (id, name, is_deleted) values (?, 'Other Search Org', 0)", orgTwo);
        jdbc.update("insert into college (id, name, org_id, city, state, is_deleted) "
                + "values (?, 'Other Org Secret College', ?, 'HiddenCity', 'HiddenState', 0)", collegeOrgTwo, orgTwo);
        collegeCache.refresh();

        UserPrincipal orgScoped = new UserPrincipal(ADMIN_A, "FACULTY", "ADMIN", 1, null, 0);
        String token = accessToken(orgScoped);

        String body = mvc.perform(get("/api/v2/colleges/exists/Other Org Secret College")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("false"), body);

        String global = mvc.perform(get("/api/v2/colleges/exists/Other Org Secret College")
                        .header("Authorization", "Bearer " + accessToken(superAdminPrincipal())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(global.contains("true"), global);

        jdbc.update("delete from college where id=?", collegeOrgTwo);
        jdbc.update("delete from organization where id=?", orgTwo);
        collegeCache.refresh();
    }

    private void refreshAll() {
        collegeCache.refresh();
        departmentCache.refresh();
        programCache.refresh();
        batchCache.refresh();
        classCache.refresh();
        courseCache.refresh();
        facultyCache.refresh();
        learnerCache.refresh();
    }

    private void cleanupDb() {
        try {
            jdbc.update("delete from learner where id in (?,?)", LEARNER_A, LEARNER_B);
            jdbc.update("delete from faculty where id in (?,?,?)", ADMIN_A, FACULTY_A, FACULTY_B);
            jdbc.update("delete from class where id in (?,?)", CLASS_A, CLASS_B);
            jdbc.update("delete from batch where id in (?,?)", BATCH_A, BATCH_B);
            jdbc.update("delete from course where id in (?,?)", COURSE_A, COURSE_B);
            jdbc.update("delete from new_program where id in (?,?)", PROGRAM_A, PROGRAM_B);
            jdbc.update("delete from department where id in (?,?)", DEPT_A, DEPT_B);
            jdbc.update("delete from college where id in (?,?)", COLLEGE_A, COLLEGE_B);
            jdbc.update("delete from college where id=989981");
            jdbc.update("delete from organization where id=989980");
        } catch (Exception ignored) {
        }
    }
}
