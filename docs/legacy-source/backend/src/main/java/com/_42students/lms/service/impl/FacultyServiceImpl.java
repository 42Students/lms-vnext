package com._42students.lms.service.impl;

import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.profile.EducationDTO;
import com._42students.lms.dto.profile.ExperienceDTO;
import com._42students.lms.dto.profile.SkillDTO;
import com._42students.lms.dto.request.BulkFacultyItem;
import com._42students.lms.dto.request.BulkFacultyRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.FacultyDTO;
import com._42students.lms.dto.response.BulkFacultyRegisterFailedItem;
import com._42students.lms.dto.response.BulkFacultyRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.dto.response.FacultyCourseMappingDTO;
import com._42students.lms.dto.response.FacultyCourseMappingDetailsDTO;
import com._42students.lms.dto.response.FacultyCourseClassDTO;
import com._42students.lms.dto.response.FacultyCourseClassMappingDTO;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Course;
import com._42students.lms.model.Department;
import com._42students.lms.model.Faculty;
import com._42students.lms.model.FacultyCourseMapping;
import com._42students.lms.model.FacultyTeachingAssignment;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.repository.DepartmentRepository;
import com._42students.lms.repository.FacultyCourseMappingRepository;
import com._42students.lms.repository.FacultyTeachingAssignmentRepository;
import com._42students.lms.repository.FacultyRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.service.CourseService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.util.InputSanitizer;
import com._42students.lms.util.OnboardingMobileNumber;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import com._42students.lms.service.ClassService;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors; 

@Service
public class FacultyServiceImpl implements FacultyService {

    // Self-injected proxy so bulkRegister's per-row call to saveBulkFacultyRow goes through
    // Spring's transactional proxy and actually gets its own REQUIRES_NEW transaction.
    @Autowired
    @org.springframework.context.annotation.Lazy
    private FacultyService self;

    @Autowired
    FacultyRepository facultyRepository;

    @Autowired
    FacultyCourseMappingRepository facultyCourseMappingRepository;

    @Autowired
    FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired
    ProjectMemberRepository projectMemberRepository;

    @Autowired
    ProjectWorkspaceRepository projectWorkspaceRepository;

    @Autowired
    CourseService courseService;

    @Autowired
    ClassService classService;

    @Autowired
    DepartmentRepository departmentRepository;

    @Autowired
    ScopeResolutionService scopeResolutionService;

    @Autowired
    com._42students.lms.repository.SemesterCourseRepository semesterCourseRepository;

    @Autowired
    @Lazy
    FacultyService facultyService;

