package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.BulkCourseMappingDTO;
import com._42students.lms.dto.request.BulkFacultyRegisterRequest;
import com._42students.lms.dto.request.BulkValidateRequest;
import com._42students.lms.dto.request.CourseMappingDTO;
import com._42students.lms.dto.request.FacultyDTO;
import com._42students.lms.dto.response.BulkFacultyRegisterResponse;
import com._42students.lms.dto.response.BulkValidateResponse;
import com._42students.lms.dto.response.FacultyCourseClassDTO;
import com._42students.lms.dto.response.FacultyCourseMappingDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.dto.response.FacultyCourseClassMappingDTO;
import com._42students.lms.enums.FacultyType;
import com._42students.lms.model.Faculty;
import com._42students.lms.service.ClassScheduleService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.service.NotificationTemplateContext;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.service.SmsService;
import com._42students.lms.service.TestOtpService;
import com._42students.lms.service.VerificationService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.security.RateLimitingService;
import com._42students.lms.security.UserPrincipal;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com._42students.lms.dto.response.FacultyCourseMappingDetailsDTO;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/v1/faculty")
@Slf4j
@Validated
public class FacultyController extends BaseController {

    @Autowired
    FacultyService facultyService;

    @Autowired
    VerificationService verificationService;

    @Autowired
    ClassScheduleService classScheduleService;

    @Autowired
    SmsService smsService;

    @Autowired
    RestTemplate restTemplate;

    @Autowired
    CourseSlugResolver courseSlugResolver;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    private TestOtpService testOtpService;

    @Autowired(required = false)
    private RateLimitingService rateLimitingService;

    @Autowired(required = false)
    private com._42students.lms.service.AppSettingsService appSettingsService;

    private int otpMaxAttempts() {
        return appSettingsService != null ? appSettingsService.getOtpMaxAttempts() : 5;
    }

    private long otpWindowSeconds() {
        return appSettingsService != null ? appSettingsService.getOtpWindowSeconds() : 900;
    }

