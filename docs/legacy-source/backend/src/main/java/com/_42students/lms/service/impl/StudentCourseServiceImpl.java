package com._42students.lms.service.impl;

import com._42students.lms.dto.response.SemesterSummaryDTO;
import com._42students.lms.dto.response.StudentCoursesResponseDTO;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.model.electives.ElectiveOffering;
import com._42students.lms.model.electives.ElectiveSlot;
import com._42students.lms.repository.electives.ElectiveOfferingRepository;
import com._42students.lms.repository.electives.ElectiveSlotRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.service.StudentCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentCourseServiceImpl implements StudentCourseService {
    private final LearnerRepository learnerRepository;
    private final _ClassRepository classRepository;
    private final BatchRepository batchRepository;
    private final NewProgramRepository programRepository;
    private final SemesterRepository semesterRepository;
    private final SemesterCourseRepository semesterCourseRepository;
    private final CourseRepository courseRepository;
    private final FacultyTeachingAssignmentRepository assignmentRepository;
    private final FacultyRepository facultyRepository;

    // Electives are appended to the section list when these are wired (optional so the existing
    // constructor-built unit tests stay valid and behave exactly as before).
    @Autowired(required = false)
    private ElectiveOfferingRepository electiveOfferingRepository;
    @Autowired(required = false)
    private ElectiveSlotRepository electiveSlotRepository;
    @Autowired(required = false)
    private LmsGroupMemberRepository groupMemberRepository;

    @Autowired
    public StudentCourseServiceImpl(LearnerRepository learnerRepository,
                                     _ClassRepository classRepository,
                                     BatchRepository batchRepository,
                                     NewProgramRepository programRepository,
                                     SemesterRepository semesterRepository,
                                     SemesterCourseRepository semesterCourseRepository,
                                     CourseRepository courseRepository,
                                     FacultyTeachingAssignmentRepository assignmentRepository,
                                     FacultyRepository facultyRepository) {
        this.learnerRepository = learnerRepository;
        this.classRepository = classRepository;
        this.batchRepository = batchRepository;
        this.programRepository = programRepository;
        this.semesterRepository = semesterRepository;
        this.semesterCourseRepository = semesterCourseRepository;
        this.courseRepository = courseRepository;
        this.assignmentRepository = assignmentRepository;
        this.facultyRepository = facultyRepository;
    }

    @Override
    public StudentCoursesResponseDTO getStudentCourses(Integer studentId, Integer semesterId) {
        Learner learner = learnerRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        StudentCoursesResponseDTO response = new StudentCoursesResponseDTO();
        response.setStudentId(studentId);
        String firstName = learner.getFirstName() != null ? learner.getFirstName() : "";
        String lastName = learner.getLastName() != null ? learner.getLastName() : "";
        response.setStudentName((firstName + " " + lastName).trim());
        if (learner.getClassId() == null) {
            response.setCourses(new ArrayList<>());
            response.setConfigurationStatus("NO_CLASS");
            return response;
        }
        return buildCoursesResponse(learner.getClassId(), response, semesterId, studentId);
    }

    @Override
    public StudentCoursesResponseDTO getCoursesByClass(Integer classId) {
        return buildCoursesResponse(classId, new StudentCoursesResponseDTO(), null, null);
    }

    @Override
    public List<SemesterSummaryDTO> getStudentSemesters(Integer studentId) {
        Learner learner = learnerRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
        if (learner.getClassId() == null) return new ArrayList<>();
        Optional<_Class> studentClass = classRepository.findById(learner.getClassId());
        if (studentClass.isEmpty() || Boolean.TRUE.equals(studentClass.get().getIsDeleted())
                || studentClass.get().getBatchId() == null) return new ArrayList<>();
        Optional<Batch> batch = batchRepository.findById(studentClass.get().getBatchId().longValue());
        if (batch.isEmpty() || batch.get().getProgramId() == null) return new ArrayList<>();
        // Never offer semesters of a deleted or missing program just because legacy
        // semester rows still reference its numeric ID.
        Integer programId = batch.get().getProgramId().intValue();
        if (programRepository.findById(programId)
                .filter(program -> !Boolean.TRUE.equals(program.getIsDeleted())).isEmpty()) {
            return new ArrayList<>();
        }
        // Only deleted semesters are excluded. Historical/inactive visibility is an academic decision.
        List<Semester> semesters = semesterRepository.findByProgramIdOrderBySemesterNumber(programId);
        List<SemesterSummaryDTO> result = new ArrayList<>();
        for (Semester semester : semesters) {
            if (Boolean.TRUE.equals(semester.getIsDeleted())) continue;
            result.add(new SemesterSummaryDTO(semester.getId(), semester.getSemesterNumber(),
                semester.getName(), semester.getIsActive()));
        }
        return result;
    }

    private StudentCoursesResponseDTO buildCoursesResponse(Integer classId,
                                                             StudentCoursesResponseDTO response,
                                                             Integer semesterId,
                                                             Integer learnerId) {
        response.setClassId(classId);
        response.setCourses(new ArrayList<>());
        Optional<_Class> classOpt = classRepository.findById(classId);
        if (classOpt.isEmpty() || Boolean.TRUE.equals(classOpt.get().getIsDeleted())) {
            response.setConfigurationStatus("CLASS_NOT_FOUND");
            return response;
        }
        _Class studentClass = classOpt.get();
        response.setClassName(studentClass.getName());
        if (studentClass.getBatchId() == null) {
            response.setConfigurationStatus("NO_BATCH");
            return response;
        }
        Optional<Batch> batchOpt = batchRepository.findById(studentClass.getBatchId().longValue());
        if (batchOpt.isEmpty()) {
            response.setConfigurationStatus("BATCH_NOT_FOUND");
            return response;
        }
        Batch batch = batchOpt.get();
        response.setBatchId(batch.getId().intValue());
        response.setBatchName(batch.getBatchName());
        response.setAcademicYear(batch.getAcademicYear());
        if (batch.getProgramId() == null) {
            response.setConfigurationStatus("NO_PROGRAM");
            return response;
        }
        Integer programId = batch.getProgramId().intValue();
        response.setProgramId(programId);
        Optional<NewProgram> programOpt = programRepository.findById(programId)
            .filter(program -> !Boolean.TRUE.equals(program.getIsDeleted()));
        if (programOpt.isEmpty()) {
            // A surviving semester row does not make an orphaned/deleted program valid.
            // Returning its courses would produce clickable cards without authoritative scope.
            response.setConfigurationStatus("PROGRAM_NOT_FOUND");
            return response;
        }
        response.setProgramName(programOpt.get().getName());

        Integer currentSemester = batch.getCurrentSemester() != null ? batch.getCurrentSemester() : 1;
        Optional<Semester> semesterOpt;
        if (semesterId != null) {
            Optional<Semester> requested = semesterRepository.findById(semesterId)
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()) && programId.equals(s.getProgramId()));
            semesterOpt = requested.isPresent() ? requested
                : semesterRepository.findFirstByProgramIdAndSemesterNumber(programId, currentSemester);
        } else {
            semesterOpt = semesterRepository.findFirstByProgramIdAndSemesterNumber(programId, currentSemester);
        }
        semesterOpt = semesterOpt.filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()));
        if (semesterOpt.isEmpty()) {
            response.setConfigurationStatus("NO_SEMESTER");
            return response;
        }
        Semester semester = semesterOpt.get();
        response.setSemesterId(semester.getId());
        response.setCurrentSemester(semester.getSemesterNumber());
        response.setSemesterName(semester.getName());
        response.setConfigurationStatus("READY");

        List<SemesterCourse> mappings = semesterCourseRepository.findBySemesterIdOrderByCourseOrder(semester.getId());
        if (mappings.isEmpty()) return response;
        Set<Integer> courseIds = mappings.stream().map(SemesterCourse::getCourseId)
            .filter(id -> id != null).collect(Collectors.toSet());
        Map<Integer, Course> coursesById = new HashMap<>();
        courseRepository.findAllById(courseIds).forEach(course -> {
            if (!Boolean.TRUE.equals(course.getIsDeleted())) coursesById.put(course.getId(), course);
        });

        Map<Integer, List<FacultyTeachingAssignment>> assignmentsByCourse = new HashMap<>();
        Set<Integer> facultyIds = new HashSet<>();
        // Prod data has never settled on one academic_year string format: batch has both "2026-27"
        // and "2026-2027" for what is the same academic year, and faculty_teaching_assignment adds
        // a bare "2026" on top of that. A raw String.equals() here silently dropped EVERY
        // assignment for any class/batch whose format didn't happen to match byte-for-byte --
        // confirmed against real data (class 9 / batch "2026-2027" vs. its own assignments'
        // "2026-27": 18 correctly-scoped rows, zero of them ever matched). Comparing just the
        // leading 4-digit start year tolerates all three formats actually in use while still
        // correctly telling 2025-26 apart from 2026-27.
        String batchYearStart = normalizeAcademicYearStart(batch.getAcademicYear());
        for (FacultyTeachingAssignment assignment : assignmentRepository.findByClassIdAndIsActive(classId, true)) {
            if (assignment.getCourseId() == null || !courseIds.contains(assignment.getCourseId())
                    || !semester.getSemesterNumber().equals(assignment.getSemesterNumber())) continue;
            String assignmentYearStart = normalizeAcademicYearStart(assignment.getAcademicYear());
            if (batchYearStart != null && assignmentYearStart != null
                    && !batchYearStart.equals(assignmentYearStart)) continue;
            assignmentsByCourse.computeIfAbsent(assignment.getCourseId(), id -> new ArrayList<>()).add(assignment);
            if (assignment.getFacultyId() != null) facultyIds.add(assignment.getFacultyId());
        }
        Map<Integer, Faculty> facultiesById = new HashMap<>();
        facultyRepository.findAllById(facultyIds).forEach(faculty -> facultiesById.put(faculty.getId(), faculty));
        Comparator<FacultyTeachingAssignment> instructorOrder = Comparator
            .comparingInt((FacultyTeachingAssignment a) -> a.getRole() == null
                ? Integer.MAX_VALUE : a.getRole().ordinal())
            .thenComparingInt(FacultyTeachingAssignment::getId);

        List<StudentCoursesResponseDTO.CourseWithFacultyDTO> cards = new ArrayList<>();
        for (SemesterCourse mapping : mappings) {
            Course course = coursesById.get(mapping.getCourseId());
            if (course == null || Integer.valueOf(0).equals(course.getAllowedForDisplay())) continue;
            StudentCoursesResponseDTO.CourseWithFacultyDTO card = new StudentCoursesResponseDTO.CourseWithFacultyDTO();
            card.setId(course.getId());
            card.setClassId(classId);
            card.setSlug(course.getSlug() == null || course.getSlug().isBlank() ? null : course.getSlug());
            card.setCourseName(course.getCourseName());
            card.setCredits(mapping.getCredits());
            card.setIsMandatory(mapping.getIsMandatory());
            String code = course.getShortTitle();
            if (course.getMetaData() != null) {
                String metadataCode = course.getMetaData().getCourseCode();
                if (metadataCode != null && !metadataCode.trim().isEmpty()) code = metadataCode;
                card.setImageUrl(course.getMetaData().getImageUrl());
                // /byClass consumers still receive detail fields, /byStudent redacts them.
                card.setHtmlContent(course.getMetaData().getHtmlContent());
                card.setIntroductionContent(course.getMetaData().getIntroduction_content());
            }
            card.setCourseCode(code);

            Map<Integer, StudentCoursesResponseDTO.FacultyInfoDTO> uniqueInstructors = new LinkedHashMap<>();
            assignmentsByCourse.getOrDefault(course.getId(), List.of()).stream()
                .filter(a -> a.getFacultyId() != null && facultiesById.containsKey(a.getFacultyId()))
                .sorted(instructorOrder)
                .forEach(assignment -> {
                    Faculty faculty = facultiesById.get(assignment.getFacultyId());
                    StudentCoursesResponseDTO.FacultyInfoDTO instructor = new StudentCoursesResponseDTO.FacultyInfoDTO();
                    instructor.setId(faculty.getId());
                    String firstName = faculty.getFirstName() == null ? "" : faculty.getFirstName();
                    String lastName = faculty.getLastName() == null ? "" : faculty.getLastName();
                    instructor.setName((firstName + " " + lastName).trim());
                    instructor.setRole(assignment.getRole() == null ? "PRIMARY" : assignment.getRole().name());
                    uniqueInstructors.putIfAbsent(faculty.getId(), instructor);
                });
            if (!uniqueInstructors.isEmpty()) {
                List<StudentCoursesResponseDTO.FacultyInfoDTO> instructors = new ArrayList<>(uniqueInstructors.values());
                card.setInstructors(instructors);
                StudentCoursesResponseDTO.FacultyInfoDTO primary = instructors.get(0);
                Faculty mainFaculty = facultiesById.get(primary.getId());
                primary.setEmail(mainFaculty.getContactMail());
                card.setFaculty(primary);
            }
            cards.add(card);
        }
        if (learnerId != null) appendElectiveCards(learnerId, semester.getSemesterNumber(), batch.getAcademicYear(), cards);
        response.setCourses(cards);
        return response;
    }

    /**
     * Electives the learner is enrolled in for this semester, appended after the section courses.
     * Each card is keyed on the offering's group-backed class, so opening it works like any other
     * course. A learner with no electives gets exactly the list they got before.
     */
    private void appendElectiveCards(Integer learnerId, Integer semesterNumber, String academicYear,
                                     List<StudentCoursesResponseDTO.CourseWithFacultyDTO> cards) {
        if (electiveOfferingRepository == null || electiveSlotRepository == null || groupMemberRepository == null) return;
        List<Long> groupIds = groupMemberRepository.findActiveGroupIds("LEARNER", learnerId);
        if (groupIds.isEmpty()) return;
        List<ElectiveOffering> offerings = electiveOfferingRepository.findByGroupIdInAndStatusAndIsDeletedFalse(groupIds, ElectiveOffering.STATUS_ACTIVE);
        if (offerings.isEmpty()) return;
        Map<Long, ElectiveSlot> slots = new HashMap<>();
        electiveSlotRepository.findAllById(offerings.stream().map(ElectiveOffering::getSlotId).collect(Collectors.toSet()))
                .forEach(s -> {
                    if (!Boolean.TRUE.equals(s.getIsDeleted()) && ElectiveSlot.STATUS_ACTIVE.equals(s.getStatus())) slots.put(s.getId(), s);
                });
        Set<Integer> alreadyListed = cards.stream().map(StudentCoursesResponseDTO.CourseWithFacultyDTO::getId).collect(Collectors.toSet());
        // Same academic_year format inconsistency as the section-course path above
        // (normalizeAcademicYearStart's own comment has the confirmed-against-real-data details).
        String batchYearStart = normalizeAcademicYearStart(academicYear);
        for (ElectiveOffering offering : offerings) {
            ElectiveSlot slot = slots.get(offering.getSlotId());
            if (slot == null || !Objects.equals(slot.getSemesterNumber(), semesterNumber)) continue;
            String slotYearStart = normalizeAcademicYearStart(slot.getAcademicYear());
            if (batchYearStart != null && slotYearStart != null && !batchYearStart.equals(slotYearStart)) continue;
            if (alreadyListed.contains(offering.getCourseId())) continue;
            Course course = courseRepository.findById(offering.getCourseId())
                    .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()) && !Integer.valueOf(0).equals(c.getAllowedForDisplay()))
                    .orElse(null);
            if (course == null) continue;
            StudentCoursesResponseDTO.CourseWithFacultyDTO card = new StudentCoursesResponseDTO.CourseWithFacultyDTO();
            card.setId(course.getId());
            card.setClassId(offering.getBackedClassId());
            card.setSlug(course.getSlug() == null || course.getSlug().isBlank() ? null : course.getSlug());
            card.setCourseName(course.getCourseName());
            card.setCredits(slot.getCredits());
            card.setIsMandatory(false);
            card.setIsElective(true);
            card.setElectiveSlotName(slot.getName());
            card.setElectiveOfferingId(offering.getId());
            String code = course.getShortTitle();
            if (course.getMetaData() != null) {
                String metadataCode = course.getMetaData().getCourseCode();
                if (metadataCode != null && !metadataCode.trim().isEmpty()) code = metadataCode;
                card.setImageUrl(course.getMetaData().getImageUrl());
                card.setHtmlContent(course.getMetaData().getHtmlContent());
                card.setIntroductionContent(course.getMetaData().getIntroduction_content());
            }
            card.setCourseCode(code);
            attachInstructors(card, assignmentRepository.findByClassIdAndIsActive(offering.getBackedClassId(), true).stream()
                    .filter(a -> Objects.equals(a.getCourseId(), offering.getCourseId())).collect(Collectors.toList()));
            cards.add(card);
            alreadyListed.add(course.getId());
        }
    }

    private void attachInstructors(StudentCoursesResponseDTO.CourseWithFacultyDTO card, List<FacultyTeachingAssignment> assignments) {
        if (assignments.isEmpty()) return;
        Map<Integer, Faculty> facultiesById = new HashMap<>();
        facultyRepository.findAllById(assignments.stream().map(FacultyTeachingAssignment::getFacultyId)
                .filter(Objects::nonNull).collect(Collectors.toSet())).forEach(f -> facultiesById.put(f.getId(), f));
        Comparator<FacultyTeachingAssignment> order = Comparator
                .comparingInt((FacultyTeachingAssignment a) -> a.getRole() == null ? Integer.MAX_VALUE : a.getRole().ordinal())
                .thenComparingInt(FacultyTeachingAssignment::getId);
        Map<Integer, StudentCoursesResponseDTO.FacultyInfoDTO> unique = new LinkedHashMap<>();
        assignments.stream().filter(a -> a.getFacultyId() != null && facultiesById.containsKey(a.getFacultyId())).sorted(order)
                .forEach(a -> {
                    Faculty faculty = facultiesById.get(a.getFacultyId());
                    StudentCoursesResponseDTO.FacultyInfoDTO instructor = new StudentCoursesResponseDTO.FacultyInfoDTO();
                    instructor.setId(faculty.getId());
                    String firstName = faculty.getFirstName() == null ? "" : faculty.getFirstName();
                    String lastName = faculty.getLastName() == null ? "" : faculty.getLastName();
                    instructor.setName((firstName + " " + lastName).trim());
                    instructor.setRole(a.getRole() == null ? "PRIMARY" : a.getRole().name());
                    unique.putIfAbsent(faculty.getId(), instructor);
                });
        if (unique.isEmpty()) return;
        List<StudentCoursesResponseDTO.FacultyInfoDTO> instructors = new ArrayList<>(unique.values());
        card.setInstructors(instructors);
        StudentCoursesResponseDTO.FacultyInfoDTO primary = instructors.get(0);
        primary.setEmail(facultiesById.get(primary.getId()).getContactMail());
        card.setFaculty(primary);
    }

    /**
     * Extracts the leading 4-digit start year from an academic-year string ("2026-27",
     * "2026-2027", or a bare "2026" all normalize to "2026"), so two records naming the same
     * academic year in different formats compare equal. Returns null for anything that doesn't
     * start with 4 digits, matching the existing "skip the filter when either side is unusable"
     * behavior at the call site rather than treating a malformed value as a hard mismatch.
     */
    // Package-private (not private) so StudentCourseServiceImplTest can exercise it directly
    // rather than only indirectly through the full getStudentCourses() dependency graph.
    static String normalizeAcademicYearStart(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.length() < 4) return null;
        String start = trimmed.substring(0, 4);
        return start.chars().allMatch(Character::isDigit) ? start : null;
    }
}
