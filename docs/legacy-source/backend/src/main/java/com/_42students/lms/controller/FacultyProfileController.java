package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.profile.*;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.FacultyProfileService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import javax.validation.Valid;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/profile/faculty")
@Slf4j
@Api(tags = "Faculty Profile APIs")
public class FacultyProfileController {

    @Autowired
    private FacultyProfileService profileService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private com._42students.lms.repository.FacultyRepository facultyRepository;

    private static void requireValidUserId(Integer id, String field) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a positive integer");
        }
    }

    /**
     * Enforce self-only for faculty principals; allow admins/super-admins to access by college scope.
     * Rejects null/0/negative to avoid magic-value bypass.
     */
    private void requireAccessFacultyProfile(Integer facultyId) {
        requireValidUserId(facultyId, "facultyId");
        if (securityContextUtil == null || accessControlService == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profile access not configured");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.isLearner()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        // Admin / super-admin: college scoped access check
        boolean isAdmin = "ADMIN".equalsIgnoreCase(principal.getUserType())
                || ("FACULTY".equalsIgnoreCase(principal.getUserType()) && "ADMIN".equalsIgnoreCase(principal.getFacultyType()));
        // Non-admin faculty principals: self-only. Faculty admins continue to the scoped admin check below.
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && !isAdmin
                && principal.getId() != null
                && !principal.getId().equals(facultyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        if (accessControlService.isSuperAdmin(principal)) {
            return;
        }
        if (isAdmin && accessControlService.canAccessFacultySchedule(principal, facultyId)) {
            requireCanWriteProtectedProfile(principal, facultyId);
            return;
        }
        if (principal.getId() != null && principal.getId().equals(facultyId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    /**
     * A college admin may read any faculty profile in their college but may not change the profile
     * of another ADMIN or TPO (super-admin-managed roles; see ProtectedFacultyRoles). Reads pass.
     */
    private void requireCanWriteProtectedProfile(UserPrincipal principal, Integer facultyId) {
        if (principal != null && principal.getId() != null && principal.getId().equals(facultyId)) return;
        if (!isWriteRequest()) return;
        if (facultyRepository == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profile access not configured");
        }
        com._42students.lms.model.Faculty target = facultyRepository.findById(facultyId).orElse(null);
        try {
            com._42students.lms.access.ProtectedFacultyRoles.requireCanEdit(false, principal, target);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    private static boolean isWriteRequest() {
        org.springframework.web.context.request.RequestAttributes attrs =
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if (!(attrs instanceof org.springframework.web.context.request.ServletRequestAttributes)) return true;
        String method = ((org.springframework.web.context.request.ServletRequestAttributes) attrs).getRequest().getMethod();
        return !("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method));
    }

    private String resolveTenantPrefixForFaculty(UserPrincipal principal, Integer facultyId) {
        if (principal == null) return null;
        Integer collegeId = principal.getCollegeId();
        Integer organizationId = principal.getOrganizationId();
        if (scopeResolutionService != null && (collegeId == null || organizationId == null)) {
            if (collegeId == null) {
                collegeId = scopeResolutionService.resolveFacultyToCollegeId(facultyId);
            }
            if (organizationId == null && collegeId != null) {
                organizationId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
            }
        }
        if (collegeId == null || organizationId == null) return null;
        return "org-" + organizationId + "/college-" + collegeId;
    }

    private void validateIdentityDocRef(Integer facultyId, String ref) {
        validateOwnedStorageRef(facultyId, ref, "identity-docs", "Identity document");
    }

    private void validateProfileImageRef(Integer facultyId, String ref) {
        validateOwnedStorageRef(facultyId, ref, "profile-images", "Profile image");
    }

    private void validateOwnedStorageRef(Integer facultyId, String ref, String folder, String label) {
        if (ref == null) return;
        String s = ref.trim();
        if (s.isEmpty()) return;

        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        String tenantPrefix = resolveTenantPrefixForFaculty(principal, facultyId);
        if (tenantPrefix == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant scope is required for " + label.toLowerCase() + " uploads");
        }
        String expectedSegment = tenantPrefix + "/" + folder
                + (com._42students.lms.utils.PrivateDocStorage.isRef(s) ? "/faculty-" : "/user-") + facultyId + "/";
        if (!s.contains(expectedSegment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be uploaded under your tenant scope");
        }
    }

    private HttpStatus getHttpStatusForError(RuntimeException e) {
        if (e instanceof ResponseStatusException) {
            return ((ResponseStatusException) e).getStatus();
        }
        if (e instanceof ObjectOptimisticLockingFailureException) {
            return HttpStatus.CONFLICT;
        }
        if (e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")) {
            return HttpStatus.NOT_FOUND;
        }
        if (e.getMessage() != null && e.getMessage().contains("Index out of bounds")) {
            return HttpStatus.CONFLICT;
        }
        return HttpStatus.BAD_REQUEST;
    }

    private String getMessageForError(RuntimeException e) {
        if (e instanceof ResponseStatusException) {
            String reason = ((ResponseStatusException) e).getReason();
            return reason != null ? reason : "Request failed";
        }
        if (e instanceof ObjectOptimisticLockingFailureException) {
            return "Profile was updated elsewhere. Please refresh and try again.";
        }
        if (e instanceof NullPointerException) {
            // NPE messages (e.g. "Cannot invoke X because Y is null") leak internal field/method
            // names and are usually caused by a missing/malformed request body. Never echo them.
            return "Request body is missing or malformed";
        }
        return e.getMessage() != null ? e.getMessage() : "An error occurred";
    }

    // ==================== Profile Header ====================
    @GetMapping("/{facultyId}/header")
    @ApiOperation("Get faculty profile header")
    public ResponseEntity<Response<ProfileHeaderDTO>> getHeader(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            ProfileHeaderDTO result = profileService.getHeader(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty header for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/header")
    @ApiOperation("Update faculty profile header (profile image)")
    public ResponseEntity<Response<ProfileHeaderDTO>> updateHeader(
            @PathVariable Integer facultyId, @Valid @RequestBody ProfileHeaderDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            validateProfileImageRef(facultyId, dto != null ? dto.getProfileImage() : null);
            ProfileHeaderDTO result = profileService.updateHeader(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty header for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== About Me ====================
    @GetMapping("/{facultyId}/about")
    @ApiOperation("Get faculty about/bio")
    public ResponseEntity<Response<AboutDTO>> getAbout(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            AboutDTO result = profileService.getAbout(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty about for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/about")
    @ApiOperation("Update faculty about/bio")
    public ResponseEntity<Response<AboutDTO>> updateAbout(
            @PathVariable Integer facultyId, @Valid @RequestBody AboutDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            AboutDTO result = profileService.updateAbout(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty about for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Personal Details ====================
    @GetMapping("/{facultyId}/personal-details")
    @ApiOperation("Get faculty personal details")
    public ResponseEntity<Response<PersonalDetailsDTO>> getPersonalDetails(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            PersonalDetailsDTO result = profileService.getPersonalDetails(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty personal details for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/personal-details")
    @ApiOperation("Update faculty personal details")
    public ResponseEntity<Response<PersonalDetailsDTO>> updatePersonalDetails(
            @PathVariable Integer facultyId, @Valid @RequestBody PersonalDetailsDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            PersonalDetailsDTO result = profileService.updatePersonalDetails(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty personal details for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Identity Documents ====================
    @GetMapping("/{facultyId}/identity")
    @ApiOperation("Get faculty identity documents")
    public ResponseEntity<Response<IdentityDTO>> getIdentity(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            IdentityDTO result = profileService.getIdentity(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty identity for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/identity")
    @ApiOperation("Update faculty identity documents")
    public ResponseEntity<Response<IdentityDTO>> updateIdentity(
            @PathVariable Integer facultyId, @Valid @RequestBody IdentityDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            validateIdentityDocRef(facultyId, dto != null ? dto.getAadhaarUpload() : null);
            validateIdentityDocRef(facultyId, dto != null ? dto.getPanUpload() : null);
            IdentityDTO result = profileService.updateIdentity(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty identity for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Languages ====================
    @GetMapping("/{facultyId}/languages")
    @ApiOperation("Get all languages known by faculty")
    public ResponseEntity<Response<List<LanguageDTO>>> getLanguages(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<LanguageDTO> result = profileService.getLanguages(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty languages for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/languages")
    @ApiOperation("Add a new language")
    public ResponseEntity<Response<List<LanguageDTO>>> addLanguage(
            @PathVariable Integer facultyId, @Valid @RequestBody LanguageDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<LanguageDTO> result = profileService.addLanguage(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty language for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/languages/{index}")
    @ApiOperation("Update language at index")
    public ResponseEntity<Response<List<LanguageDTO>>> updateLanguage(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody LanguageDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<LanguageDTO> result = profileService.updateLanguage(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty language for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/languages/{index}")
    @ApiOperation("Delete language at index")
    public ResponseEntity<Response<List<LanguageDTO>>> deleteLanguage(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<LanguageDTO> result = profileService.deleteLanguage(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty language for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Contact Information ====================
    @GetMapping("/{facultyId}/contact")
    @ApiOperation("Get faculty contact information")
    public ResponseEntity<Response<ContactDTO>> getContact(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            ContactDTO result = profileService.getContact(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty contact for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/contact")
    @ApiOperation("Update faculty contact information")
    public ResponseEntity<Response<ContactDTO>> updateContact(
            @PathVariable Integer facultyId, @Valid @RequestBody ContactDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            ContactDTO result = profileService.updateContact(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty contact for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Address ====================
    @GetMapping("/{facultyId}/address")
    @ApiOperation("Get faculty address details")
    public ResponseEntity<Response<AddressDTO>> getAddress(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            AddressDTO result = profileService.getAddress(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty address for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/address")
    @ApiOperation("Update faculty address details")
    public ResponseEntity<Response<AddressDTO>> updateAddress(
            @PathVariable Integer facultyId, @Valid @RequestBody AddressDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            AddressDTO result = profileService.updateAddress(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty address for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Social Profiles ====================
    @GetMapping("/{facultyId}/social")
    @ApiOperation("Get faculty social profile links")
    public ResponseEntity<Response<SocialProfileDTO>> getSocialProfiles(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            SocialProfileDTO result = profileService.getSocialProfiles(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty social profiles for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/social")
    @ApiOperation("Update faculty social profile links")
    public ResponseEntity<Response<SocialProfileDTO>> updateSocialProfiles(
            @PathVariable Integer facultyId, @Valid @RequestBody SocialProfileDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            SocialProfileDTO result = profileService.updateSocialProfiles(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty social profiles for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Education ====================
    @GetMapping("/{facultyId}/education")
    @ApiOperation("Get all education records")
    public ResponseEntity<Response<List<EducationDTO>>> getEducation(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<EducationDTO> result = profileService.getEducation(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty education for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/education")
    @ApiOperation("Add a new education record")
    public ResponseEntity<Response<List<EducationDTO>>> addEducation(
            @PathVariable Integer facultyId, @Valid @RequestBody EducationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<EducationDTO> result = profileService.addEducation(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty education for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/education/{index}")
    @ApiOperation("Update education record at index")
    public ResponseEntity<Response<List<EducationDTO>>> updateEducation(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody EducationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<EducationDTO> result = profileService.updateEducation(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty education for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/education/{index}")
    @ApiOperation("Delete education record at index")
    public ResponseEntity<Response<List<EducationDTO>>> deleteEducation(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<EducationDTO> result = profileService.deleteEducation(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty education for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Certifications ====================
    @GetMapping("/{facultyId}/certifications")
    @ApiOperation("Get all certifications")
    public ResponseEntity<Response<List<CertificationDTO>>> getCertifications(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<CertificationDTO> result = profileService.getCertifications(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty certifications for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/certifications")
    @ApiOperation("Add a new certification")
    public ResponseEntity<Response<List<CertificationDTO>>> addCertification(
            @PathVariable Integer facultyId, @Valid @RequestBody CertificationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<CertificationDTO> result = profileService.addCertification(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty certification for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/certifications/{index}")
    @ApiOperation("Update certification at index")
    public ResponseEntity<Response<List<CertificationDTO>>> updateCertification(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody CertificationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<CertificationDTO> result = profileService.updateCertification(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty certification for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/certifications/{index}")
    @ApiOperation("Delete certification at index")
    public ResponseEntity<Response<List<CertificationDTO>>> deleteCertification(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<CertificationDTO> result = profileService.deleteCertification(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty certification for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Work Experience ====================
    @GetMapping("/{facultyId}/experiences")
    @ApiOperation("Get all work experiences")
    public ResponseEntity<Response<List<ExperienceDTO>>> getExperiences(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<ExperienceDTO> result = profileService.getExperiences(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty experiences for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/experiences")
    @ApiOperation("Add a new work experience")
    public ResponseEntity<Response<List<ExperienceDTO>>> addExperience(
            @PathVariable Integer facultyId, @Valid @RequestBody ExperienceDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<ExperienceDTO> result = profileService.addExperience(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty experience for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/experiences/{index}")
    @ApiOperation("Update experience at index")
    public ResponseEntity<Response<List<ExperienceDTO>>> updateExperience(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody ExperienceDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<ExperienceDTO> result = profileService.updateExperience(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty experience for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/experiences/{index}")
    @ApiOperation("Delete experience at index")
    public ResponseEntity<Response<List<ExperienceDTO>>> deleteExperience(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<ExperienceDTO> result = profileService.deleteExperience(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty experience for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Skills ====================
    @GetMapping("/{facultyId}/skills")
    @ApiOperation("Get all skills")
    public ResponseEntity<Response<List<SkillDTO>>> getSkills(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<SkillDTO> result = profileService.getSkills(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty skills for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/skills")
    @ApiOperation("Add a new skill")
    public ResponseEntity<Response<List<SkillDTO>>> addSkill(
            @PathVariable Integer facultyId, @Valid @RequestBody SkillDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<SkillDTO> result = profileService.addSkill(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty skill for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/skills/{index}")
    @ApiOperation("Update skill at index")
    public ResponseEntity<Response<List<SkillDTO>>> updateSkill(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody SkillDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<SkillDTO> result = profileService.updateSkill(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty skill for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/skills/{index}")
    @ApiOperation("Delete skill at index")
    public ResponseEntity<Response<List<SkillDTO>>> deleteSkill(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<SkillDTO> result = profileService.deleteSkill(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty skill for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Publications & Research ====================
    @GetMapping("/{facultyId}/publications")
    @ApiOperation("Get all publications and research")
    public ResponseEntity<Response<List<PublicationDTO>>> getPublications(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<PublicationDTO> result = profileService.getPublications(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty publications for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/publications")
    @ApiOperation("Add a new publication")
    public ResponseEntity<Response<List<PublicationDTO>>> addPublication(
            @PathVariable Integer facultyId, @Valid @RequestBody PublicationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<PublicationDTO> result = profileService.addPublication(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty publication for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/publications/{index}")
    @ApiOperation("Update publication at index")
    public ResponseEntity<Response<List<PublicationDTO>>> updatePublication(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody PublicationDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<PublicationDTO> result = profileService.updatePublication(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty publication for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/publications/{index}")
    @ApiOperation("Delete publication at index")
    public ResponseEntity<Response<List<PublicationDTO>>> deletePublication(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<PublicationDTO> result = profileService.deletePublication(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty publication for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Awards & Recognitions ====================
    @GetMapping("/{facultyId}/awards")
    @ApiOperation("Get all awards and recognitions")
    public ResponseEntity<Response<List<AwardDTO>>> getAwards(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<AwardDTO> result = profileService.getAwards(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty awards for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{facultyId}/awards")
    @ApiOperation("Add a new award")
    public ResponseEntity<Response<List<AwardDTO>>> addAward(
            @PathVariable Integer facultyId, @Valid @RequestBody AwardDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<AwardDTO> result = profileService.addAward(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding faculty award for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/awards/{index}")
    @ApiOperation("Update award at index")
    public ResponseEntity<Response<List<AwardDTO>>> updateAward(
            @PathVariable Integer facultyId, @PathVariable int index, @Valid @RequestBody AwardDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<AwardDTO> result = profileService.updateAward(facultyId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty award for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{facultyId}/awards/{index}")
    @ApiOperation("Delete award at index")
    public ResponseEntity<Response<List<AwardDTO>>> deleteAward(
            @PathVariable Integer facultyId, @PathVariable int index) {
        requireAccessFacultyProfile(facultyId);
        try {
            List<AwardDTO> result = profileService.deleteAward(facultyId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting faculty award for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Profile Metadata ====================
    @GetMapping("/{facultyId}/metadata")
    @ApiOperation("Get faculty profile metadata")
    public ResponseEntity<Response<MetadataDTO>> getMetadata(@PathVariable Integer facultyId) {
        requireAccessFacultyProfile(facultyId);
        try {
            MetadataDTO result = profileService.getMetadata(facultyId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting faculty metadata for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{facultyId}/metadata")
    @ApiOperation("Update faculty profile metadata")
    public ResponseEntity<Response<MetadataDTO>> updateMetadata(
            @PathVariable Integer facultyId, @Valid @RequestBody MetadataDTO dto) {
        requireAccessFacultyProfile(facultyId);
        try {
            MetadataDTO result = profileService.updateMetadata(facultyId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating faculty metadata for id {}: {}", facultyId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
}