    /**
     * @deprecated For profile updates, use the new granular Profile APIs at /api/v1/profile/faculty/{facultyId}/*
     * This endpoint should only be used for initial faculty registration by admin.
     */
    @Deprecated
    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/register", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Register a faculty (Deprecated for profile updates - use /api/v1/profile/faculty APIs)", notes = "Use granular profile APIs for profile updates")
    public ResponseEntity registerUser(@RequestBody @Valid FacultyDTO facultyDTO, javax.servlet.http.HttpServletRequest httpRequest) {
        // SECURITY: register() also acts as an update when facultyDTO.getFacultyId() matches an
        // existing faculty row (see FacultyServiceImpl.register). Unlike updateFaculty/deleteFaculty,
        // this endpoint previously never verified the caller has access to that faculty's college,
        // allowing a College-A admin to overwrite a College-B faculty's contactMobile (login identifier).
        // Mirror the college-access check used by updateFaculty/deleteFaculty before allowing that path.
        if (facultyDTO != null && facultyDTO.getFacultyId() != null && facultyDTO.getFacultyId() != 0) {
            Faculty existing = facultyService.getFacultyDetails(String.valueOf(facultyDTO.getFacultyId()));
            if (existing != null) {
                UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
                Integer collegeId = existing.getCollegeId();
                // Safety: scoped superadmin must not mutate outside JWT scope
                if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
                    if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update faculty in the selected college", null), HttpStatus.FORBIDDEN);
                    }
                    if (principal.getOrganizationId() != null && collegeId != null) {
                        Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                        if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update faculty within the selected organization", null), HttpStatus.FORBIDDEN);
                        }
                    }
                }
                accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
            }
        }
        UserPrincipal registrationPrincipal = securityContextUtil.getAuthenticatedUserPrincipal();
        // ADMIN and TPO are super-admin-managed roles (ProtectedFacultyRoles).
        if (facultyDTO != null && com._42students.lms.access.ProtectedFacultyRoles.isProtected(facultyDTO.getFacultyType())
                && !accessControlService.isSuperAdmin(registrationPrincipal)) {
            String roleMessage = facultyDTO.getFacultyType() == FacultyType.ADMIN
                    ? "Only a super-admin may grant the college ADMIN role"
                    : "Only a super-admin may grant the " + facultyDTO.getFacultyType().name() + " role";
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), roleMessage, null), HttpStatus.FORBIDDEN);
        }
        Integer requestedCollegeId = facultyDTO != null ? facultyDTO.getCollegeId() : null;
        Integer requestedDeptId = facultyDTO != null ? facultyDTO.getDeptId() : null;
        Integer departmentCollegeId = scopeResolutionService != null && requestedDeptId != null
                ? scopeResolutionService.resolveDepartmentToCollegeId(requestedDeptId) : null;
        if (requestedCollegeId == null || departmentCollegeId == null
                || !requestedCollegeId.equals(departmentCollegeId)) {
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(),
                    "Faculty department must belong to the selected college", null), HttpStatus.BAD_REQUEST);
        }
        accessControlService.requirePerformAdminActionForCollege(registrationPrincipal, requestedCollegeId);
        try {
            boolean isNew = facultyDTO.getFacultyId() == null || facultyDTO.getFacultyId() == 0;
            Faculty faculty = facultyService.register(facultyDTO);
            // A faculty member's audit trail started at their first edit; who added them was never recorded.
            if (auditLogService != null && faculty != null) {
                auditLogService.log(httpRequest, isNew ? "FACULTY_CREATE" : "FACULTY_UPDATE", "faculty",
                        String.valueOf(faculty.getId()), null, requestedCollegeId, java.util.Map.of());
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),faculty), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error registering faculty: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Unexpected error registering faculty: ", e);
            return new ResponseEntity(new Response("error", "Failed to register faculty. Please try again or contact support.", null), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @RequestMapping(value = "/bulk-validate", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Bulk validate faculty mobiles and emails", notes = "Returns which mobiles/emails already exist in faculty. No side effects.")
    public ResponseEntity bulkValidate(@RequestBody @Valid BulkValidateRequest request) {
        accessControlService.requirePerformAdminActionForCollege(securityContextUtil.getAuthenticatedUserPrincipal(), request.getCollegeId());
        try {
            BulkValidateResponse response = facultyService.bulkValidate(request);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Bulk validate faculty error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    @RequestMapping(value = "/bulk-register", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Bulk register faculty", notes = "Create multiple faculty for a college. Enforces college access.")
    public ResponseEntity bulkRegister(@RequestBody @Valid BulkFacultyRegisterRequest request) {
        accessControlService.requirePerformAdminActionForCollege(securityContextUtil.getAuthenticatedUserPrincipal(), request.getCollegeId());
        try {
            BulkFacultyRegisterResponse response = facultyService.bulkRegister(request);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), response), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Bulk register faculty error: {}", e.getMessage());
            return new ResponseEntity(new Response("error", e.getMessage(), null), HttpStatus.BAD_REQUEST);
        }
    }

    private void requireCourseMappingAdminRole(UserPrincipal principal) {
        if (principal == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        if (!isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only an admin can create, update, or remove faculty course mappings");
        }
    }

    private void requireValidCourseMappingScope(UserPrincipal principal, int facultyId, int courseId, int classId) {
        if (scopeResolutionService == null) {
            throw new org.springframework.security.access.AccessDeniedException("Unable to resolve academic scope");
        }
        Integer facultyCollegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
        Integer courseCollegeId = scopeResolutionService.resolveCourseToCollegeId(courseId);
        Integer classCollegeId = scopeResolutionService.resolveClassToCollegeId(classId);
        if (facultyCollegeId == null || courseCollegeId == null || classCollegeId == null) {
            throw new IllegalArgumentException("Faculty, course and class must all exist");
        }
        if (!facultyCollegeId.equals(courseCollegeId) || !facultyCollegeId.equals(classCollegeId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Faculty, course and class must belong to the same college");
        }
        accessControlService.requirePerformAdminActionForCollege(principal, facultyCollegeId);
    }

    private void requireValidCourseMappingScope(UserPrincipal principal, CourseMappingDTO dto) {
        requireValidCourseMappingScope(principal, dto.getFacultyId(), dto.getCourseId(), dto.getClassId());
    }

    @PreAuthorize("isAuthenticated()")
    @RequestMapping(value = "/createCourseMapping", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a course mapping for faculty", notes = "")
    public ResponseEntity createCourseMapping(@RequestBody @Valid CourseMappingDTO courseMappingDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireCourseMappingAdminRole(principal);
        requireValidCourseMappingScope(principal, courseMappingDTO);
        facultyService.createFacultyCourses(courseMappingDTO.getFacultyId(), courseMappingDTO.getCourseId(), courseMappingDTO.getClassId());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"Success"),
                HttpStatus.OK);
    }

    @RequestMapping(value = "/getInstructorDetails", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get faculty details by id or mobile number", notes = "")
    public ResponseEntity<Faculty> getFacultyDetails(String facultyId) {
        int facultyIdInt;
        try {
            facultyIdInt = Integer.parseInt(facultyId);
        } catch (NumberFormatException e) {
            log.warn("Invalid faculty id for getInstructorDetails: {}", facultyId);
            return new ResponseEntity(new Response("error", "Invalid faculty id", null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessFacultySchedule(principal, facultyIdInt);
        try {
            Faculty faculty = facultyService.getFacultyDetails(facultyId);
            // SECURITY: canAccessFacultySchedule's "same college" branch has no role check, so any
            // FACULTY/LEARNER in the same college can reach this endpoint for any facultyId. The raw
            // Faculty entity carries `identity` (Aadhaar/PAN numbers and upload URLs) - only the
            // faculty member themself or an admin/super-admin may see those sensitive fields; strip
            // them for every other caller (e.g. a colleague viewing basic schedule info).
            boolean isSelf = faculty != null && principal != null && principal.isFaculty()
                    && principal.getId() != null && principal.getId().equals(facultyIdInt);
            boolean isAdmin = accessControlService.isSuperAdmin(principal)
                    || "ADMIN".equalsIgnoreCase(principal.getUserType())
                    || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
            if (faculty != null && !isSelf && !isAdmin) {
                // Never mutate the JPA entity just to redact a response: the caller can be a
                // learner whose numeric id coincides with this faculty id, and entity mutation
                // risks clearing persisted identity documents on a later flush.
                Faculty redacted = new Faculty();
                org.springframework.beans.BeanUtils.copyProperties(faculty, redacted);
                redacted.setIdentity(null);
                faculty = redacted;
            }
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), faculty), HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error getting faculty details for {}", facultyId, e);
            return new ResponseEntity(new Response("error", "Failed to get faculty details. Please try again or contact support.", null), HttpStatus.BAD_REQUEST);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/getAllFaculty", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all faculty", notes = "")
    public ResponseEntity getAllFaculty() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        List<Faculty> faculty;
        if (accessControlService.isSuperAdmin(principal)) {
            Integer scopedCollegeId = principal.getCollegeId();
            Integer scopedOrgId = principal.getOrganizationId();
            if (scopedCollegeId != null) {
                faculty = facultyService.fetchContactsByCollegeId(scopedCollegeId);
            } else if (scopedOrgId != null) {
                faculty = facultyService.fetchContactsByOrganizationId(scopedOrgId);
            } else {
                faculty = facultyService.findAll();
            }
        } else {
            Integer collegeId = principal.getCollegeId();
            if (collegeId != null) {
                faculty = facultyService.fetchContactsByCollegeId(collegeId);
            } else {
                faculty = java.util.List.of();
            }
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), faculty), HttpStatus.OK);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @RequestMapping(value = "/getAllCourseMappings", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get all faculty course mappings", notes = "Returns all active faculty-course-class mappings")
    public ResponseEntity getAllCourseMappings() {
        // Defense-in-depth alongside @PreAuthorize, matching this controller's own established
        // pattern (see requireCourseMappingAdminRole's other call sites) — never rely on the
        // annotation alone.
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        requireCourseMappingAdminRole(principal);
        java.util.List<com._42students.lms.model.FacultyCourseMapping> mappings = facultyService.findAllCourseMappings().stream()
                .filter(mapping -> accessControlService.isGlobalSuperAdmin(principal)
                        || (scopeResolutionService != null
                        && accessControlService.canAccessCollege(principal,
                        scopeResolutionService.resolveFacultyToCollegeId(mapping.getFacultyId()))))
                .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), mappings), HttpStatus.OK);
    }

    @RequestMapping(value = "/getFacultyByDeptId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get faculty details by dept id", notes = "")
    public ResponseEntity<Faculty> getFacultyByDeptId(int deptId)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessDepartment(principal, deptId);
        boolean isAdmin = accessControlService.isSuperAdmin(principal)
                || "ADMIN".equalsIgnoreCase(principal.getUserType())
                || (principal.isFaculty() && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        // Department access is not permission to read colleagues' identity documents.
        // Return detached, redacted copies: do not null the identity on a managed entity.
        List<Faculty> faculty = facultyService.getFacultyByDeptId(deptId);
        List<Faculty> safeFaculty = faculty.stream().map(item -> {
            if (item == null || isAdmin || (principal.isFaculty()
                    && principal.getId() != null && principal.getId().equals(item.getId()))) {
                return item;
            }
            Faculty redacted = new Faculty();
            org.springframework.beans.BeanUtils.copyProperties(item, redacted);
            redacted.setIdentity(null);
            return redacted;
        }).collect(java.util.stream.Collectors.toList());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                safeFaculty), HttpStatus.OK);
    }

    @RequestMapping(value = "/getFacultyByCollegeId", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get faculty by college ID", notes = "Supports bounded server-side paging/search/filtering. Omitting page preserves the legacy array response.")
    public ResponseEntity getFacultyByCollegeId(@RequestParam int collegeId,
                                               @RequestParam(value = "search", required = false) String search,
                                               @RequestParam(value = "deptId", required = false) Integer deptId,
                                               @RequestParam(value = "facultyType", required = false) String facultyType,
                                               @RequestParam(value = "status", required = false) String status,
                                               @RequestParam(value = "page", required = false) Integer page,
                                               @RequestParam(value = "size", required = false) Integer size) {
        accessControlService.requirePerformAdminActionForCollege(
                securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);

        if (page == null) {
            List<Faculty> faculty = (search != null && !search.trim().isEmpty())
                    ? facultyService.searchContactsByCollegeId(collegeId, search.trim())
                    : facultyService.fetchContactsByCollegeId(collegeId);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), faculty), HttpStatus.OK);
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size == null ? 25 : size, 200));
        Page<Faculty> facultyPage = facultyService.fetchAdminRosterPage(
                collegeId, search, deptId, facultyType, status, PageRequest.of(safePage, safeSize));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", facultyPage.getContent());
        result.put("totalElements", facultyPage.getTotalElements());
        result.put("totalPages", facultyPage.getTotalPages());
        result.put("page", facultyPage.getNumber());
        result.put("size", facultyPage.getSize());
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), result), HttpStatus.OK);
    }


    @RequestMapping(value = "/getCoursesFromClassSchedule", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get list of faculty courses by faculty id from class schedule", notes = "")
    public ResponseEntity getCourses(int facultyId)
            throws Exception {
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                classScheduleService.getCourses(facultyId)), HttpStatus.OK);
    }

    @RequestMapping(value = "/getFacultyCoursesFromMapping", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get list of faculty courses by faculty id from faculty course table", notes = "")
    public ResponseEntity getFacultyCourses(int facultyId)
            throws Exception {
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                facultyService.getCourses(facultyId)), HttpStatus.OK);
    }

    @RequestMapping(value = "/getFacultyClassMapping", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get list of class by faculty id from faculty course mapping", notes = "")
    public ResponseEntity getFacultyClassMapping(int facultyId)
            throws Exception {
        accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                facultyService.getFacultyClassMapping(facultyId)), HttpStatus.OK);
    }

 
    @RequestMapping(value = "/login", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Login faculty with phone number or id", notes = "")
    public ResponseEntity login(String phoneNumber)
            throws Exception {
        if (null == facultyService.getFacultyDetails(phoneNumber)) {
            throw new Exception("No faculty registered with Mobile number " + phoneNumber);
        }
        String phone = phoneNumber != null ? phoneNumber.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        // Rate limit OTP send requests per phone number (5 per 15 minutes)
        if (rateLimitingService != null && rateLimitingService.isRateLimited("faculty:login:" + phone, otpMaxAttempts(), otpWindowSeconds())) {
            throw new Exception("Too many OTP requests. Please try again later.");
        }
        if (rateLimitingService != null) {
            rateLimitingService.recordAttempt("faculty:login:" + phone, otpMaxAttempts(), otpWindowSeconds());
        }
        String otp = (testOtpService != null && testOtpService.isTestPhone(phoneNumber))
                ? testOtpService.getOtpForTestPhone()
                : String.valueOf(ThreadLocalRandom.current().nextInt(1000, 9999));
        // Faculty OTP defaults to LMS context
        smsService.sendOtp(phoneNumber, otp, NotificationTemplateContext.LMS);
        verificationService.saveInstructorAccountVerification(phoneNumber, otp);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),"OTP triggered"), HttpStatus.OK);
    }


    @RequestMapping(value = "/verifyOTP", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Verify OTP for faculty phone number", notes = "")
    public ResponseEntity verifyOTP(String phoneNumber, String otp)
            throws Exception {
        if (null == facultyService.getFacultyDetails(phoneNumber)) {
            throw new Exception("No instructor registered with mobile number " + phoneNumber);
        }
        String phone = phoneNumber != null ? phoneNumber.trim() : null;
        String otpTrimmed = otp != null ? otp.trim() : null;
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        if (otpTrimmed == null || otpTrimmed.isEmpty()) {
            throw new IllegalArgumentException("OTP is required");
        }
        // Rate limit OTP verification attempts per phone number (5 per 15 minutes)
        if (rateLimitingService != null && rateLimitingService.isRateLimited("faculty:verifyOTP:" + phone, otpMaxAttempts(), otpWindowSeconds())) {
            throw new Exception("Too many verification attempts. Please try again later.");
        }
        if (rateLimitingService != null) {
            rateLimitingService.recordAttempt("faculty:verifyOTP:" + phone, otpMaxAttempts(), otpWindowSeconds());
        }
        if (testOtpService != null && testOtpService.matchesTestOtp(phoneNumber, otp)) {
            // ok
        } else if (!verificationService.verifyInstructorOTP(phone, otpTrimmed)) {
            throw new Exception("Incorrect OTP");
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),facultyService.getFacultyDetails(phoneNumber)), HttpStatus.OK);
    }


   @GetMapping("/getFacultyCourseMapping")
    @ApiOperation(value = "Get faculty course mapping by course id", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity<FacultyCourseClassDTO> getFacultyCourseMappingByCourseId(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId);
        FacultyCourseClassDTO facultyCourseClassDTO = facultyService.getFacultyCourseMappingByCourseId(resolvedCourseId);
    if (facultyCourseClassDTO != null) {
        return new ResponseEntity<>(facultyCourseClassDTO, HttpStatus.OK);
    } else {
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}


@PreAuthorize("isAuthenticated()")
@RequestMapping(value = "/createBulkCourseMapping", method = RequestMethod.POST, produces = "application/json")
@ApiOperation(value = "Create bulk course mappings for faculty", notes = "")
public ResponseEntity createBulkCourseMapping(@RequestBody @Valid BulkCourseMappingDTO bulkCourseMappingDTO)
        throws Exception {
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    requireCourseMappingAdminRole(principal);
    List<CourseMappingDTO> courseMappings = bulkCourseMappingDTO.getCourseMappings();
    for (CourseMappingDTO courseMappingDTO : courseMappings) {
        requireValidCourseMappingScope(principal, courseMappingDTO);
    }
    for (CourseMappingDTO courseMappingDTO : courseMappings) {
        facultyService.createFacultyCoursesBulk(
                courseMappingDTO.getFacultyId(),
                courseMappingDTO.getCourseId(),
                courseMappingDTO.getClassId()
        );
    }
    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), "Success"),
            HttpStatus.OK);
}