    @Override
    public BulkValidateResponse bulkValidate(BulkValidateRequest request) {
        BulkValidateResponse response = new BulkValidateResponse();
        if (request == null) {
            return response;
        }
        if (request.getMobiles() != null && !request.getMobiles().isEmpty()) {
            List<String> mobiles = request.getMobiles().stream()
                    .map(OnboardingMobileNumber::normalize)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (!mobiles.isEmpty()) {
                List<Faculty> byMobile = facultyRepository.findByContactMobileInAndNotDeleted(mobiles);
                response.setExistingMobiles(byMobile.stream()
                        .map(Faculty::getContactMobile)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()));
            }
        }
        if (request.getEmails() != null && !request.getEmails().isEmpty()) {
            List<String> emailsLower = request.getEmails().stream()
                    .map(s -> s == null ? "" : s.trim().toLowerCase())
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
            if (!emailsLower.isEmpty()) {
                List<Faculty> byEmail = facultyRepository.findByContactMailLowerInAndNotDeleted(emailsLower);
                response.setExistingEmails(byEmail.stream()
                        .map(Faculty::getContactMail)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()));
            }
        }
        return response;
    }

    @Override
    // No @Transactional here on purpose — identical reasoning to
    // LearnerServiceImpl#bulkRegister: this method reports per-row success/failure, which is
    // only truthful if each row commits independently. Sharing one transaction means a single
    // constraint violation marks it rollback-only, the per-row catch swallows it, and every
    // "created" row is discarded at commit after the admin was told they succeeded.
    public BulkFacultyRegisterResponse bulkRegister(BulkFacultyRegisterRequest request) {
        Integer collegeId = request.getCollegeId();
        List<BulkFacultyItem> facultyList = request.getFaculty();

        if (collegeId == null) {
            throw new RuntimeException("College is required.");
        }

        List<String> allMobiles = facultyList.stream()
                .map(item -> normalizeMobile(item.getContactMobile()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        List<String> allEmailsLower = facultyList.stream()
                .map(item -> item.getContactMail() == null || item.getContactMail().trim().isEmpty() ? null : item.getContactMail().trim().toLowerCase())
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Set<String> existingMobiles = new HashSet<>();
        Set<String> existingEmailsLower = new HashSet<>();
        if (!allMobiles.isEmpty()) {
            facultyRepository.findByContactMobileInAndNotDeleted(allMobiles).stream()
                    .map(Faculty::getContactMobile)
                    .filter(Objects::nonNull)
                    .forEach(m -> existingMobiles.add(normalizeMobile(m)));
        }
        if (!allEmailsLower.isEmpty()) {
            facultyRepository.findByContactMailLowerInAndNotDeleted(allEmailsLower).stream()
                    .map(Faculty::getContactMail)
                    .filter(Objects::nonNull)
                    .forEach(m -> existingEmailsLower.add(m.toLowerCase()));
        }

        Map<String, Long> mobileCounts = allMobiles.stream().collect(Collectors.groupingBy(m -> m, Collectors.counting()));
        Set<String> duplicateMobilesInCsv = mobileCounts.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(Collectors.toSet());
        Map<String, Long> emailCounts = allEmailsLower.stream().collect(Collectors.groupingBy(e -> e, Collectors.counting()));
        Set<String> duplicateEmailsInCsv = emailCounts.entrySet().stream().filter(e -> e.getValue() > 1).map(Map.Entry::getKey).collect(Collectors.toSet());

        BulkFacultyRegisterResponse response = new BulkFacultyRegisterResponse();
        List<Integer> createdIds = new ArrayList<>();
        List<BulkFacultyRegisterFailedItem> failed = new ArrayList<>();

        for (int i = 0; i < facultyList.size(); i++) {
            int row = i + 1;
            BulkFacultyItem item = facultyList.get(i);
            String mobile = normalizeMobile(item.getContactMobile());
            String email = item.getContactMail() != null && !item.getContactMail().trim().isEmpty() ? item.getContactMail().trim().toLowerCase() : null;

            if (mobile == null || mobile.isEmpty()) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Mobile number is required and must be valid.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            // Email is OPTIONAL for bulk faculty import — same contradiction as the learner path.
            // BulkFacultyItem marks firstName, lastName and contactMobile @NotBlank but pointedly
            // not contactMail, and the email checks below are already null-guarded. See the
            // matching comment in LearnerServiceImpl#bulkRegister.
            if (duplicateMobilesInCsv.contains(mobile)) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Duplicate mobile in file.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            if (existingMobiles.contains(mobile)) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Mobile number already exists.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            if (email != null && duplicateEmailsInCsv.contains(email)) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Duplicate email in file.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            if (email != null && existingEmailsLower.contains(email)) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Email already exists.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            // No ADMIN, HEAD or other privileged roles may be granted from an uploaded CSV.
            String requestedRole = item.getFacultyType() == null ? "" : item.getFacultyType().trim();
            if (!requestedRole.isEmpty() && !"LECTURER".equalsIgnoreCase(requestedRole)
                    && !"MENTOR".equalsIgnoreCase(requestedRole)) {
                failed.add(new BulkFacultyRegisterFailedItem(row,
                        "Bulk faculty role must be LECTURER or MENTOR.",
                        item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }
            if (item.getDeptId() == null) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Department is required.", item.getContactMobile(), item.getContactMail(), null));
                continue;
            }
            Optional<Department> deptOpt = departmentRepository.findByIdAndNotDeleted(item.getDeptId());
            if (!deptOpt.isPresent() || deptOpt.get().getCollegeId() != collegeId) {
                failed.add(new BulkFacultyRegisterFailedItem(row, "Department not found or does not belong to the selected college.", item.getContactMobile(), item.getContactMail(), item.getDeptId()));
                continue;
            }

            try {
                Faculty saved = self.saveBulkFacultyRow(item, collegeId, mobile, email);
                createdIds.add(saved.getId());
                existingMobiles.add(mobile);
                if (email != null) existingEmailsLower.add(email);
            } catch (Exception e) {
                failed.add(new BulkFacultyRegisterFailedItem(row, e.getMessage(), item.getContactMobile(), item.getContactMail(), item.getDeptId()));
            }
        }

        response.setCreated(createdIds.size());
        response.setCreatedIds(createdIds);
        response.setFailed(failed);
        return response;
    }

    @Override
    // REQUIRES_NEW (not the default REQUIRED): bulkRegister calls this once per row through
    // `self` specifically so each faculty member commits — or fails — on its own.
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public Faculty saveBulkFacultyRow(BulkFacultyItem item,
                                      Integer collegeId,
                                      String normalizedMobile,
                                      String normalizedEmailLower) {
        Faculty faculty = new Faculty();
        faculty.setFirstName(InputSanitizer.sanitize(item.getFirstName()));
        faculty.setLastName(InputSanitizer.sanitize(item.getLastName()));
        faculty.setContactMobile(normalizedMobile);
        faculty.setContactMail(normalizedEmailLower != null ? item.getContactMail().trim() : null);
        faculty.setCollegeId(collegeId);
        faculty.setDeptId(item.getDeptId());
        faculty.setUserType("FACULTY");
        String requestedRole = item.getFacultyType() == null ? "" : item.getFacultyType().trim();
        if (!requestedRole.isEmpty() && !"LECTURER".equalsIgnoreCase(requestedRole)
                && !"MENTOR".equalsIgnoreCase(requestedRole)) {
            throw new IllegalArgumentException("Bulk faculty role must be LECTURER or MENTOR.");
        }
        faculty.setFacultyType("MENTOR".equalsIgnoreCase(requestedRole)
                ? FacultyType.MENTOR : FacultyType.LECTURER);
        return facultyRepository.save(faculty);
    }

    private static String normalizeMobile(String raw) {
        return OnboardingMobileNumber.normalize(raw);
    }

    @Override
    public Faculty register(FacultyDTO instructorDTO) {
        if (instructorDTO == null) {
            throw new IllegalArgumentException("Faculty details are required");
        }
        if (instructorDTO.getFacultyId() != null && instructorDTO.getFacultyId() != 0) {
            Faculty existing = getFacultyDetails(String.valueOf(instructorDTO.getFacultyId()));
            if (existing != null) {
                throw new IllegalArgumentException("A faculty member with this facultyId already exists. Use PUT /api/v1/faculty/update/"
                        + existing.getId() + " to edit an existing faculty member.");
            }
        }
        // Check for duplicate email
        if (instructorDTO.getContactMail() != null && !instructorDTO.getContactMail().trim().isEmpty()) {
            facultyRepository.findByContactMailIgnoreCase(instructorDTO.getContactMail().trim())
                    .ifPresent(existingFaculty -> {
                        throw new RuntimeException("Email already exists. A faculty account with this email address already exists.");
                    });
        }

        // Check for duplicate mobile number.
        // Normalize to digits-only first (same as bulkRegister) so differently-formatted
        // duplicates of the same number ("9876543210" vs "+91 9876543210") are both caught,
        // instead of only matching on an exact string.
        String normalizedMobile = normalizeMobile(instructorDTO.getContactMobile());
        if (normalizedMobile == null) throw new IllegalArgumentException("A valid 10-digit Indian mobile number is required.");
        instructorDTO.setContactMobile(normalizedMobile);
        if (normalizedMobile != null) {
            Integer selfFacultyId = instructorDTO.getFacultyId();
            facultyRepository.findByContactMobileInAndNotDeleted(java.util.List.of(normalizedMobile)).stream()
                    .filter(f -> normalizedMobile.equals(normalizeMobile(f.getContactMobile())))
                    .filter(f -> selfFacultyId == null || selfFacultyId.intValue() != f.getId())
                    .findFirst()
                    .ifPresent(existingFaculty -> {
                        throw new RuntimeException("Mobile number already exists. A faculty account with this mobile number already exists.");
                    });
        }

        // Check for duplicate phone number (if different from mobile)
        if (instructorDTO.getContactPhone() != null && !instructorDTO.getContactPhone().trim().isEmpty() 
                && !instructorDTO.getContactPhone().trim().equals(instructorDTO.getContactMobile())) {
            facultyRepository.findByContactPhone(instructorDTO.getContactPhone().trim())
                    .ifPresent(existingFaculty -> {
                        throw new RuntimeException("Phone number already exists. A faculty account with this phone number already exists.");
                    });
        }

        // Create new faculty
        Faculty faculty = new Faculty();
        setFacultyDetails(instructorDTO, faculty);
        facultyRepository.save(faculty);
        return faculty;
    }

    private static void setFacultyDetails(FacultyDTO instructorDTO, Faculty faculty) {
        if (instructorDTO.getFirstName() != null) {
            faculty.setFirstName(InputSanitizer.sanitize(instructorDTO.getFirstName()));
        }
        if (instructorDTO.getLastName() != null) {
            faculty.setLastName(InputSanitizer.sanitize(instructorDTO.getLastName()));
        }
        if (instructorDTO.getDeptId() != null) {
            faculty.setDeptId(instructorDTO.getDeptId());
        }
        if (instructorDTO.getCollegeId() != null) {
            faculty.setCollegeId(instructorDTO.getCollegeId());
        }
        if (instructorDTO.getUniqueId() != null) {
            faculty.setUniqueId(instructorDTO.getUniqueId().trim());
        }
        if (instructorDTO.getContactPhone() != null) {
            faculty.setContactPhone(instructorDTO.getContactPhone().trim());
        }
        if (instructorDTO.getContactMail() != null) {
            faculty.setContactMail(instructorDTO.getContactMail().trim());
        }
        if (instructorDTO.getContactMobile() != null) {
            faculty.setContactMobile(instructorDTO.getContactMobile().trim());
        }
        faculty.setUserType("FACULTY");
        if (instructorDTO.getFacultyType() != null) {
            faculty.setFacultyType(instructorDTO.getFacultyType());
        }
        if (instructorDTO.getAddress() != null) {
            faculty.setAddress(InputSanitizer.sanitizePreserveNewlines(instructorDTO.getAddress().trim()));
        }
        if (instructorDTO.getDob() != null) {
            faculty.setDob(instructorDTO.getDob().trim());
        }
        if (instructorDTO.getDepartment() != null) {
            faculty.setDepartment(InputSanitizer.sanitize(instructorDTO.getDepartment()));
        }
        if (instructorDTO.getDescription() != null) {
            faculty.setDescription(InputSanitizer.sanitizePreserveNewlines(instructorDTO.getDescription().trim()));
        }
        
        // Convert old Experience to ExperienceDTO
        if (instructorDTO.getExperiences() != null) {
            List<ExperienceDTO> experienceDTOs = instructorDTO.getExperiences().stream()
                .map(exp -> {
                    ExperienceDTO dto = new ExperienceDTO();
                    dto.setOrganization(exp.getOrganization());
                    dto.setDesignation(exp.getDesignation());
                    dto.setDescription(exp.getDescription());
                    dto.setFrom(exp.getFrom());
                    dto.setTo(exp.getTo());
                    return dto;
                }).collect(Collectors.toList());
            faculty.setExperiences(experienceDTOs);
        }
        
        // Convert old List<String> skills to List<SkillDTO>
        if (instructorDTO.getSkills() != null) {
            List<SkillDTO> skillDTOs = instructorDTO.getSkills().stream()
                .map(skill -> {
                    SkillDTO dto = new SkillDTO();
                    dto.setSkill(skill);
                    dto.setProficiency("Intermediate");
                    return dto;
                }).collect(Collectors.toList());
            faculty.setSkills(skillDTOs);
        }
        
        if (instructorDTO.getOrganizations() != null) {
            faculty.setOrganizations(instructorDTO.getOrganizations());
        }
        
        // Convert old Qualifications to EducationDTO
        if (instructorDTO.getQualifications() != null) {
            List<EducationDTO> educationDTOs = instructorDTO.getQualifications().stream()
                .map(qual -> {
                    EducationDTO dto = new EducationDTO();
                    dto.setDegree(qual.getOrganization()); // organization was used as degree
                    dto.setScore(qual.getScore());
                    dto.setDescription(qual.getDescription());
                    dto.setStartYear(qual.getFrom());
                    dto.setEndYear(qual.getTo());
                    return dto;
                }).collect(Collectors.toList());
            faculty.setQualifications(educationDTOs);
        }
        
        if (instructorDTO.getGender() != null) faculty.setGender(instructorDTO.getGender().trim());
        if (instructorDTO.getWebsite() != null) faculty.setWebsite(instructorDTO.getWebsite().trim());
    }

    @Override
    public Faculty getFacultyDetails(String instructorId) {
        return facultyRepository.getInstructorDetails(instructorId);
    }

    @Override
    public List<Integer> getCourses(int facultyId) {
        return facultyCourseMappingRepository.getCourses(facultyId);
    }

    @Override
    public Integer getFacultyId(int classId) {
        return facultyCourseMappingRepository.getFacultyId(classId);
    }

    @Override
    public List<Faculty> getFacultyByDeptId(int deptId) {
        return  facultyRepository.getFacultyByDeptId(deptId);
    }

    private void validateCourseMappingScope(int facultyId, int courseId, int classId) {
        Integer facultyCollegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
        Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        if (facultyCollegeId == null || courseCollegeId == null || classCollegeId == null) {
            throw new IllegalArgumentException("Faculty, course and class must all exist");
        }
        if (!facultyCollegeId.equals(courseCollegeId) || !facultyCollegeId.equals(classCollegeId)) {
            throw new IllegalArgumentException("Faculty, course and class must belong to the same college");
        }
        Integer classProgramId = scopeResolutionService.resolveClassToProgramId(classId);
        if (classProgramId == null || !semesterCourseRepository.existsByProgramIdAndCourseId(classProgramId, courseId)) {
            throw new IllegalArgumentException("Course is not part of the selected class program curriculum");
        }
    }

    private void saveUniqueFacultyCourseMapping(int facultyId, int courseId, int classId) {
        List<FacultyCourseMapping> existing = facultyCourseMappingRepository
                .findByFacultyIdAndCourseIdAndClassId(facultyId, courseId, classId);
        if (existing != null && !existing.isEmpty()) {
            if (existing.size() > 1 || existing.get(0).getActive() == 1) {
                throw new IllegalArgumentException("Faculty already has this course/class mapping");
            }
            FacultyCourseMapping archived = existing.get(0);
            archived.setActive(1);
            facultyCourseMappingRepository.save(archived);
            return;
        }
        FacultyCourseMapping mapping = new FacultyCourseMapping();
        mapping.setFacultyId(facultyId);
        mapping.setCourseId(courseId);
        mapping.setClassId(classId);
        mapping.setActive(1);
        facultyCourseMappingRepository.save(mapping);
    }

    @Override
    public void createFacultyCourses(int facultyId, int courseId, int classId) {
    validateCourseMappingScope(facultyId, courseId, classId);
    saveUniqueFacultyCourseMapping(facultyId, courseId, classId);
}


@Override
public List<FacultyCourseMappingDTO> getFacultyClassMapping(int facultyId) {
    List<FacultyCourseMappingDTO> facultyCourseMappingDTOS = new ArrayList<>();
    List<FacultyCourseMapping> facultyClassMapping = facultyCourseMappingRepository.getFacultyClassMapping(facultyId);
    for (FacultyCourseMapping facultyCourseMapping : facultyClassMapping) {
        if (facultyCourseMapping.getActive() == 1) { // Check if active is 1
            FacultyCourseMappingDTO facultyCourseMappingDTO = new FacultyCourseMappingDTO();
            facultyCourseMappingDTO.setClassId(facultyCourseMapping.getClassId());
            facultyCourseMappingDTO.setCourseId(facultyCourseMapping.getCourseId());
            facultyCourseMappingDTO.setFacultyId(facultyCourseMapping.getFacultyId());
            facultyCourseMappingDTO.setMapping_id(facultyCourseMapping.getId()); 
            if (null != facultyCourseMapping.getCourseId()) {
                Course course = courseService.fetchCourse(facultyCourseMapping.getCourseId());
                facultyCourseMappingDTO.setCourse(course);
                facultyCourseMappingDTO.setCourseSlug(course != null ? course.getSlug() : null);
            }
            
            // Convert classId to a string and get the class name using the getClassNameById method
            String classIdAsString = String.valueOf(facultyCourseMapping.getClassId());
            String className = classService.getClassNameById(classIdAsString);
            facultyCourseMappingDTO.setSection_name(className);
            
            facultyCourseMappingDTOS.add(facultyCourseMappingDTO);
        }
    } 
    return facultyCourseMappingDTOS;
}




    public List<Faculty> findAll() {
        return facultyRepository.findAll();
    }

    @Override
    public List<FacultyCourseMapping> findAllCourseMappings() {
        return facultyCourseMappingRepository.findAll();
    }

    @Override
    public List<Faculty> fetchContactsByCollegeId(int collegeId) {
        return facultyRepository.fetchContactsByCollegeId(collegeId);
    }


    @Override
    public org.springframework.data.domain.Page<Faculty> fetchAdminRosterPage(
            int collegeId, String search, Integer deptId, String facultyType, String status,
            org.springframework.data.domain.Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(java.util.Locale.ROOT);
        if (!normalizedStatus.isEmpty() && !"ACTIVE".equals(normalizedStatus) && !"SUSPENDED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("status must be ACTIVE or SUSPENDED");
        }
        Integer typeOrdinal = null;
        if (facultyType != null && !facultyType.trim().isEmpty()) {
            try {
                typeOrdinal = com._42students.lms.enums.FacultyType
                        .valueOf(facultyType.trim().toUpperCase(java.util.Locale.ROOT)).ordinal();
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unknown faculty type: " + facultyType);
            }
        }
        return facultyRepository.findAdminRosterPage(
                collegeId, normalizedSearch, deptId, typeOrdinal, normalizedStatus, pageable);
    }

    @Override
    public List<Faculty> searchContactsByCollegeId(int collegeId, String search) {
        return facultyRepository.searchContactsByCollegeId(collegeId, search);
    }

    @Override
    public List<Faculty> fetchContactsByOrganizationId(int orgId) {
        return facultyRepository.fetchContactsByOrganizationId(orgId);
    }


    

   @Override
public FacultyCourseClassDTO getFacultyCourseMappingByCourseId(int courseId) {
    FacultyCourseClassDTO facultyCourseClassDTO = new FacultyCourseClassDTO();

    List<Object[]> facultyCourseMappings = facultyCourseMappingRepository.findByCourseId(courseId);
    if (facultyCourseMappings != null && facultyCourseMappings.size() > 1) {
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,
                "Multiple faculty/class mappings exist for this course; use the list mapping endpoint or specify a class");
    }
    if (facultyCourseMappings != null && !facultyCourseMappings.isEmpty()) {
        Object[] result = facultyCourseMappings.get(0);

        facultyCourseClassDTO.setFacultyId((Integer) result[1]); // Index 1 for faculty_id

        // Fetch faculty details using FacultyService
        int facultyId = (Integer) result[1]; // Assuming faculty_id is in index 1
        Faculty faculty = facultyService.getFacultyDetails(String.valueOf(facultyId));
        if (faculty != null) {
            facultyCourseClassDTO.setFacultyName(faculty.getFirstName() + " " + faculty.getLastName());
        }

        facultyCourseClassDTO.setClassId((Integer) result[2]); // Index 2 for class_id
        facultyCourseClassDTO.setCourseId((Integer) result[0]); // Index 0 for course_id

        // Fetch class name using ClassService
        String classId = String.valueOf(result[2]); // Assuming class_id is in index 2
        String className = classService.getClassDetail(classId).getName();
        facultyCourseClassDTO.setClassName(className);

        // Fetch course details using CourseService
        courseId = (Integer) result[0]; // Assuming course_id is in index 0
        Course course = courseService.fetchCourse(courseId);
        facultyCourseClassDTO.setCourse(course);
        facultyCourseClassDTO.setCourseSlug(course != null ? course.getSlug() : null);

        return facultyCourseClassDTO;
    }
    return null;
}

@Override
public void createFacultyCoursesBulk(int facultyId, int courseId, int classId) {
    validateCourseMappingScope(facultyId, courseId, classId);
    saveUniqueFacultyCourseMapping(facultyId, courseId, classId);
}

@Override
public FacultyCourseMapping getCourseMappingById(int mappingId) {
    return facultyCourseMappingRepository.findById(mappingId).orElse(null);
}

@Override
public void deactivateCourseMapping(int mappingId) {
    Optional<FacultyCourseMapping> optionalMapping = facultyCourseMappingRepository.findById(mappingId);
    if (optionalMapping.isPresent()) {
        FacultyCourseMapping mapping = optionalMapping.get();
        mapping.setActive(0); // Set "active" to 0
        facultyCourseMappingRepository.save(mapping);
    } else {
        // Handle the case when the mapping with the given ID is not found
        throw new RuntimeException("Mapping not found with ID: " + mappingId);
    }
}


@Override
public List<FacultyCourseClassMappingDTO> getCourseFacultyClassMapping(int courseId) {
    List<FacultyCourseClassMappingDTO> mappings = new ArrayList<>();
    List<Object[]> facultyCourseMappings = facultyCourseMappingRepository.findByCourseId(courseId);
    for (Object[] result : facultyCourseMappings) {
        FacultyCourseClassMappingDTO mappingDTO = new FacultyCourseClassMappingDTO();
        mappingDTO.setMappingId((Integer) result[3]); // Real mapping id, not faculty id

        // Fetch faculty details using FacultyService
        int facultyId = (Integer) result[1]; // Assuming faculty_id is in index 1
        Faculty faculty = facultyService.getFacultyDetails(String.valueOf(facultyId));
        if (faculty != null) {
            mappingDTO.setFacultyId(facultyId);
            mappingDTO.setFacultyName(faculty.getFirstName() + " " + faculty.getLastName());
        }

        mappingDTO.setCourseId((Integer) result[0]); // Assuming course_id is in index 0

        // Fetch course details using CourseService
        courseId = (Integer) result[0]; // Assuming course_id is in index 0
        Course course = courseService.fetchCourse(courseId);
        if (course != null) {
            mappingDTO.setCourseName(course.getCourseName());
            mappingDTO.setCourseSlug(course.getSlug());
        }

        mappingDTO.setClassId((Integer) result[2]); // Assuming class_id is in index 2

        // Fetch class name using ClassService
        int classId = (Integer) result[2]; // Assuming class_id is in index 2
        String className = classService.getClassDetail(String.valueOf(classId)).getName();
        mappingDTO.setClassName(className);

        mappings.add(mappingDTO);
    }
    return mappings;
}


@Override
    public FacultyCourseMappingDetailsDTO getFacultyCourseMappingDetails(int mappingId) {
        // Use only the new FacultyTeachingAssignment table
        Optional<FacultyTeachingAssignment> optionalAssignment = facultyTeachingAssignmentRepository.findById(mappingId);
        if (!optionalAssignment.isPresent()) {
            return null;
        }

        FacultyTeachingAssignment assignment = optionalAssignment.get();
        FacultyCourseMappingDetailsDTO mappingDetails = new FacultyCourseMappingDetailsDTO();

        // Set faculty ID, course ID, and class ID from the assignment
        mappingDetails.setFacultyId(assignment.getFacultyId());
        mappingDetails.setCourseId(assignment.getCourseId());
        mappingDetails.setClassId(assignment.getClassId());

        // Fetch course details using CourseService
        Course course = courseService.fetchCourse(assignment.getCourseId());
        mappingDetails.setCourse(course);
        mappingDetails.setCourseSlug(course != null ? course.getSlug() : null);

        // Fetch class name using ClassService
        String classId = String.valueOf(assignment.getClassId());
        String className = classService.getClassNameById(classId);
        mappingDetails.setClassName(className);

        return mappingDetails;
    }




    // metrics from here


    @Override
public int getUniqueClassesTaughtByFaculty(int facultyId) {
    return facultyCourseMappingRepository.countUniqueClassesByFacultyId(facultyId);
}


@Override
public int getUniqueCoursesTaughtByFaculty(int facultyId) {
    return facultyCourseMappingRepository.countUniqueCoursesByFacultyId(facultyId);
}


@Override
public int getUniqueClassesForCourse(int facultyId, int courseId) {
    return facultyCourseMappingRepository.countUniqueClassesForCourse(facultyId, courseId);
}


@Override
public int getUniqueCoursesForClass(int facultyId, int classId) {
    return facultyCourseMappingRepository.countUniqueCoursesForClass(facultyId, classId);
}

@Override
public Optional<Faculty> findById(Integer id) {
    return facultyRepository.findById(id);
}

@Override
public Faculty updateFaculty(Integer id, FacultyDTO facultyDTO) {
    Faculty faculty = facultyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Faculty not found with id: " + id));
    if (facultyDTO.getCollegeId() != null && !Objects.equals(faculty.getCollegeId(), facultyDTO.getCollegeId())) {
        throw new IllegalArgumentException("Changing a faculty member's college is not supported by this endpoint");
    }
    if (facultyDTO.getFacultyType() != null
            && !Objects.equals(facultyDTO.getFacultyType(), faculty.getFacultyType())) {
        throw new IllegalArgumentException("Changing faculty admin role is not supported by the generic profile update endpoint");
    }
    if (facultyDTO.getDeptId() != null) {
        Integer deptCollegeId = departmentRepository.findByIdAndNotDeleted(facultyDTO.getDeptId())
                .map(Department::getCollegeId).orElse(null);
        if (deptCollegeId == null || !Objects.equals(faculty.getCollegeId(), deptCollegeId)) {
            throw new IllegalArgumentException("Faculty department must belong to the faculty member's college");
        }
    }
    setFacultyDetails(facultyDTO, faculty);
    return facultyRepository.save(faculty);
}

@Override
public void deleteFaculty(Integer id) {
    Faculty faculty = facultyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Faculty not found with id: " + id));
    if (facultyTeachingAssignmentRepository != null && !facultyTeachingAssignmentRepository.findByFacultyId(id).isEmpty()) {
        throw new IllegalStateException("Cannot delete faculty: they have teaching assignments");
    }
    if (projectMemberRepository != null && projectWorkspaceRepository != null) {
        List<Integer> mentoredProjectIds = projectMemberRepository.findProjectIdsForUser(id, "FACULTY");
        long activeMentoredCount = mentoredProjectIds == null || mentoredProjectIds.isEmpty()
                ? 0
                : projectWorkspaceRepository.findActiveByIds(mentoredProjectIds).stream()
                    .filter(project -> !"ARCHIVED".equalsIgnoreCase(String.valueOf(project.getStatus())))
                    .count();
        if (activeMentoredCount > 0) {
            throw new IllegalStateException("Cannot delete faculty: they mentor " + activeMentoredCount
                    + " active project workspace(s). Reassign those projects to another mentor first.");
        }
    }
    facultyRepository.delete(faculty);
}
}

