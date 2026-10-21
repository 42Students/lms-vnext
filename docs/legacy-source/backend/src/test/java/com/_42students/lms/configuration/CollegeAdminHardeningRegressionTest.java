package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Source-level guardrails for the college-admin hardening pass. These deliberately supplement,
 * rather than replace, controller/service behaviour tests: their job is to stop a future refactor
 * from silently deleting a security invariant that spans multiple old controllers.
 */
class CollegeAdminHardeningRegressionTest {

    private static String source(String relative) throws Exception {
        return Files.readString(Path.of("src/main/java/com/_42students/lms/" + relative));
    }

    @Test
    void facultyMutationsKeepRoleTenantAndMappingGuards() throws Exception {
        String controller = source("controller/FacultyController.java");
        String service = source("service/impl/FacultyServiceImpl.java");

        assertTrue(controller.contains("Only a super-admin may grant the college ADMIN role"));
        assertTrue(controller.contains("requireValidCourseMappingScope(principal, courseMappingDTO)"));
        assertTrue(controller.contains("requirePerformAdminActionForCollege(principal, facultyCollegeId)"));
        assertTrue(controller.contains("requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId)"));
        assertTrue(service.contains("Changing a faculty member's college is not supported by this endpoint"));
        assertTrue(service.contains("Changing faculty admin role is not supported by the generic profile update endpoint"));
        assertTrue(service.contains("Multiple faculty/class mappings exist for this course"));
        assertTrue(service.contains("Use PUT /api/v1/faculty/update/"));
        assertTrue(service.contains("Course is not part of the selected class program curriculum"));
        assertTrue(service.contains("semesterCourseRepository.existsByProgramIdAndCourseId(classProgramId, courseId)"));
    }

    @Test
    void learnerRegistrationAndTransferStayInsideAuthoritativeHierarchy() throws Exception {
        String controller = source("controller/LearnerController.java");
        String service = source("service/impl/LearnerServiceImpl.java");
        String scope = source("access/ScopeResolutionService.java");

        assertTrue(scope.contains("resolveClassToProgramId"));
        assertTrue(controller.contains("Learner class must belong to the selected program"));
        assertTrue(controller.contains("requirePerformAdminActionForCollege(principal, resolvedCollegeId)"));
        assertTrue(service.contains("Changing a learner's college is not supported by this endpoint"));
        assertTrue(service.contains("Learner class must belong to the selected program"));
    }

    @Test
    void programStructureAndLectureHallCannotEscapeCollegeScope() throws Exception {
        String programStructure = source("controller/ProgramStructureController.java");
        String programService = source("service/impl/ProgramStructureServiceImpl.java");
        String hallController = source("controller/LectureHallController.java");
        String hallService = source("service/impl/LectureHallServiceImpl.java");

        assertTrue(programStructure.contains("requirePerformAdminActionForCollege(principal(), collegeIdFor(existing))"));
        assertTrue(programStructure.contains("accessControlService.canAccessProgram(principal, structure.getProgramId())"));
        assertTrue(programStructure.contains("catch (NoSuchElementException e)"));
        assertTrue(programService.contains("new NoSuchElementException(\"Program structure not found"));
        assertTrue(programService.contains("Program structure does not belong to the specified program"));
        assertTrue(hallController.contains("requirePerformAdminActionForCollege(principal, collegeId)"));
        assertTrue(hallService.contains("Changing a lecture hall's college is not supported"));
        assertTrue(hallService.contains("Department must belong to the same college as the lecture hall"));
        // BE-0096: a hall still used by sessions answers 409 with the reason, not a catch-all 404.
        assertTrue(hallController.contains("catch (org.springframework.web.server.ResponseStatusException e)"));
        assertTrue(hallController.contains("HttpStatus status = e.getStatus();"));
    }

    @Test
    void semesterErrorsAndImmutableKeysDoNotFailOpenOrLieAboutStatus() throws Exception {
        String controller = source("controller/SemesterController.java");
        String service = source("service/impl/SemesterServiceImpl.java");

        assertTrue(controller.contains("Program cannot be changed after a semester is created"));
        assertTrue(controller.contains("Semester number cannot be changed after a semester is created"));
        assertTrue(controller.contains("instanceof org.springframework.security.access.AccessDeniedException"));
        assertTrue(controller.contains("instanceof org.springframework.web.server.ResponseStatusException"));
        assertTrue(service.contains("HttpStatus.CONFLICT"));
    }

    @Test
    void nestedLessonContentCannotCrossTenantOrCurriculumBoundary() throws Exception {
        String lessons = source("service/impl/LessonServiceImpl.java");
        assertTrue(lessons.contains("Lesson content class must belong to the same college as the course"));
        assertTrue(lessons.contains("resolveClassToCollegeId(contentClassId)"));
        assertTrue(lessons.contains("Lesson content course is not part of the selected class program curriculum"));
        assertTrue(lessons.contains("semesterCourseRepository.existsByProgramIdAndCourseId(classProgramId, courseId)"));
    }

    @Test
    void bothProgramCreationRoutesHaveControllerLevelAdminAuthorization() throws Exception {
        String legacy = source("controller/ProgramController.java");
        String modern = source("controller/NewProgramController.java");
        assertTrue(legacy.contains("requirePerformAdminActionForCollege(principal, collegeId)"));
        assertTrue(modern.contains("requirePerformAdminActionForCollege(principal, collegeId)"));
    }
}