@PreAuthorize("isAuthenticated()")
@RequestMapping(value = "/deactivateMapping", method = RequestMethod.PATCH, produces = "application/json")
@ApiOperation(value = "Deactivate a course mapping", notes = "")
public ResponseEntity deactivateMapping(@RequestParam int mappingId)
        throws Exception {
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    requireCourseMappingAdminRole(principal);
    com._42students.lms.model.FacultyCourseMapping mapping = facultyService.getCourseMappingById(mappingId);
    if (mapping == null) {
        return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Mapping not found", null), HttpStatus.NOT_FOUND);
    }
    requireValidCourseMappingScope(principal, mapping.getFacultyId(), mapping.getCourseId(), mapping.getClassId());
    if (mapping.getClassId() != null) {
        accessControlService.requireAccessClass(principal, mapping.getClassId());
    } else {
        accessControlService.requireAccessFacultySchedule(principal, mapping.getFacultyId());
    }
    facultyService.deactivateCourseMapping(mappingId);
    return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), "Mapping deactivated"),
            HttpStatus.OK);
}


@RequestMapping(value = "/getCourseFacultyClassMapping", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get course faculty class mapping by course ID", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity<List<FacultyCourseClassMappingDTO>> getCourseFacultyClassMapping(
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId);
        List<FacultyCourseClassMappingDTO> mappings = facultyService.getCourseFacultyClassMapping(resolvedCourseId);
    return new ResponseEntity<>(mappings, HttpStatus.OK);
}


