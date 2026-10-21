package com._42students.lms.service.impl;

import com._42students.lms.dto.request.BatchRequestDTO;
import com._42students.lms.dto.response.BatchResponseDTO;
import com._42students.lms.model.Batch;
import com._42students.lms.model.NewProgram;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository._ClassRepository;
import com._42students.lms.service.BatchService;
import com._42students.lms.service.FacultyTeachingAssignmentService;
import com._42students.lms.enums.StatusType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BatchServiceImpl implements BatchService {

    // BE-0070/BE-0076/BE-0095: same-name creates take turns on the parent row, so the name check sees the other one.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate uniquenessJdbc;

    private void lockRow(String table, Object id) {
        if (uniquenessJdbc == null || id == null) return;
        uniquenessJdbc.queryForList("SELECT id FROM " + table + " WHERE id = :id FOR UPDATE",
                new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("id", id));
    }

    private final BatchRepository batchRepository;
    private final NewProgramRepository newProgramRepository;
    private final FacultyTeachingAssignmentService facultyTeachingAssignmentService;
    private SemesterRepository semesterRepository;
    private SemesterCourseRepository semesterCourseRepository;
    private FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private _ClassRepository classRepository;

    /**
     * Kept for focused unit tests that construct this service directly. Spring uses the
     * readiness-aware constructor below.
     */
    public BatchServiceImpl(BatchRepository batchRepository, NewProgramRepository newProgramRepository,
                            FacultyTeachingAssignmentService facultyTeachingAssignmentService) {
        this.batchRepository = batchRepository;
        this.newProgramRepository = newProgramRepository;
        this.facultyTeachingAssignmentService = facultyTeachingAssignmentService;
    }

    @Autowired
    public BatchServiceImpl(BatchRepository batchRepository, NewProgramRepository newProgramRepository,
                            FacultyTeachingAssignmentService facultyTeachingAssignmentService,
                            SemesterRepository semesterRepository,
                            SemesterCourseRepository semesterCourseRepository,
                            FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository) {
        this(batchRepository, newProgramRepository, facultyTeachingAssignmentService);
        this.semesterRepository = semesterRepository;
        this.semesterCourseRepository = semesterCourseRepository;
        this.facultyTeachingAssignmentRepository = facultyTeachingAssignmentRepository;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BatchResponseDTO createBatch(BatchRequestDTO batchRequestDTO) {
        if (batchRequestDTO.getStartDate() != null && batchRequestDTO.getEndDate() != null
                && batchRequestDTO.getEndDate().before(batchRequestDTO.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        Batch batch = new Batch();
        batch.setBatchName(batchRequestDTO.getBatchName() != null ? batchRequestDTO.getBatchName().trim() : null);
        batch.setProgramId(batchRequestDTO.getProgramId());
        lockRow("new_program", batch.getProgramId());
        checkBatchNameUnique(batch.getProgramId(), batch.getBatchName(), null);
        batch.setStartDate(batchRequestDTO.getStartDate());
        batch.setEndDate(batchRequestDTO.getEndDate());
        // currentStudents is server-managed. Learner membership is derived from primary
        // class -> batch relationships when responses are built; clients must never author it.
        batch.setCurrentStudents(0);
        batch.setStatus(batchRequestDTO.getStatus() != null ? batchRequestDTO.getStatus() : StatusType.ACTIVE);
        batch.setCurrentSemester(1); // New batches start at semester 1
        
        // Set academic year - use provided value or auto-calculate from start date
        String academicYear = normalizeAcademicYear(batchRequestDTO.getAcademicYear());
        if (academicYear == null && batchRequestDTO.getStartDate() != null) {
            academicYear = calculateAcademicYear(batchRequestDTO.getStartDate());
        }
        batch.setAcademicYear(academicYear);
        
        batch.setCreatedAt(new Date());
        batch.setUpdatedAt(new Date());

        Batch savedBatch = batchRepository.save(batch);

        return buildResponse(savedBatch);
    }
    
    /**
     * App-level uniqueness guard (case-insensitive, scoped to program): no unique index exists on
     * batch.batch_name at the DB level, so this mirrors SemesterServiceImpl.createSemester's
     * app-level check.
     */
    private void checkBatchNameUnique(Long programId, String name, Long excludeId) {
        if (programId == null || name == null || name.isBlank()) return;
        List<Batch> matches = batchRepository.findByProgramIdAndBatchNameIgnoreCase(programId, name);
        boolean conflict = matches.stream().anyMatch(b -> excludeId == null || !b.getId().equals(excludeId));
        if (conflict) {
            throw new IllegalArgumentException("A batch named \"" + name + "\" already exists for this program");
        }
    }

    // Calculate academic year from date (e.g., Aug 2024 -> "2024-25")
    private String calculateAcademicYear(Date date) {
        if (date == null) return null;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(date);
        int year = cal.get(java.util.Calendar.YEAR);
        int month = cal.get(java.util.Calendar.MONTH); // 0-indexed
        
        // If July or later, it's year-(year+1)
        // If before July, it's (year-1)-year
        if (month >= 6) { // July onwards
            return year + "-" + String.valueOf(year + 1).substring(2);
        } else {
            return (year - 1) + "-" + String.valueOf(year).substring(2);
        }
    }

    @Override
    public BatchResponseDTO getBatchDetails(Long id) {
        Batch batch = batchRepository.findById(id).orElse(null);
        if (batch != null) {
            return buildResponse(batch);
        }
        return null;
    }

    @Override
    public List<BatchResponseDTO> findAll() {
        return buildResponses(batchRepository.findAll());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BatchResponseDTO promoteBatch(Long batchId, Integer targetSemester, String newAcademicYear) {
        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new IllegalArgumentException("Batch not found with id: " + batchId));

        Map<String, Object> check = validatePromotion(batch, targetSemester);
        if (!Boolean.TRUE.equals(check.get("valid"))) {
            throw new IllegalArgumentException(String.valueOf(check.get("message")));
        }

        Integer currentSem = (Integer) check.get("currentSemester");
        Integer newSemester = (Integer) check.get("targetSemester");
        String normalizedAcademicYear = normalizeAcademicYear(newAcademicYear);
        String effectiveAcademicYear = normalizedAcademicYear != null
                ? normalizedAcademicYear
                : suggestedAcademicYear(batch.getAcademicYear(), currentSem, newSemester);

        // This side effect shares the transaction with the compare-and-set below. If another
        // request wins the semester race, the transaction rolls this deactivation back.
        facultyTeachingAssignmentService.deactivateAssignmentsForBatchSemester(batchId.intValue(), currentSem);

        Date now = new Date();
        int updated = batchRepository.updateCurrentSemesterIfMatch(batchId, currentSem, newSemester, now);
        if (updated == 0) {
            throw new IllegalStateException("Batch was modified by another request. Please refresh and try again.");
        }
        // The compare-and-set above is a bulk JPQL update: it bypasses the persistence context, so the Batch loaded at
        // the top (and returned again by findById below) still held the OLD semester. The response said "promoted to
        // semester <old>", and on an even->odd promotion the academic-year save below flushed that stale entity and wrote
        // the old semester back - silently undoing the promotion after its teaching assignments were deactivated.
        batch.setCurrentSemester(newSemester);
        batch.setUpdatedAt(now);

        Batch saved = batchRepository.findById(batchId).orElseThrow();
        if (effectiveAcademicYear != null
                && !java.util.Objects.equals(saved.getAcademicYear(), effectiveAcademicYear)) {
            saved.setAcademicYear(effectiveAcademicYear);
            saved.setUpdatedAt(now);
            saved = batchRepository.save(saved);
        }
        return buildResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BatchResponseDTO updateCurrentSemester(Long batchId, Integer semesterNumber) {
        if (semesterNumber == null || semesterNumber < 1) {
            throw new IllegalArgumentException("Semester number must be at least 1.");
        }
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Batch not found with id: " + batchId));
        Integer currentSem = batch.getCurrentSemester() != null ? batch.getCurrentSemester() : 1;
        if (semesterNumber.equals(currentSem)) {
            return buildResponse(batch);
        }

        // The old correction endpoint attempted to undo promotions by bulk-reactivating every
        // assignment in the earlier semester. That can revive assignments an admin had
        // intentionally disabled and has no durable promotion history to distinguish them.
        // Until a history-backed reversal workflow exists, never mutate semester state through
        // this bypass. Forward movement belongs exclusively to promoteBatch().
        throw new IllegalArgumentException(
                "Direct semester correction is disabled because it cannot safely restore teaching assignments. "
                        + "Use Batch Promotion for forward movement.");
    }

    @Override
    public Map<String, Object> previewPromotion(Long batchId, Integer targetSemester) {
        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new IllegalArgumentException("Batch not found with id: " + batchId));

        Map<String, Object> result = validatePromotion(batch, targetSemester);
        BatchResponseDTO view = buildResponse(batch);
        result.put("studentCount", view.getCurrentStudents());
        result.put("classCount", view.getClassCount());
        return result;
    }

    private Map<String, Object> validatePromotion(Batch batch, Integer requestedTargetSemester) {
        Map<String, Object> result = new HashMap<>();
        Integer currentSem = batch.getCurrentSemester() != null ? batch.getCurrentSemester() : 1;
        Integer newSemester = requestedTargetSemester != null ? requestedTargetSemester : currentSem + 1;
        boolean valid = true;
        String message = null;
        Integer maxSemesters = null;

        if (batch.getStatus() != null && batch.getStatus() != StatusType.ACTIVE) {
            valid = false;
            message = "Cannot promote batch: batch is not ACTIVE. Only active batches can be promoted.";
        } else if (requestedTargetSemester != null && requestedTargetSemester != currentSem + 1) {
            valid = false;
            message = "Batch Promotion advances exactly one semester at a time. Current semester is "
                    + currentSem + "; the next valid semester is " + (currentSem + 1) + ".";
        }

        if (batch.getProgramId() != null) {
            Optional<NewProgram> programOpt = newProgramRepository.findById(batch.getProgramId().intValue());
            if (programOpt.isPresent()) {
                maxSemesters = Math.max(programOpt.get().getDurationYears() * 2, 1);
                if (valid && newSemester > maxSemesters) {
                    valid = false;
                    message = "Cannot promote to semester " + newSemester + ": program duration is "
                            + programOpt.get().getDurationYears() + " year(s) (max semester " + maxSemesters + ").";
                }
            } else if (valid) {
                valid = false;
                message = "Cannot promote batch: program not found (id " + batch.getProgramId() + ").";
            }
        } else if (valid) {
            maxSemesters = 1;
            if (newSemester > maxSemesters) {
                valid = false;
                message = "Cannot promote: batch has no program assigned. Max semester is 1.";
            }
        }

        int mappedCourseCount = 0;
        int activeFacultyAssignmentCount = 0;
        Integer assignmentsToDeactivateCount = null;
        Boolean curriculumReady = null;
        Boolean staffingReady = null;

        String currentAcademicYear = batch.getAcademicYear();
        boolean academicYearReady = currentAcademicYear == null || currentAcademicYear.trim().isEmpty()
                || isCanonicalAcademicYear(currentAcademicYear);
        String nextAcademicYear = academicYearReady
                ? suggestedAcademicYear(currentAcademicYear, currentSem, newSemester)
                : null;
        if (valid && !academicYearReady) {
            valid = false;
            message = "Cannot promote: the batch academic year is invalid. Fix it on the Batches page first.";
        }

        // Spring production wiring always provides these repositories. The null guards preserve
        // focused unit tests that construct the legacy three-argument service directly.
        if (valid && semesterRepository != null && semesterCourseRepository != null && batch.getProgramId() != null) {
            Optional<com._42students.lms.model.Semester> semesterOpt =
                    semesterRepository.findFirstByProgramIdAndSemesterNumber(
                            batch.getProgramId().intValue(), newSemester);
            if (semesterOpt.isEmpty()
                    || Boolean.TRUE.equals(semesterOpt.get().getIsDeleted())
                    || Boolean.FALSE.equals(semesterOpt.get().getIsActive())) {
                valid = false;
                curriculumReady = false;
                message = "Cannot promote: Semester " + newSemester
                        + " is not configured as an active semester for this program.";
            } else {
                mappedCourseCount = semesterCourseRepository
                        .findBySemesterIdOrderByCourseOrder(semesterOpt.get().getId()).size();
                curriculumReady = mappedCourseCount > 0;
                if (!curriculumReady) {
                    valid = false;
                    message = "Cannot promote: Semester " + newSemester
                            + " has no mapped courses. Configure the semester curriculum first.";
                }
            }
        }

        if (facultyTeachingAssignmentRepository != null) {
            assignmentsToDeactivateCount = facultyTeachingAssignmentRepository
                    .findByBatchIdAndSemesterNumberAndIsActive(batch.getId().intValue(), currentSem, true)
                    .size();
            activeFacultyAssignmentCount = facultyTeachingAssignmentRepository
                    .findByBatchIdAndSemesterNumberAndIsActive(batch.getId().intValue(), newSemester, true)
                    .size();
            staffingReady = activeFacultyAssignmentCount > 0;
        }

        result.put("valid", valid);
        result.put("message", message);
        result.put("currentSemester", currentSem);
        result.put("targetSemester", newSemester);
        result.put("maxSemesters", maxSemesters);
        result.put("mappedCourseCount", mappedCourseCount);
        result.put("activeFacultyAssignmentCount", activeFacultyAssignmentCount);
        result.put("assignmentsToDeactivateCount", assignmentsToDeactivateCount);
        result.put("curriculumReady", curriculumReady);
        result.put("staffingReady", staffingReady);
        result.put("currentAcademicYear", currentAcademicYear);
        result.put("suggestedAcademicYear", nextAcademicYear);
        result.put("academicYearReady", academicYearReady);
        return result;
    }

    private int getMaxSemestersForBatch(Batch batch) {
        if (batch.getProgramId() == null) return 1;
        Optional<NewProgram> programOpt = newProgramRepository.findById(batch.getProgramId().intValue());
        if (!programOpt.isPresent()) return 1;
        int max = programOpt.get().getDurationYears() * 2;
        return max < 1 ? 1 : max;
    }
    
    @Override
    public List<BatchResponseDTO> findByProgramId(Long programId) {
        return buildResponses(batchRepository.findByProgramId(programId));
    }

    @Override
    public List<BatchResponseDTO> findByCollegeId(int collegeId) {
        return buildResponses(batchRepository.findByCollegeId(collegeId));
    }

    @Override
    public List<BatchResponseDTO> findByOrganizationId(int orgId) {
        return buildResponses(batchRepository.findByOrganizationId(orgId));
    }

    @Override
    public BatchResponseDTO updateBatch(Long batchId, BatchRequestDTO batchRequestDTO) {
        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new RuntimeException("Batch not found with id: " + batchId));

        if (batchRequestDTO.getStartDate() != null && batchRequestDTO.getEndDate() != null
                && batchRequestDTO.getEndDate().before(batchRequestDTO.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        if (batchRequestDTO.getProgramId() != null
                && batch.getProgramId() != null
                && !batch.getProgramId().equals(batchRequestDTO.getProgramId())) {
            throw new IllegalArgumentException(
                    "A batch cannot be moved to another program after creation. Create a controlled transfer instead.");
        }

        if (batchRequestDTO.getBatchName() != null) {
            batch.setBatchName(batchRequestDTO.getBatchName().trim());
        }
        checkBatchNameUnique(batch.getProgramId(), batch.getBatchName(), batch.getId());

        // These are optional lifecycle metadata. A full admin update sends both values, so null
        // deliberately clears a date instead of silently preserving a value the admin removed.
        batch.setStartDate(batchRequestDTO.getStartDate());
        batch.setEndDate(batchRequestDTO.getEndDate());
        batch.setAcademicYear(normalizeAcademicYear(batchRequestDTO.getAcademicYear()));

        if (batchRequestDTO.getStatus() != null) {
            batch.setStatus(batchRequestDTO.getStatus());
        }
        // Ignore client-supplied currentStudents. It is derived from learner.class_id -> class.batch_id.
        
        batch.setUpdatedAt(new Date());
        
        Batch saved = batchRepository.save(batch);
        return buildResponse(saved);
    }

    @Override
    public void deleteBatch(Long batchId) {
        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new RuntimeException("Batch not found with id: " + batchId));
        if (classRepository != null) {
            if (classRepository.findByBatchId(batchId.intValue()).size() > 0) {
                throw new IllegalStateException("Cannot delete batch: it has classes. Delete/move the classes first.");
            }
        }
        batchRepository.delete(batch);
    }

    private String normalizeAcademicYear(String academicYear) {
        if (academicYear == null) return null;
        String normalized = academicYear.trim();
        if (normalized.isEmpty()) return null;
        if (!isCanonicalAcademicYear(normalized)) {
            throw new IllegalArgumentException(
                    "Academic year must use consecutive YYYY-YY years, e.g. 2026-27");
        }
        return normalized;
    }

    private boolean isCanonicalAcademicYear(String academicYear) {
        if (academicYear == null) return false;
        String value = academicYear.trim();
        if (!value.matches("\\d{4}-\\d{2}")) return false;
        int firstYear = Integer.parseInt(value.substring(0, 4));
        int secondYear = Integer.parseInt(value.substring(5, 7));
        return secondYear == ((firstYear + 1) % 100);
    }

    private String suggestedAcademicYear(String currentAcademicYear, Integer currentSemester, Integer newSemester) {
        if (currentAcademicYear == null || currentAcademicYear.trim().isEmpty()) return null;
        String current = currentAcademicYear.trim();
        if (!isCanonicalAcademicYear(current)) return null;
        if (currentSemester != null && newSemester != null
                && newSemester == currentSemester + 1
                && currentSemester % 2 == 0) {
            int nextStartYear = Integer.parseInt(current.substring(0, 4)) + 1;
            return nextStartYear + "-" + String.format("%02d", (nextStartYear + 1) % 100);
        }
        return current;
    }

    private BatchResponseDTO buildResponse(Batch batch) {
        if (batch == null) return null;
        BatchResponseDTO dto = new BatchResponseDTO(batch, getProgramName(batch.getProgramId()));
        applyUsageCounts(java.util.List.of(dto));
        return dto;
    }

    private List<BatchResponseDTO> buildResponses(List<Batch> batches) {
        if (batches == null || batches.isEmpty()) return java.util.Collections.emptyList();
        List<BatchResponseDTO> responses = batches.stream()
                .map(batch -> new BatchResponseDTO(batch, getProgramName(batch.getProgramId())))
                .collect(Collectors.toList());
        applyUsageCounts(responses);
        return responses;
    }

    private void applyUsageCounts(List<BatchResponseDTO> responses) {
        if (responses == null || responses.isEmpty()) return;
        List<Long> ids = responses.stream().map(BatchResponseDTO::getId)
                .filter(java.util.Objects::nonNull).collect(Collectors.toList());
        if (ids.isEmpty()) return;

        Map<Long, int[]> usage = new HashMap<>();
        for (Object[] row : batchRepository.findUsageCounts(ids)) {
            if (row == null || row.length < 3 || row[0] == null) continue;
            long batchId = ((Number) row[0]).longValue();
            int classCount = row[1] instanceof Number ? ((Number) row[1]).intValue() : 0;
            int studentCount = row[2] instanceof Number ? ((Number) row[2]).intValue() : 0;
            usage.put(batchId, new int[] { classCount, studentCount });
        }

        for (BatchResponseDTO dto : responses) {
            int[] counts = usage.get(dto.getId());
            dto.setClassCount(counts != null ? counts[0] : 0);
            dto.setCurrentStudents(counts != null ? counts[1] : 0);
        }
    }

    private String getProgramName(Long programId) {
        if (programId == null) return null;
        try {
            Optional<NewProgram> program = newProgramRepository.findById(programId.intValue());
            return program.map(NewProgram::getName).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

