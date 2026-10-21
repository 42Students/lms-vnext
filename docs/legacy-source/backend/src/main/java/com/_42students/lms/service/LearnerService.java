package com._42students.lms.service;

import com._42students.lms.dto.request.AttendanceDTO;
import com._42students.lms.dto.request.BulkRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.LearnerDTO;
import com._42students.lms.dto.request.ProgramDTO;
import com._42students.lms.dto.response.BulkRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.dto.response.LearnerResponseDTO;
import com._42students.lms.model.Attend;
import com._42students.lms.model.Learner;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface LearnerService {
    Learner register(LearnerDTO studentDTO);

    BulkValidateResponse bulkValidate(BulkValidateRequest request);

    BulkRegisterResponse bulkRegister(BulkRegisterRequest request);

    /**
     * Persists a single row of a bulk learner import in its own transaction.
     *
     * <p>Exists on the interface (rather than being a private helper) purely so
     * {@code bulkRegister} can call it through Spring's transactional proxy and actually get
     * {@code REQUIRES_NEW}. A bare self-invocation bypasses AOP and would silently run every row
     * in the caller's transaction — which is the bug this method exists to prevent.
     */
    Learner saveBulkLearnerRow(com._42students.lms.dto.request.BulkLearnerItem item,
                               Integer collegeId,
                               Integer programId,
                               Integer classId,
                               String normalizedMobile,
                               String normalizedEmailLower);

    /** Same as above, stamping bulkImportBatchId (B3: lets a whole import be found/undone as a unit). */
    Learner saveBulkLearnerRow(com._42students.lms.dto.request.BulkLearnerItem item,
                               Integer collegeId,
                               Integer programId,
                               Integer classId,
                               String normalizedMobile,
                               String normalizedEmailLower,
                               String bulkImportBatchId);

    Learner getLearnerDetails(String studentId);

    /** B3: one row per bulk-import batch for this college -- {batchId, count, createdAt}, newest first. */
    List<com._42students.lms.dto.response.BulkImportBatchDTO> listBulkImportBatches(Integer collegeId);

    /**
     * B3: undo -- soft-deletes every learner in this batch (scoped to collegeId, so a batch id
     * from another college can't be targeted). Returns the number of rows affected.
     */
    int undoBulkImport(String bulkImportBatchId, Integer collegeId);

    Attend attend(AttendanceDTO attendanceDTO);

    /**
     * Same as attend(dto), with bypassCorrectionWindow=true skipping the retroactive-marking
     * window check -- for admin-initiated corrections (AdminAttendanceController), where fixing
     * attendance after the normal window has closed is the entire point of the tool.
     */
    Attend attend(AttendanceDTO attendanceDTO, boolean bypassCorrectionWindow);

    /**
     * Remove (soft-delete) an absence record so the student is considered present for that schedule.
     * Idempotent: if record already soft-deleted or missing, returns without error.
     */
    void removeAbsence(String studentId, int classScheduleId);

    List<LearnerResponseDTO> getStudentDetailsByClassId(int classId);
 
    ProgramDTO getProgramDetails(String learnerId);

    List<Learner> findAll(); 

    int getTotalStudentsInClass(int classId); 

    List<Learner> fetchContactsByCollegeId(int collegeId);

    Page<Learner> fetchContactsByCollegeId(int collegeId, int page, int size);

    Page<Learner> fetchContactsByCollegeIdPaged(int collegeId, Pageable pageable);


    Page<Learner> fetchAdminRosterPage(int collegeId, String search, Integer programId,
                                       Integer batchId, Integer classId, String status, Pageable pageable);

    Page<Learner> fetchContactsByOrganizationIdPaged(int orgId, Pageable pageable);

    List<Learner> fetchContactsByOrganizationId(int orgId);

    Learner getLearnerDetailsForAlternateLogin(String rollNumber, String collegeId);
    
    List<LearnerResponseDTO> getLearnersByProgram(int programId);

    Learner getLearnerByCollegeAndRoll(Integer collegeId, String rollNumber);

    String getContactNumberByLearnerId(String learnerId);

    double getAttendancePercentage(String studentId);

    /**
     * 2.5: per-course attendance percentage, additive to {@link #getAttendancePercentage(String)}
     * (which stays class-wide across every course). Same -1 "not available" sentinel and the
     * same held-sessions-only denominator, scoped to one course.
     */
    double getAttendancePercentageByCourse(String studentId, int courseId);

    // CRUD operations
    Optional<Learner> findById(Integer id);
    Learner updateLearner(Integer id, LearnerDTO learnerDTO);

    /**
     * Moves an existing learner between SECTION classes inside the same batch/program.
     * This deliberately changes only academic placement and preserves every profile field.
     */
    Learner moveLearnerToClass(Integer id, Integer targetClassId);

    void deleteLearner(Integer id);
}

