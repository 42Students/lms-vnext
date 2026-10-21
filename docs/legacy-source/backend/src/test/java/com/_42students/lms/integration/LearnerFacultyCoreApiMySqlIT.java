package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Learner/faculty HTTP integration checks that complement the deeper assignment/quiz service
 * lifecycle tests already in the suite. These prove identity scoping and controller/service/JPA
 * wiring against MySQL with real JWTs.
 */
@Transactional
@Rollback
class LearnerFacultyCoreApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 99901;
    private static final int COLLEGE_B = 99902;
    private static final int LEARNER_A = 99921;
    private static final int LEARNER_B = 99922;
    private static final int FACULTY_A = 99931;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Learner Faculty API College A");
        seedCollege(COLLEGE_B, "Learner Faculty API College B");
        seedLearner(LEARNER_A, COLLEGE_A, "LearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "LearnerB");
        seedFaculty(FACULTY_A, COLLEGE_A, "FacultyA");
    }

    @Test
    void learnerCanReadOwnAssignmentSubmissionsButNotAnotherLearners() throws Exception {
        seedBase();
        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_A))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/assignment/fetchSubmissionsByLearnerId")
                        .param("learnerId", String.valueOf(LEARNER_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void facultyCannotSubmitAnAssignmentAsAStudent() throws Exception {
        seedBase();
        String token = accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A));

        mvc.perform(post("/api/v1/assignment/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lesson_content_id\":1,\"student_id\":" + LEARNER_A +
                                ",\"html_content\":\"integration\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void facultyQuizCollectionAndLearnerOwnSubmissionCollectionReachRealRepositories() throws Exception {
        seedBase();
        String facultyToken = accessToken(facultyPrincipal(FACULTY_A, "LECTURER", COLLEGE_A));
        String learnerToken = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        // With no course filter, faculty gets the quizzes they can manage. A learner list requires
        // an explicit classId, so using faculty here exercises the unfiltered repository path
        // without weakening the learner scope contract.
        mvc.perform(get("/api/v1/quizzes")
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/quizzes/my-submissions")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isOk());
    }

    @Test
    void learnerDepartmentAndCourseCollectionsStayInsideTheirCollege() throws Exception {
        seedBase();
        seedDepartment(99941, COLLEGE_A, "Learner Visible Department");
        seedDepartment(99942, COLLEGE_B, "Other College Department");

        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        String departments = mvc.perform(get("/api/v1/department/fetchAll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(departments.contains("Learner Visible Department"), departments);
        assertFalse(departments.contains("Other College Department"), departments);

        mvc.perform(get("/api/v1/courses/fetchByCollege")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
