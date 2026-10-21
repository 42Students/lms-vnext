package com._42students.lms.configuration;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Source contracts for S2 fixes whose paths need a database or mail provider to run end to end. */
class NightS2FixesSourceTest {

    private static String source(String rel) throws Exception {
        return Files.readString(Path.of("src/main/java/com/_42students/lms", rel));
    }

    @Test
    void be0152_fixAndResendComparesJobIdsByValue() throws Exception {
        String s = source("controller/RecruiterCollegeController.java");
        assertFalse(s.contains("j.getId() == jobId"));
        assertTrue(s.contains("java.util.Objects.equals(j.getId(), jobId)"));
    }

    @Test
    void be0105_importOwnerMustBeAFacultyOfThisCollege() throws Exception {
        String s = source("service/tpo/TpoRecruiterLeadsHubService.java");
        int commit = s.indexOf("public Map<String, Object> importCommit");
        assertTrue(commit > 0);
        assertTrue(s.indexOf("SELECT COUNT(*) FROM faculty WHERE id = :f AND college_id = :c", commit) > commit);
    }

    @Test
    void be0158_aRecruiterCannotClearTheirLastSignInIdentity() throws Exception {
        String s = source("controller/RecruiterSelfController.java");
        // Since 12 Oct 2026 the work email cannot be changed or cleared at all: it is the code-proven sign-in identity (N1).
        assertTrue(s.contains("\"EMAIL_LOCKED\""));
        assertTrue(s.contains("\"INVALID_MOBILE\""));
    }

    @Test
    void be0191_emailedShareCodesAreThrottledPerLink() throws Exception {
        String s = source("service/tpo/TpoShareService.java");
        assertTrue(s.contains("return \"TOO_SOON\";"));
        assertTrue(s.contains("return \"LIMIT\";"));
        assertTrue(s.contains("FROM tpo_share_link WHERE id = :id FOR UPDATE"));
    }

    @Test
    void be0040_markingAbsentTakesTurnsPerStudent() throws Exception {
        String s = source("service/tpo/TpoScheduleService.java");
        int lock = s.indexOf("SELECT id FROM job_application WHERE id = :a FOR UPDATE");
        assertTrue(lock > 0 && lock < s.indexOf("boolean newlyAbsent"));
    }

    @Test
    void be0044_requestsAreCreatedAndDecidedOneAtATime() throws Exception {
        String s = source("service/tpo/TpoRequestService.java");
        assertTrue(s.contains("SELECT id FROM learner WHERE id = :l FOR UPDATE"));
        assertTrue(s.contains("SELECT status FROM student_request WHERE id = :id FOR UPDATE"));
    }

    @Test
    void be0156_aNewRoundTakesTheNextNumberUnderTheDriveLock() throws Exception {
        String s = source("service/tpo/TpoDriveExtrasService.java");
        assertTrue(s.contains("SELECT id FROM job WHERE id = :j FOR UPDATE"));
        assertTrue(s.contains("SELECT COALESCE(MAX(seq), 0) FROM job_round WHERE job_id = :j"));
        assertFalse(s.contains("findByJobIdOrderBySeqAsc(jobId).size() + 1"));
    }

    @Test
    void be0075_aSectionMaximumCantGoBelowItsStudents() throws Exception {
        String s = source("service/impl/ClassServiceImpl.java");
        assertTrue(s.contains("so its maximum can't be"));
    }

    @Test
    void be0070_0076_0095_sameNameCreatesTakeTurnsOnTheParent() throws Exception {
        assertTrue(source("service/impl/ClassServiceImpl.java").contains("lockRow(\"batch\", aClass.getBatchId())"));
        assertTrue(source("service/impl/BatchServiceImpl.java").contains("lockRow(\"new_program\", batch.getProgramId())"));
        assertTrue(source("service/impl/LectureHallServiceImpl.java").contains("lockRow(\"college\", lectureHall.getCollegeId())"));
    }

    @Test
    void be0157_theGeneralThreadIsCreatedOnce() throws Exception {
        String s = source("service/tpo/TpoMessagesService.java");
        assertTrue(s.indexOf("SELECT id FROM recruiter WHERE id = :h FOR UPDATE") < s.indexOf("INSERT INTO tpo_message_thread"));
    }

    @Test
    void be0051_moveAndDoneTakeTurnsAndDoneStaysDone() throws Exception {
        String s = source("service/tpo/TpoRecruiterLeadService.java");
        assertTrue(s.contains("SELECT done_at FROM follow_up WHERE id = :id FOR UPDATE"));
        assertTrue(s.contains("if (!lockFollowUpIsOpen(followUpId)) throw new IllegalStateException(\"A finished follow-up cannot be moved\");"));
    }

