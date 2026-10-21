package com._42students.lms.service.impl;

import com._42students.lms.dto.request.SemesterDTO;
import com._42students.lms.dto.response.SemesterResponseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model.Semester;
import com._42students.lms.model.SemesterCourse;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.SemesterCourseRepository;
import com._42students.lms.repository.SemesterRepository;
import com._42students.lms.service.SemesterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final SemesterCourseRepository semesterCourseRepository;
    private final NewProgramRepository newProgramRepository;
    private final CourseRepository courseRepository;

    @Autowired
    public SemesterServiceImpl(SemesterRepository semesterRepository,
                                SemesterCourseRepository semesterCourseRepository,
                                NewProgramRepository newProgramRepository,
                                CourseRepository courseRepository) {
        this.semesterRepository = semesterRepository;
        this.semesterCourseRepository = semesterCourseRepository;
        this.newProgramRepository = newProgramRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public SemesterResponseDTO createSemester(SemesterDTO dto) {
        // Check if semester already exists for this program
        if (semesterRepository.existsByProgramIdAndSemesterNumber(dto.getProgramId(), dto.getSemesterNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Semester " + dto.getSemesterNumber() + " already exists for this program");
        }

        Semester semester = new Semester();
        semester.setProgramId(dto.getProgramId());
        semester.setSemesterNumber(dto.getSemesterNumber());
        String name = dto.getName() != null ? dto.getName().trim() : "";
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semester name is required");
        }
        semester.setName(name);
        semester.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        semester.setTotalCredits(dto.getTotalCredits());

        Semester saved = semesterRepository.save(semester);
        return buildResponseDTO(saved);
    }

    @Override
    @Transactional
    public SemesterResponseDTO updateSemester(Integer id, SemesterDTO dto) {
        Semester semester = semesterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Semester not found with id: " + id));

        if (dto.getName() != null) {
            String name = dto.getName().trim();
            if (name.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semester name is required");
            }
            semester.setName(name);
        }
        if (dto.getIsActive() != null) semester.setIsActive(dto.getIsActive());
        if (dto.getTotalCredits() != null) semester.setTotalCredits(dto.getTotalCredits());

        Semester saved = semesterRepository.save(semester);
        return buildResponseDTO(saved);
    }

    @Override
    @Transactional
    public void deleteSemester(Integer id) {
        // Brutal safety: do not delete a semester that still has course mappings.
        List<SemesterCourse> mappings = semesterCourseRepository.findBySemesterId(id);
        if (mappings != null && !mappings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete semester: it has semester-course mappings. Remove courses first.");
        }
        semesterRepository.deleteById(id);
    }

    @Override
    public SemesterResponseDTO getSemesterById(Integer id) {
        Semester semester = semesterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Semester not found with id: " + id));
        return buildResponseDTO(semester);
    }

    @Override
    public List<SemesterResponseDTO> getSemestersByProgram(Integer programId) {
        List<Semester> semesters = semesterRepository.findByProgramIdOrderBySemesterNumber(programId);
        return buildResponseDTOs(semesters);
    }

    @Override
    public List<SemesterResponseDTO> getAllSemesters() {
        return buildResponseDTOs(semesterRepository.findAll());
    }

    @Override
    public List<SemesterResponseDTO> getAllSemestersScoped(Integer orgId, Integer collegeId) {
        List<Semester> semesters;
        if (collegeId != null) {
            semesters = semesterRepository.findByCollegeScope(collegeId);
        } else if (orgId != null) {
            semesters = semesterRepository.findByOrgScope(orgId);
        } else {
            semesters = semesterRepository.findAll();
        }
        return buildResponseDTOs(semesters);
    }

    /**
     * Batches the course lookups for a list of semesters (avoids one findById-per-mapping N+1
     * query that buildResponseDTO(Semester) would otherwise do for each semester individually).
     */
    private List<SemesterResponseDTO> buildResponseDTOs(List<Semester> semesters) {
        if (semesters == null || semesters.isEmpty()) {
            return new ArrayList<>();
        }
        List<Integer> semesterIds = semesters.stream().map(Semester::getId).collect(Collectors.toList());
        List<SemesterCourse> allMappings = semesterCourseRepository.findBySemesterIdInOrderByCourseOrder(semesterIds);
        Map<Integer, List<SemesterCourse>> mappingsBySemester = allMappings.stream()
            .collect(Collectors.groupingBy(SemesterCourse::getSemesterId));
        List<Integer> courseIds = allMappings.stream().map(SemesterCourse::getCourseId).distinct().collect(Collectors.toList());
        Map<Integer, Course> courseById = new HashMap<>();
        if (!courseIds.isEmpty()) {
            for (Course course : courseRepository.findAllById(courseIds)) {
                courseById.put(course.getId(), course);
            }
        }
        return semesters.stream()
            .map(s -> buildResponseDTO(s, mappingsBySemester.getOrDefault(s.getId(), new ArrayList<>()), courseById))
            .collect(Collectors.toList());
    }

    @Override
    public SemesterResponseDTO getSemesterByProgramAndNumber(Integer programId, Integer semesterNumber) {
        Semester semester = semesterRepository.findFirstByProgramIdAndSemesterNumber(programId, semesterNumber)
            .orElseThrow(() -> new RuntimeException("Semester " + semesterNumber + 
                " not found for program: " + programId));
        return buildResponseDTO(semester);
    }

    private SemesterResponseDTO buildResponseDTO(Semester semester) {
        List<SemesterCourse> semesterCourses = semesterCourseRepository.findBySemesterIdOrderByCourseOrder(semester.getId());
        Map<Integer, Course> courseById = new HashMap<>();
        for (SemesterCourse sc : semesterCourses) {
            try {
                courseRepository.findById(sc.getCourseId()).ifPresent(c -> courseById.put(c.getId(), c));
            } catch (Exception e) {
                // Log error but continue processing other courses
                System.err.println("Error fetching course " + sc.getCourseId() + ": " + e.getMessage());
            }
        }
        return buildResponseDTO(semester, semesterCourses, courseById);
    }

    /**
     * Builds the response DTO using pre-fetched mappings/courses so callers that render many
     * semesters at once (getSemestersByProgram, getAllSemestersScoped) can batch the course
     * lookups instead of doing one findById per course mapping per semester.
     */
    private SemesterResponseDTO buildResponseDTO(Semester semester, List<SemesterCourse> semesterCourses, Map<Integer, Course> courseById) {
        SemesterResponseDTO dto = new SemesterResponseDTO(semester);

        // Get program name
        try {
            Optional<NewProgram> program = newProgramRepository.findById(semester.getProgramId());
            program.ifPresent(p -> dto.setProgramName(p.getName()));
        } catch (Exception e) {
            // Ignore - program name is optional
        }

        // Get courses for this semester
        List<SemesterResponseDTO.CourseInfoDTO> courseInfos = new ArrayList<>();

        for (SemesterCourse sc : semesterCourses) {
            Course course = courseById.get(sc.getCourseId());
            if (course != null) {
                SemesterResponseDTO.CourseInfoDTO courseInfo = new SemesterResponseDTO.CourseInfoDTO();
                courseInfo.setId(course.getId());
                courseInfo.setMappingId(sc.getId());  // SemesterCourse mapping ID for update/delete
                courseInfo.setCourseId(sc.getCourseId());
                courseInfo.setCourseSlug(course.getSlug());
                courseInfo.setCourseName(course.getCourseName());
                courseInfo.setCredits(sc.getCredits());
                courseInfo.setIsMandatory(sc.getIsMandatory());
                courseInfo.setCourseOrder(sc.getCourseOrder());

                // Get course code: prefer metaData.courseCode, fallback to shortTitle
                // Blank counts as unset -- see the same reasoning in StudentCourseServiceImpl.
                String courseCode = null;
                String metaCode = course.getMetaData() != null ? course.getMetaData().getCourseCode() : null;
                if (metaCode != null && !metaCode.trim().isEmpty()) {
                    courseCode = metaCode;
                } else if (course.getShortTitle() != null) {
                    courseCode = course.getShortTitle();
                }
                courseInfo.setCourseCode(courseCode);

                courseInfos.add(courseInfo);
            }
        }
        dto.setCourses(courseInfos);

        return dto;
    }

    @Override
    public org.springframework.data.domain.Page<com._42students.lms.dto.response.SemesterResponseDTO> getSemestersByCollegePaged(Integer collegeId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Semester> page = semesterRepository.findByCollegeScopePaged(collegeId, pageable);
        // buildResponseDTOs batches the course lookups, so mapping the page's content keeps the
        // same N+1 avoidance the unpaged path has.
        return new org.springframework.data.domain.PageImpl<>(
                buildResponseDTOs(page.getContent()), pageable, page.getTotalElements());
    }
}

