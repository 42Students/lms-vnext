package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.BulkFacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.dto.request.FacultyCourseAssociationCreateRequestDTO;
import com._42students.lms.dto.response.ActiveCourseResponseDTO;
import com._42students.lms.dto.response.FacultyInfoDTO;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyCourseAssociationService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty-course-associations")
public class FacultyCourseAssociationController {

    private final FacultyCourseAssociationService associationService;
    private final CourseSlugResolver courseSlugResolver;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    public FacultyCourseAssociationController(FacultyCourseAssociationService associationService,
                                             CourseSlugResolver courseSlugResolver) {
        this.associationService = associationService;
        this.courseSlugResolver = courseSlugResolver;
    }

    private void requireAssociationAdminRole(UserPrincipal principal) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        if (!isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only an admin can create, update, or remove faculty course associations");
        }
    }

    @PostMapping("/create")
    public ResponseEntity<String> createAssociation(@RequestBody @Valid FacultyCourseAssociationCreateRequestDTO requestDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        requireAssociationAdminRole(principal);
        accessControlService.requireAccessFacultySchedule(principal, requestDTO.getFacultyId());
        for (Integer courseId : requestDTO.getCourseIds()) {
            accessControlService.requireAccessCourse(principal, courseId);
        }
        associationService.createAssociation(requestDTO);
        return ResponseEntity.ok("Association created successfully.");
    }

   @GetMapping("/fetchAllCoursesByFacultyId")
    public ResponseEntity<List<ActiveCourseResponseDTO>> fetchCoursesByFaculty(@RequestParam int facultyId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        List<ActiveCourseResponseDTO> courses = associationService.fetchCoursesByFaculty(facultyId);
        return ResponseEntity.ok(courses);
    }
 
   
    @PostMapping("/createBulk")
    public ResponseEntity<String> createBulkAssociations(@RequestBody @Valid BulkFacultyCourseAssociationCreateRequestDTO bulkRequestDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        requireAssociationAdminRole(principal);
        for (FacultyCourseAssociationCreateRequestDTO requestDTO : bulkRequestDTO.getFacultyCourseAssociations()) {
            accessControlService.requireAccessFacultySchedule(principal, requestDTO.getFacultyId());
            for (Integer courseId : requestDTO.getCourseIds()) {
                accessControlService.requireAccessCourse(principal, courseId);
            }
        }
        associationService.createBulkAssociations(bulkRequestDTO);
        return ResponseEntity.ok("Bulk associations created successfully.");
}

    @PatchMapping("/deactivateAssociation")
    public ResponseEntity<String> deactivateAssociation(@RequestParam Long mappingId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        requireAssociationAdminRole(principal);
        Integer facultyId = associationService.getFacultyIdForAssociation(mappingId);
        if (facultyId == null) return ResponseEntity.status(404).build();
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        associationService.deactivateAssociation(mappingId);
        return ResponseEntity.ok("Association deactivated successfully.");
    }


    @GetMapping("/fetchActiveFacultyIdsByCourseId")
    public ResponseEntity<List<Integer>> fetchActiveFacultiesByCourse(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        List<Integer> facultyIds = associationService.fetchActiveFacultiesByCourse(resolvedCourseId);
        return ResponseEntity.ok(facultyIds);
    }

    @GetMapping("/fetchActiveFacultiesInfoByCourseId")
    public ResponseEntity<List<FacultyInfoDTO>> fetchActiveFacultiesInfoByCourse(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) return ResponseEntity.status(401).build();
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        List<FacultyInfoDTO> facultiesInfo = associationService.fetchActiveFacultiesInfoByCourse(resolvedCourseId);
        return ResponseEntity.ok(facultiesInfo);
    }


@GetMapping("/fetchActiveCoursesByFacultyId")
public ResponseEntity<List<ActiveCourseResponseDTO>> fetchActiveCoursesByFaculty(@RequestParam int facultyId) {
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    accessControlService.requireAccessFacultySchedule(principal, facultyId);
    List<ActiveCourseResponseDTO> activeCourses = associationService.fetchActiveCoursesByFaculty(facultyId);
    return ResponseEntity.ok(activeCourses);
}


    // Other controller methods for managing associations
}

