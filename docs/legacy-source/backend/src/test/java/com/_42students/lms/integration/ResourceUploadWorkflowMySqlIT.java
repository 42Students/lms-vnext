package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Canonical Resource presign integration. Verifies tenant-bound object keys and the upload receipt
 * that later authoring endpoints require before attaching a Resource file.
 */
@Transactional
@Rollback
class ResourceUploadWorkflowMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 102001;
    private static final int COLLEGE_B = 102002;
    private static final int ADMIN_A = 102011;
    private static final int LEARNER_A = 102021;
    private static final int DEPT_A = 102031;
    private static final int DEPT_B = 102032;
    private static final int PROGRAM_A = 102041;
    private static final int PROGRAM_B = 102042;
    private static final int CLASS_A = 102051;
    private static final int CLASS_B = 102052;
    private static final int COURSE_A = 102061;
    private static final int COURSE_B = 102062;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Resource Upload College A");
        seedCollege(COLLEGE_B, "Resource Upload College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "ResourceAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "ResourceLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Resource Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Resource Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Resource Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Resource Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);

        jdbc.update("insert into class (id, name, program_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Resource Section A', ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A);
        jdbc.update("insert into class (id, name, program_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Resource Section B', ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B);

        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'RSA', ?, 'Resource Course A', 0, 1, 1, 1, 'resource-course-a-it', 0, 0)", COURSE_A, DEPT_A);
        jdbc.update("insert into course (id, short_title, dept_id, course_name, parent_course_id, active, enabled, allowed_for_display, slug, version, is_deleted) "
                + "values (?, 'RSB', ?, 'Resource Course B', 0, 1, 1, 1, 'resource-course-b-it', 0, 0)", COURSE_B, DEPT_B);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String body(String fileName, String mime, long size, int courseId, Integer classId) {
        return "{\"fileName\":\"" + fileName + "\",\"contentType\":\"" + mime
                + "\",\"contentLength\":" + size + ",\"folder\":\"lesson-content\","
                + "\"type\":\"resource\",\"courseId\":" + courseId
                + (classId == null ? "" : ",\"classId\":" + classId) + "}";
    }

    @Test
    void validPresignMintsTenantCourseClassUserKeyAndPersistsReceipt() throws Exception {
        seedBase();

        String response = mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("lecture-notes.pdf", "application/pdf", 1024, COURSE_A, CLASS_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String prefix = "org-1/college-" + COLLEGE_A + "/lesson-content/course-" + COURSE_A
                + "/class-" + CLASS_A + "/user-" + ADMIN_A + "/";
        assertTrue(response.contains(prefix), response);
        assertTrue(response.contains("uploadReceiptId"), response);

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from assignment_upload_receipt where owner_user_id = ? "
                        + "and owner_user_type = 'FACULTY' and folder = 'lesson-content' "
                        + "and upload_type = 'resource' and storage_key like ? and is_deleted = 0",
                Integer.class, ADMIN_A, prefix + "%"));
        assertEquals(1024L, jdbc.queryForObject(
                "select declared_content_length from assignment_upload_receipt where owner_user_id = ? "
                        + "and upload_type = 'resource' order by id desc limit 1",
                Long.class, ADMIN_A));
    }

    @Test
    void learnerCannotPresignCanonicalResourceUpload() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("notes.pdf", "application/pdf", 100, COURSE_A, CLASS_A)))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from assignment_upload_receipt where owner_user_id = ?",
                Integer.class, LEARNER_A));
    }

    @Test
    void foreignCollegeCourseAndClassCannotBeUsedToMintResourceKey() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("foreign.pdf", "application/pdf", 100, COURSE_B, CLASS_B)))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from assignment_upload_receipt where owner_user_id = ?",
                Integer.class, ADMIN_A));
    }

    @Test
    void unsafeMimeAndPathLikeFilenameAreRejectedBeforeReceiptCreation() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("payload.exe", "application/octet-stream", 100, COURSE_A, CLASS_A)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("../notes.pdf", "application/pdf", 100, COURSE_A, CLASS_A)))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from assignment_upload_receipt where owner_user_id = ?",
                Integer.class, ADMIN_A));
    }

    @Test
    void zeroAndOversizeResourcesAreRejectedWithoutReceipts() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("empty.pdf", "application/pdf", 0, COURSE_A, CLASS_A)))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/v1/resource-uploads/presign")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("huge.pdf", "application/pdf", 52428801L, COURSE_A, CLASS_A)))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from assignment_upload_receipt where owner_user_id = ?",
                Integer.class, ADMIN_A));
    }
}
