package com._42students.lms.service.impl;

import com._42students.lms.dto.request.FacultyTeachingAssignmentDTO;
import com._42students.lms.dto.response.FacultyTeachingAssignmentResponseDTO;
import com._42students.lms.model.*;
import com._42students.lms.repository.*;
import com._42students.lms.service.FacultyTeachingAssignmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FacultyTeachingAssignmentServiceImpl implements FacultyTeachingAssignmentService {
    private final FacultyTeachingAssignmentRepository assignmentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final _ClassRepository classRepository;
    private final BatchRepository batchRepository;

    @Autowired
    public FacultyTeachingAssignmentServiceImpl(FacultyTeachingAssignmentRepository assignmentRepository,
                                                 FacultyRepository facultyRepository,
                                                 CourseRepository courseRepository,
                                                 _ClassRepository classRepository,
                                                 BatchRepository batchRepository) {
        this.assignmentRepository = assignmentRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
        this.classRepository = classRepository;
        this.batchRepository = batchRepository;
    }

    @Override
    public FacultyTeachingAssignmentResponseDTO getAssignmentById(Integer id) {
        FacultyTeachingAssignment assignment = assignmentRepository.findById(id).orElse(null);
        return assignment == null ? null : buildResponseDTO(assignment);
    }

    @Override
    @Transactional
    public FacultyTeachingAssignmentResponseDTO createAssignment(FacultyTeachingAssignmentDTO dto) {
        if (dto.getFacultyId() == null) throw new RuntimeException("Faculty ID is required");
        if (dto.getCourseId() == null) throw new RuntimeException("Course ID is required");
        if (dto.getClassId() == null) throw new RuntimeException("Class ID is required");
        if (dto.getSemesterNumber() == null) throw new RuntimeException("Semester number is required");

        FacultyTeachingAssignment assignment = new FacultyTeachingAssignment();
        assignment.setFacultyId(dto.getFacultyId());
        assignment.setCourseId(dto.getCourseId());
        assignment.setClassId(dto.getClassId());
        assignment.setBatchId(dto.getBatchId());
        assignment.setSemesterNumber(dto.getSemesterNumber());
        assignment.setAcademicYear(dto.getAcademicYear());
        assignment.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        if (dto.getRole() != null) {
            try {
                assignment.setRole(FacultyTeachingAssignment.TeachingRole.valueOf(dto.getRole()));
            } catch (IllegalArgumentException e) {
                assignment.setRole(FacultyTeachingAssignment.TeachingRole.PRIMARY);
            }
        }
        if (dto.getStartDate() != null) assignment.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) assignment.setEndDate(dto.getEndDate());
        if (assignment.getBatchId() == null) {
            classRepository.findById(dto.getClassId()).ifPresent(clazz -> assignment.setBatchId(clazz.getBatchId()));
        }
        // Metadata storage failures now propagate, allowing the transaction to roll back.
        return buildResponseDTOSafe(assignmentRepository.save(assignment));
    }

    private FacultyTeachingAssignmentResponseDTO buildResponseDTOSafe(FacultyTeachingAssignment assignment) {
        return buildResponseDTO(assignment);
    }

    @Override
    @Transactional
    public List<FacultyTeachingAssignmentResponseDTO> createBulkAssignments(FacultyTeachingAssignmentDTO dto) {
        List<FacultyTeachingAssignmentResponseDTO> results = new ArrayList<>();
        if (dto.getCourseIds() == null || dto.getCourseIds().isEmpty()) return results;
        for (Integer courseId : dto.getCourseIds()) {
            FacultyTeachingAssignmentDTO singleDto = new FacultyTeachingAssignmentDTO();
            singleDto.setFacultyId(dto.getFacultyId());
            singleDto.setCourseId(courseId);
            singleDto.setClassId(dto.getClassId());
            singleDto.setBatchId(dto.getBatchId());
            singleDto.setSemesterNumber(dto.getSemesterNumber());
            singleDto.setAcademicYear(dto.getAcademicYear());
            singleDto.setRole(dto.getRole());
            singleDto.setIsActive(dto.getIsActive());
            singleDto.setStartDate(dto.getStartDate());
            singleDto.setEndDate(dto.getEndDate());
            results.add(createAssignment(singleDto));
        }
        return results;
    }

    @Override
    @Transactional
    public FacultyTeachingAssignmentResponseDTO updateAssignment(Integer id, FacultyTeachingAssignmentDTO dto) {
        FacultyTeachingAssignment assignment = assignmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
        if (dto.getFacultyId() != null) assignment.setFacultyId(dto.getFacultyId());
        if (dto.getCourseId() != null) assignment.setCourseId(dto.getCourseId());
        if (dto.getClassId() != null) assignment.setClassId(dto.getClassId());
        if (dto.getBatchId() != null) assignment.setBatchId(dto.getBatchId());
        if (dto.getSemesterNumber() != null) assignment.setSemesterNumber(dto.getSemesterNumber());
        if (dto.getAcademicYear() != null) assignment.setAcademicYear(dto.getAcademicYear());
        if (dto.getRole() != null)
            assignment.setRole(FacultyTeachingAssignment.TeachingRole.valueOf(dto.getRole()));
        if (dto.getIsActive() != null) assignment.setIsActive(dto.getIsActive());
        if (dto.getStartDate() != null) assignment.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) assignment.setEndDate(dto.getEndDate());
        return buildResponseDTO(assignmentRepository.save(assignment));
    }

    @Override
    @Transactional
    public void deleteAssignment(Integer id) {
        assignmentRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deactivateAssignment(Integer id) {
        FacultyTeachingAssignment assignment = assignmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
        assignment.setIsActive(false);
        assignmentRepository.save(assignment);
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByFaculty(Integer facultyId) {
        return buildResponseDTOs(assignmentRepository.findByFacultyId(facultyId));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getActiveAssignmentsByFaculty(Integer facultyId) {
        return buildResponseDTOs(assignmentRepository.findByFacultyIdAndIsActive(facultyId, true));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByClass(Integer classId) {
        return buildResponseDTOs(assignmentRepository.findByClassIdAndIsActive(classId, true));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByClassAndSemester(Integer classId, Integer semesterNumber) {
        return buildResponseDTOs(assignmentRepository.findByClassIdAndSemesterNumberAndIsActive(classId, semesterNumber, true));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAssignmentsByBatch(Integer batchId) {
        return buildResponseDTOs(assignmentRepository.findByBatchIdAndIsActive(batchId, true));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAllActiveAssignments() {
        return buildResponseDTOs(assignmentRepository.findByIsActive(true));
    }

    @Override
    public List<FacultyTeachingAssignmentResponseDTO> getAllAssignments() {
        return buildResponseDTOs(assignmentRepository.findAll());
    }


    @Override
    public Page<FacultyTeachingAssignmentResponseDTO> getAdminAssignmentsPage(
            Integer collegeId, Integer classId, Pageable pageable) {
        Page<FacultyTeachingAssignment> page =
                assignmentRepository.findAdminPageByCollege(collegeId, classId, pageable);
        return new PageImpl<>(buildResponseDTOs(page.getContent()), pageable, page.getTotalElements());
    }

    @Override
    @Transactional
    public void deactivateAssignmentsForBatchSemester(Integer batchId, Integer semesterNumber) {
        assignmentRepository.deactivateByBatchAndSemester(batchId, semesterNumber);
    }

    @Override
    @Transactional
    public void reactivateAssignmentsForBatchSemester(Integer batchId, Integer semesterNumber) {
        assignmentRepository.reactivateByBatchAndSemester(batchId, semesterNumber);
    }

    private FacultyTeachingAssignmentResponseDTO buildResponseDTO(FacultyTeachingAssignment assignment) {
        FacultyTeachingAssignmentResponseDTO dto = new FacultyTeachingAssignmentResponseDTO(assignment);
        if (assignment.getFacultyId() != null) {
            Optional<Faculty> faculty = facultyRepository.findById(assignment.getFacultyId());
            faculty.ifPresent(f -> dto.setFacultyName(f.getFirstName() + " " + f.getLastName()));
            if (faculty.isEmpty()) flagIncomplete(dto, "faculty", assignment.getFacultyId());
        } else flagIncomplete(dto, "faculty", null);
        if (assignment.getCourseId() != null) {
            Optional<Course> course = courseRepository.findById(assignment.getCourseId());
            course.ifPresent(c -> fillCourse(dto, c));
            if (course.isEmpty()) flagIncomplete(dto, "course", assignment.getCourseId());
        } else flagIncomplete(dto, "course", null);
        if (assignment.getClassId() != null) {
            Optional<_Class> clazz = classRepository.findById(assignment.getClassId());
            clazz.ifPresent(c -> dto.setClassName(c.getName()));
            if (clazz.isEmpty()) flagIncomplete(dto, "class", assignment.getClassId());
        }
        if (assignment.getBatchId() != null) {
            Optional<Batch> batch = batchRepository.findById(assignment.getBatchId().longValue());
            batch.ifPresent(b -> dto.setBatchName(b.getBatchName()));
            if (batch.isEmpty()) flagIncomplete(dto, "batch", assignment.getBatchId());
        }
        return dto;
    }

    private void fillCourse(FacultyTeachingAssignmentResponseDTO dto, Course course) {
        dto.setCourseName(course.getCourseName());
        dto.setCourseSlug(course.getSlug());
        if (course.getMetaData() != null && course.getMetaData().getImageUrl() != null)
            dto.setCourseImageUrl(course.getMetaData().getImageUrl());
    }

    private void flagIncomplete(FacultyTeachingAssignmentResponseDTO dto, String kind, Integer identifier) {
        dto.setMetadataIncomplete(true);
        log.warn("Teaching assignment {} references missing {} {}", dto.getId(), kind, identifier);
    }

    // Four metadata lookups are batched; a failed DB lookup must never produce a false 200
    // containing half-empty rows. Orphaned references remain visible and explicitly marked.
    private List<FacultyTeachingAssignmentResponseDTO> buildResponseDTOs(List<FacultyTeachingAssignment> assignments) {
        if (assignments == null || assignments.isEmpty()) return new ArrayList<>();
        List<Integer> facultyIds = assignments.stream().map(FacultyTeachingAssignment::getFacultyId)
            .filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());
        List<Integer> courseIds = assignments.stream().map(FacultyTeachingAssignment::getCourseId)
            .filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());
        List<Integer> classIds = assignments.stream().map(FacultyTeachingAssignment::getClassId)
            .filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());
        List<Long> batchIds = assignments.stream().map(FacultyTeachingAssignment::getBatchId)
            .filter(java.util.Objects::nonNull).map(Integer::longValue).distinct().collect(Collectors.toList());

        Map<Integer, Faculty> facultyById = new HashMap<>();
        for (Faculty f : facultyRepository.findAllById(facultyIds)) facultyById.put(f.getId(), f);
        Map<Integer, Course> courseById = new HashMap<>();
        for (Course c : courseRepository.findAllById(courseIds)) courseById.put(c.getId(), c);
        Map<Integer, _Class> classById = new HashMap<>();
        for (_Class c : classRepository.findAllById(classIds)) classById.put(c.getId(), c);
        Map<Long, Batch> batchById = new HashMap<>();
        for (Batch b : batchRepository.findAllById(batchIds)) batchById.put(b.getId(), b);

        List<FacultyTeachingAssignmentResponseDTO> result = new ArrayList<>();
        for (FacultyTeachingAssignment assignment : assignments) {
            FacultyTeachingAssignmentResponseDTO dto = new FacultyTeachingAssignmentResponseDTO(assignment);
            Faculty faculty = facultyById.get(assignment.getFacultyId());
            if (faculty != null) dto.setFacultyName(faculty.getFirstName() + " " + faculty.getLastName());
            else flagIncomplete(dto, "faculty", assignment.getFacultyId());
            Course course = courseById.get(assignment.getCourseId());
            if (course != null) fillCourse(dto, course);
            else flagIncomplete(dto, "course", assignment.getCourseId());
            if (assignment.getClassId() != null) {
                _Class clazz = classById.get(assignment.getClassId());
                if (clazz != null) dto.setClassName(clazz.getName());
                else flagIncomplete(dto, "class", assignment.getClassId());
            }
            if (assignment.getBatchId() != null) {
                Batch batch = batchById.get(assignment.getBatchId().longValue());
                if (batch != null) dto.setBatchName(batch.getBatchName());
                else flagIncomplete(dto, "batch", assignment.getBatchId());
            }
            result.add(dto);
        }
        return result;
    }
}