@GetMapping("/getFacultyCourseMappingDetails")
@ApiOperation(value = "Get details of a faculty course mapping by mapping ID", notes = "")
public ResponseEntity<FacultyCourseMappingDetailsDTO> getFacultyCourseMappingDetails(@RequestParam int mappingId)
        throws Exception {
    FacultyCourseMappingDetailsDTO mappingDetails = facultyService.getFacultyCourseMappingDetails(mappingId);
    if (mappingDetails != null) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (mappingDetails.getClassId() != null) {
            accessControlService.requireAccessClass(principal, mappingDetails.getClassId());
        } else {
            accessControlService.requireAccessFacultySchedule(principal, mappingDetails.getFacultyId());
        }
        return new ResponseEntity<>(mappingDetails, HttpStatus.OK);
    } else {
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}


    
@GetMapping("/uniqueClasses")
@ApiOperation(value = "Get the number of unique classes taught by a faculty", notes = "")
public ResponseEntity<Integer> getUniqueClassesTaughtByFaculty(
        @RequestParam int facultyId
) {
    accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
    int uniqueClasses = facultyService.getUniqueClassesTaughtByFaculty(facultyId);
    return new ResponseEntity<>(uniqueClasses, HttpStatus.OK);
}


@GetMapping("/uniqueCourses")
@ApiOperation(value = "Get the number of unique courses taught by a faculty", notes = "")
public ResponseEntity<Integer> getUniqueCoursesTaughtByFaculty(
        @RequestParam int facultyId
) {
    accessControlService.requireAccessFacultySchedule(securityContextUtil.getAuthenticatedUserPrincipal(), facultyId);
    int uniqueCourses = facultyService.getUniqueCoursesTaughtByFaculty(facultyId);
    return new ResponseEntity<>(uniqueCourses, HttpStatus.OK);
}


