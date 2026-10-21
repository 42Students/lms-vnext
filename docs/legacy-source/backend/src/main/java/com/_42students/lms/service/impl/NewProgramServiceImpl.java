package com._42students.lms.service.impl;

import com._42students.lms.dto.request.NewProgramDTO;
import com._42students.lms.dto.response.NewProgramDetailsDTO;
import com._42students.lms.dto.response.NewProgramResponseDTO;
import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.NewProgram;
import com._42students.lms.model.NewProgramStructure;
import com._42students.lms.repository.CourseRepository;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.NewProgramRepository;
import com._42students.lms.repository.NewProgramStructureRepository;
import com._42students.lms.repository.BatchRepository;
import com._42students.lms.service.NewProgramService;
import com._42students.lms.util.TextSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class NewProgramServiceImpl implements NewProgramService {

    @Autowired
    private NewProgramRepository newProgramRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private NewProgramStructureRepository newProgramStructureRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired(required = false)
    private BatchRepository batchRepository;

    @Autowired(required = false)
    private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;

    @Autowired
    private com._42students.lms.repository.SemesterRepository semesterRepository;

    @Autowired
    private com._42students.lms.repository.LearnerRepository learnerRepository;

    @Override
    public NewProgram createProgram(NewProgramDTO programDTO) {
        requireUniqueName(null, programDTO.getDeptId(), programDTO.getName());
        NewProgram program = new NewProgram();
        program.setName(programDTO.getName() != null ? TextSanitizer.sanitizeText(programDTO.getName().trim()) : null);
        program.setDeptId(programDTO.getDeptId());
        program.setDurationYears(programDTO.getDurationYears());
        return newProgramRepository.save(program);
    }

    private void requireUniqueName(Integer excludeId, Integer deptId, String name) {
        if (deptId == null || name == null || name.trim().isEmpty()) {
            return;
        }
        List<NewProgram> existing = newProgramRepository.findByDeptIdAndExactName(deptId, name.trim());
        boolean conflict = existing.stream().anyMatch(p -> excludeId == null || p.getId() != excludeId);
        if (conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Program name already exists in this department");
        }
    }

    @Override
    public List<NewProgramResponseDTO> findAll() {
        List<NewProgram> programs = newProgramRepository.findAll();
        return mapToResponseDTOs(programs);
    }

    @Override
    public List<NewProgramResponseDTO> findByDeptId(int deptId) {
        List<NewProgram> programs = newProgramRepository.findByDeptId(deptId);
        return mapToResponseDTOs(programs);
    }

    @Override
    public List<NewProgramResponseDTO> findByCollegeId(int collegeId) {
        List<NewProgram> programs = newProgramRepository.findByCollegeId(collegeId);
        return mapToResponseDTOs(programs);
    }

    @Override
    public List<NewProgramResponseDTO> findByOrganizationId(int orgId) {
        List<NewProgram> programs = newProgramRepository.findByOrganizationId(orgId);
        return mapToResponseDTOs(programs);
    }

    @Override
    public NewProgramResponseDTO findById(int id) {
        Optional<NewProgram> programOpt = newProgramRepository.findById(id);
        if (programOpt.isPresent()) {
            return mapToResponseDTO(programOpt.get());
        }
        return null;
    }

    @Override
    public NewProgram updateProgram(int id, NewProgramDTO programDTO) {
        Optional<NewProgram> programOpt = newProgramRepository.findById(id);
        if (programOpt.isPresent()) {
            NewProgram program = programOpt.get();
            requireUniqueName(id, programDTO.getDeptId(), programDTO.getName());
            if (programDTO.getDurationYears() > 0 && programDTO.getDurationYears() < program.getDurationYears()
                    && batchRepository != null) {
                int newMaxSemesters = programDTO.getDurationYears() * 2;
                List<?> batches = batchRepository.findByProgramId((long) id);
                if (batches != null) {
                    for (Object b : batches) {
                        com._42students.lms.model.Batch batch = (com._42students.lms.model.Batch) b;
                        if (batch.getCurrentSemester() != null && batch.getCurrentSemester() > newMaxSemesters) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Cannot reduce duration: batch '" + batch.getBatchName() + "' is already at semester "
                                            + batch.getCurrentSemester() + ", which exceeds the new maximum of " + newMaxSemesters + ".");
                        }
                    }
                }
            }
            // BE-0083/BE-0087: semesters already set up beyond the new length (with their courses) would be stranded: no batch
            // could ever reach them. They are removed first, on purpose.
            if (programDTO.getDurationYears() > 0 && programDTO.getDurationYears() < program.getDurationYears() && jdbc != null) {
                int newMaxSemesters = programDTO.getDurationYears() * 2;
                Integer beyond = jdbc.queryForObject("SELECT MAX(semester_number) FROM semester WHERE program_id = :p AND semester_number > :max",
                        new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("p", id).addValue("max", newMaxSemesters), Integer.class);
                if (beyond != null) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Cannot reduce duration: semesters " + (newMaxSemesters + 1) + " to " + beyond + " are set up for this program. "
                                    + "Remove them (and their courses) first, then shorten the program.");
                }
            }
            program.setName(programDTO.getName() != null ? TextSanitizer.sanitizeText(programDTO.getName().trim()) : null);
            program.setDeptId(programDTO.getDeptId());
            program.setDurationYears(programDTO.getDurationYears());
            return newProgramRepository.save(program);
        }
        throw new RuntimeException("Program not found with id: " + id);
    }

    @Override
    public void deleteProgram(int id) {
        // Brutal safety: prevent hard-delete when referenced by program structures or batches.
        List<NewProgramStructure> structures = newProgramStructureRepository.findByProgramId(id);
        if (structures != null && !structures.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete program: it has semesters/structure. Remove semesters first.");
        }
        if (batchRepository != null) {
            try {
                List<?> batches = batchRepository.findByProgramId((long) id);
                if (batches != null && !batches.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Cannot delete program: it has batches. Remove batches first.");
                }
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception ignored) {
            }
        }
        List<com._42students.lms.model.Semester> semesters = semesterRepository.findByProgramIdOrderBySemesterNumber(id);
        if (semesters != null && !semesters.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete program: it has semesters. Remove semesters first.");
        }
        List<com._42students.lms.model.Learner> learners = learnerRepository.getLearnersByProgramId(id);
        if (learners != null && !learners.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete program: it has learners assigned. Reassign learners first.");
        }
        newProgramRepository.deleteById(id);
    }

    private List<NewProgramResponseDTO> mapToResponseDTOs(List<NewProgram> programs) {
        List<NewProgramResponseDTO> responseDTOs = new ArrayList<>();
        for (NewProgram program : programs) {
            responseDTOs.add(mapToResponseDTO(program));
        }
        return responseDTOs;
    }

    private NewProgramResponseDTO mapToResponseDTO(NewProgram program) {
        NewProgramResponseDTO dto = new NewProgramResponseDTO();
        dto.setId(program.getId());
        dto.setName(program.getName());
        dto.setDeptId(program.getDeptId());
        dto.setDurationYears(program.getDurationYears());
        
        // Get department name
        try {
            Department dept = departmentRepository.fetchDepartmentById(program.getDeptId());
            if (dept != null) {
                dto.setDeptName(dept.getName());
            }
        } catch (Exception e) {
            // Ignore if department not found
        }
        
        return dto;
    }

    @Override
    public NewProgramDetailsDTO fetchProgramDetails(int programId) {
        Optional<NewProgram> programOpt = newProgramRepository.findById(programId);
        if (!programOpt.isPresent()) {
            return null;
        }
        
        NewProgram program = programOpt.get();
        NewProgramDetailsDTO dto = new NewProgramDetailsDTO();
        dto.setId(program.getId());
        dto.setName(program.getName());
        dto.setDeptId(program.getDeptId());
        dto.setDurationYears(program.getDurationYears());
        
        // Fetch program structures (semesters)
        List<NewProgramStructure> structures = newProgramStructureRepository.findByProgramId(programId);
        List<NewProgramDetailsDTO.ProgramStructureWithCourses> structureDTOs = new ArrayList<>();
        
        for (NewProgramStructure structure : structures) {
            NewProgramDetailsDTO.ProgramStructureWithCourses structureDTO = new NewProgramDetailsDTO.ProgramStructureWithCourses();
            structureDTO.setId(structure.getId());
            structureDTO.setName(structure.getName());
            structureDTO.setStartDate(structure.getStartDate());
            structureDTO.setEndDate(structure.getEndDate());
            structureDTO.setStatus(structure.getStatus() != null ? structure.getStatus().toString() : "ACTIVE");
            structureDTO.setCourseIds(structure.getCourseIds());
            
            // Fetch courses for this structure
            List<NewProgramDetailsDTO.CourseInfo> courses = new ArrayList<>();
            if (structure.getCourseIds() != null) {
                for (Integer courseId : structure.getCourseIds()) {
                    try {
                        Course course = courseRepository.fetchCourse(courseId);
                        if (course != null) {
                            NewProgramDetailsDTO.CourseInfo courseInfo = new NewProgramDetailsDTO.CourseInfo();
                            courseInfo.setId(course.getId());
                            courseInfo.setCourseName(course.getCourseName());
                            courseInfo.setShortTitle(course.getShortTitle());
                            courseInfo.setFormalTitle(course.getShortTitle() != null ? course.getShortTitle() : course.getCourseName());
                            courseInfo.setActive(course.getActive() != null && course.getActive());
                            courseInfo.setEnabled(course.getEnabled() != null && course.getEnabled());
                            courseInfo.setMetaData(course.getMetaData());
                            
                            // Convert createdAt to list format [year, month, day] for frontend
                            if (course.getCreatedAt() != null) {
                                List<Integer> createdAtList = new ArrayList<>();
                                createdAtList.add(course.getCreatedAt().getYear());
                                createdAtList.add(course.getCreatedAt().getMonthValue());
                                createdAtList.add(course.getCreatedAt().getDayOfMonth());
                                courseInfo.setCreatedAt(createdAtList);
                            }
                            
                            courses.add(courseInfo);
                        }
                    } catch (Exception e) {
                        // Ignore if course not found
                    }
                }
            }
            structureDTO.setCourses(courses);
            structureDTOs.add(structureDTO);
        }
        
        dto.setProgramStructure(structureDTOs);
        return dto;
    }

    @Override
    public org.springframework.data.domain.Page<com._42students.lms.model.NewProgram> findByCollegeIdPaged(int collegeId, org.springframework.data.domain.Pageable pageable) {
        return newProgramRepository.findByCollegeIdPaged(collegeId, pageable);
    }
}