    @Test
    void be0032_be0039_be0045_decisionsReadTheLatestStateUnderALock() throws Exception {
        String results = source("service/tpo/TpoResultsService.java");
        assertTrue(results.contains("jobApplicationRepository.findByIdForUpdate(applicationId);"));
        assertTrue(results.contains("roundResultRepository.supersedeOthers(roundId, applicationId, result.getId());"));
        String schedule = source("service/tpo/TpoScheduleService.java");
        assertTrue(schedule.contains("FROM reschedule_request WHERE id = :id FOR UPDATE"));
        assertTrue(schedule.contains("AND status = 'PENDING' FOR UPDATE"));
        String verification = source("service/tpo/ProfileVerificationService.java");
        assertTrue(verification.contains("FROM profile_verification WHERE learner_id = :l AND section = :s FOR UPDATE"));
    }

    /** Under REPEATABLE READ a plain read after a lock can use an older snapshot; the deciding reads are current reads. */
    @Test
    void tonightsLockFixesUseCurrentReads() throws Exception {
        assertTrue(source("service/tpo/TpoRequestService.java").contains("AND (job_id <=> :j) FOR UPDATE"));
        assertTrue(source("service/tpo/TpoDriveExtrasService.java").contains("FROM job_round WHERE job_id = :j FOR UPDATE"));
        assertTrue(source("service/tpo/TpoMessagesService.java").contains("\"(job_id <=> :j) FOR UPDATE\""));
        assertTrue(source("service/tpo/TpoShareService.java").contains("action = 'CODE_EMAILED' FOR UPDATE"));
        assertTrue(source("service/tpo/TpoScheduleService.java").contains("FROM round_attendance WHERE round_id = :r AND application_id = :a FOR UPDATE"));
        String schedule = source("service/tpo/TpoScheduleService.java");
        assertTrue(schedule.lastIndexOf("Isolation.READ_COMMITTED", schedule.indexOf("public int commitAssignment(")) > schedule.indexOf("public int commitAssignment(") - 200);
    }

    @Test
    void be0103_aRecruiterContactIsAddedOncePerCollege() throws Exception {
        String s = source("service/tpo/TpoRecruiterLeadService.java");
        assertTrue(s.contains("SELECT id FROM college WHERE id = :c FOR UPDATE"));
        assertTrue(s.indexOf("if (contactTaken(collegeId, emailOrPhone))") < s.indexOf("RecruiterLead recruiterLead = new RecruiterLead();"));
        assertTrue(source("service/tpo/TpoRecruiterLeadsHubService.java").contains("if (recruiterLeadService.contactTaken(collegeId, (String) f.get(\"contact\"))) { skipped++; continue; }"));
    }

    @Test
    void be0160_movingContentToAnotherLessonMovesIt() throws Exception {
        String s = source("service/impl/LessonContentsServiceImpl.java");
        assertTrue(s.contains("lessonContents.setLessonId(targetLesson);"));
        assertTrue(s.contains("so it can only move to another lesson of the same course."));
    }

    @Test
    void be0083_be0087_aProgramCantBeShortenedBelowItsSetUpSemesters() throws Exception {
        String s = source("service/impl/NewProgramServiceImpl.java");
        assertTrue(s.contains("SELECT MAX(semester_number) FROM semester WHERE program_id = :p AND semester_number > :max"));
    }

    @Test
    void be0048_be0056_offerActionsAndDriveEditsAreAudited() throws Exception {
        String offers = source("controller/tpo/TpoOfferController.java");
        for (String a : new String[]{"OFFER_SELECTION_RECORDED", "OFFER_LETTER_ATTACHED", "OFFER_VERIFIED_RELEASED", "OFFER_EXTERNAL_ACCEPTANCE_RECORDED",
                "OFFER_WITHDRAWN_BY_COMPANY", "OFFER_JOINING_STATUS_SET", "OFFER_ACCEPTANCE_REVERSED"}) {
            assertTrue(offers.contains("\"" + a + "\""), a);
        }
        assertTrue(source("controller/tpo/TpoDriveController.java").contains("audit.logAtMostEvery(10, p.getCollegeId(), \"TPO\", p.getId(), \"DRIVE_EDITED\""));
    }

    @Test
    void be0002_theAttendancePickerOffersOnlyOpenableCourses() throws Exception {
        assertTrue(source("controller/LearnerController.java").contains("!accessControlService.canAccessCourse(principal, ((Number) id).intValue())"));
    }
}