@GetMapping("/uniqueClassesForCourse")
    @ApiOperation(value = "Get the number of unique classes taught by a faculty for a particular course", notes = "Use courseSlug or courseId; courseSlug takes precedence")
    public ResponseEntity<Integer> getUniqueClassesForCourse(
            @RequestParam int facultyId,
            @RequestParam(required = false) String courseSlug,
            @RequestParam(required = false) Integer courseId) {
        int resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        accessControlService.requireAccessFacultySchedule(principal, facultyId);
        accessControlService.requireAccessCourse(principal, resolvedCourseId);
        int uniqueClasses = facultyService.getUniqueClassesForCourse(facultyId, resolvedCourseId);
    return new ResponseEntity<>(uniqueClasses, HttpStatus.OK);
}


@GetMapping("/uniqueCoursesForClass")
@ApiOperation(value = "Get the number of unique courses taught by a faculty for a particular class", notes = "")
public ResponseEntity<Integer> getUniqueCoursesForClass(
        @RequestParam int facultyId,
        @RequestParam int classId
) {
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    accessControlService.requireAccessFacultySchedule(principal, facultyId);
    accessControlService.requireAccessClass(principal, classId);
    int uniqueCourses = facultyService.getUniqueCoursesForClass(facultyId, classId);
    return new ResponseEntity<>(uniqueCourses, HttpStatus.OK);
}

@RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
@ApiOperation(value = "Update a faculty member", notes = "")
public ResponseEntity updateFaculty(@PathVariable Integer id, @RequestBody @Valid FacultyDTO facultyDTO, javax.servlet.http.HttpServletRequest httpRequest) {
    Faculty existing = facultyService.getFacultyDetails(String.valueOf(id));
    if (existing == null) {
        return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Faculty not found", null), HttpStatus.NOT_FOUND);
    }
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    Integer collegeId = existing.getCollegeId();
    // Safety: scoped superadmin must not mutate outside JWT scope
    if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
        if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update faculty in the selected college", null), HttpStatus.FORBIDDEN);
        }
        if (principal.getOrganizationId() != null && collegeId != null) {
            Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
            if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update faculty within the selected organization", null), HttpStatus.FORBIDDEN);
            }
        }
    }
    accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
    com._42students.lms.access.ProtectedFacultyRoles.requireCanEdit(
            accessControlService.isSuperAdmin(principal), principal, existing);
    try {
        Faculty updatedFaculty = facultyService.updateFaculty(id, facultyDTO);
        // Was previously unaudited — Faculty.js's "Edit" action left no trail at all. entityId is
        // the faculty's own id, stable/linkable for the audit-trail drill-down on that page.
        if (auditLogService != null) {
            auditLogService.log(httpRequest, "FACULTY_UPDATE", "faculty", String.valueOf(id), null, collegeId, java.util.Map.of());
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedFaculty), HttpStatus.OK);
    } catch (RuntimeException e) {
        return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
    }
}

@RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
@ApiOperation(value = "Delete a faculty member", notes = "")
public ResponseEntity deleteFaculty(@PathVariable Integer id, javax.servlet.http.HttpServletRequest httpRequest) {
    Faculty existing = facultyService.getFacultyDetails(String.valueOf(id));
    if (existing == null) {
        return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Faculty not found", null), HttpStatus.NOT_FOUND);
    }
    UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
    Integer collegeId = existing.getCollegeId();
    // Safety: scoped superadmin must not mutate outside JWT scope
    if (principal != null && accessControlService.isSuperAdmin(principal) && scopeResolutionService != null) {
        if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete faculty in the selected college", null), HttpStatus.FORBIDDEN);
        }
        if (principal.getOrganizationId() != null && collegeId != null) {
            Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
            if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete faculty within the selected organization", null), HttpStatus.FORBIDDEN);
            }
        }
    }
    accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
    com._42students.lms.access.ProtectedFacultyRoles.requireCanManage(
            accessControlService.isSuperAdmin(principal), existing);
    try {
        facultyService.deleteFaculty(id);
        if (auditLogService != null) {
            auditLogService.log(httpRequest, "FACULTY_DELETE", "faculty", String.valueOf(id), null, collegeId, java.util.Map.of());
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), "Faculty deleted successfully", null), HttpStatus.OK);
    } catch (IllegalStateException e) {
        return new ResponseEntity(new Response(HttpStatus.CONFLICT.name(), e.getMessage(), null), HttpStatus.CONFLICT);
    } catch (RuntimeException e) {
        return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), e.getMessage(), null), HttpStatus.NOT_FOUND);
    }
}
}

