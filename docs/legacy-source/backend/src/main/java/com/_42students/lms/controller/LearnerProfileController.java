package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.profile.*;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.LearnerProfileService;
import com._42students.lms.util.SecurityContextUtil;
import com._42students.lms.utils.ContentUrlValidator;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import javax.validation.Valid;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/profile/learner")
@Slf4j
@Api(tags = "Learner Profile APIs")
public class LearnerProfileController {

    @Autowired
    private LearnerProfileService profileService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired(required = false)
    private ScopeResolutionService scopeResolutionService;

    @Autowired(required = false)
    private ContentUrlValidator contentUrlValidator;

    @Autowired(required = false)
    private com._42students.lms.repository.FacultyTeachingAssignmentRepository facultyTeachingAssignmentRepository;

    @Autowired(required = false)
    private com._42students.lms.service.AdminAuditLogService auditLogService;

    @Autowired(required = false)
    private javax.servlet.http.HttpServletRequest httpServletRequest;

    private static void requireValidUserId(Integer id, String field) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a positive integer");
        }
    }

    /** Enforce learner self for learners, or canAccessLearner for faculty/admin. */
    private void requireAccessLearner(Integer learnerId) {
        requireValidUserId(learnerId, "learnerId");
        if (securityContextUtil == null || accessControlService == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profile access not configured");
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && !Objects.equals(principal.getId(), learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        accessControlService.requireAccessLearner(principal, learnerId);
        requireFacultyTeachesLearner(principal, learnerId);
    }

    /**
     * A plain (non-admin) faculty member may only reach a learner's profile if they actually teach
     * that learner's class.
     *
     * <p>{@code accessControlService.requireAccessLearner} reduces to a bare college match for any
     * FACULTY principal, so on its own it let every teacher and mentor in the college read — and,
     * via requireWriteAccessLearner, overwrite — any student's personal details, contact, address
     * and identity. Mirrors the AT-16 teaching-assignment rule already applied to attendance.
     */
    private void requireFacultyTeachesLearner(UserPrincipal principal, Integer learnerId) {
        if (principal == null) return;
        if (!"FACULTY".equalsIgnoreCase(principal.getUserType())) return;
        if (accessControlService.isSuperAdmin(principal)) return;
        if ("ADMIN".equalsIgnoreCase(principal.getFacultyType())) return;
        if (Objects.equals(principal.getId(), learnerId)) return;
        if (facultyTeachingAssignmentRepository == null || scopeResolutionService == null
                || principal.getId() == null) {
            return;
        }
        Integer learnerClassId = scopeResolutionService.resolveLearnerToClassId(learnerId);
        if (learnerClassId == null) return;
        boolean teaches = facultyTeachingAssignmentRepository
                .findByFacultyIdAndIsActive(principal.getId(), true)
                .stream()
                .anyMatch(a -> learnerClassId.equals(a.getClassId()));
        if (!teaches) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not assigned to teach any course in this learner's class");
        }
    }

    /**
     * Identity (Aadhaar / PAN and their scans) is restricted further than the rest of the profile:
     * the learner themselves, a college admin, or a super-admin. Teaching a student is not a
     * reason to see their national ID or financial ID.
     */
    private void requireIdentityAccess(Integer learnerId) {
        requireAccessLearner(learnerId);
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (principal.isLearner() && Objects.equals(principal.getId(), learnerId)) return;
        if (accessControlService.isSuperAdmin(principal)) return;
        if ("FACULTY".equalsIgnoreCase(principal.getUserType())
                && "ADMIN".equalsIgnoreCase(principal.getFacultyType())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Identity documents are restricted to the learner and college administrators");
    }

    /**
     * Aadhaar/PAN are returned in full only to the learner who owns them. Everyone else who is
     * entitled to view identity at all (college admins, super-admins) gets a masked value — enough
     * to confirm a document is on file, not enough to reuse the number elsewhere.
     */
    private IdentityDTO maskIdentityUnlessOwner(Integer learnerId, IdentityDTO dto) {
        if (dto == null) return null;
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        boolean isOwner = principal != null && principal.isLearner()
                && Objects.equals(principal.getId(), learnerId);
        if (isOwner) return dto;
        IdentityDTO masked = new IdentityDTO();
        masked.setAadhaarNumber(maskTail(dto.getAadhaarNumber()));
        masked.setPanNumber(maskTail(dto.getPanNumber()));
        masked.setAadhaarUpload(dto.getAadhaarUpload());
        masked.setPanUpload(dto.getPanUpload());
        return masked;
    }

    /** Keeps the last 4 characters, masks the rest. Null/blank stays null/blank. */
    private static String maskTail(String value) {
        if (value == null) return null;
        String s = value.trim();
        if (s.isEmpty()) return s;
        if (s.length() <= 4) return "*".repeat(s.length());
        return "*".repeat(s.length() - 4) + s.substring(s.length() - 4);
    }

    /** Best-effort audit; never breaks the request. */
    private void auditProfile(String actionKey, Integer learnerId, java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        try {
            Integer collegeId = null;
            if (scopeResolutionService != null) {
                collegeId = scopeResolutionService.resolveLearnerToCollegeId(learnerId);
            }
            auditLogService.log(httpServletRequest, actionKey, "learner_profile",
                    String.valueOf(learnerId), null, collegeId,
                    payload != null ? payload : java.util.Map.of());
        } catch (Exception e) {
            log.debug("Profile audit failed for learner {}: {}", learnerId, e.getMessage());
        }
    }

    /**
     * For write (PUT/POST/DELETE) endpoints: enforces requireAccessLearner and additionally
     * blocks a learner from writing to another learner's profile (self-ownership check).
     * Throws ResponseStatusException(403) if the learner attempts to write to another learner's profile.
     */
    private void requireWriteAccessLearner(Integer learnerId) {
        requireAccessLearner(learnerId);
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal != null && principal.isLearner() && !Objects.equals(principal.getId(), learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        // Someone editing a profile that is not their own is the case worth recording. Logged
        // centrally here so every current and future write endpoint is covered by construction,
        // rather than relying on 36 individual call sites each remembering to do it.
        if (principal != null && !Objects.equals(principal.getId(), learnerId)) {
            auditProfile("LEARNER_PROFILE_WRITE_BY_OTHER", learnerId,
                    java.util.Map.of("actorUserType", String.valueOf(principal.getUserType()),
                            "actorFacultyType", String.valueOf(principal.getFacultyType())));
        }
    }

    private String resolveTenantPrefixForLearner(UserPrincipal principal, Integer learnerId) {
        if (principal == null) return null;
        Integer collegeId = principal.getCollegeId();
        Integer organizationId = principal.getOrganizationId();
        if (scopeResolutionService != null && (collegeId == null || organizationId == null)) {
            ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learnerId);
            if (scope != null) {
                if (collegeId == null) collegeId = scope.getCollegeId();
                if (organizationId == null) organizationId = scope.getOrganizationId();
            }
        }
        if (collegeId == null || organizationId == null) return null;
        return "org-" + organizationId + "/college-" + collegeId;
    }

    /** Aadhaar: 12 digits (spaces/hyphens tolerated). PAN: 5 letters, 4 digits, 1 letter. */
    private static final java.util.regex.Pattern AADHAAR_PATTERN =
            java.util.regex.Pattern.compile("^[0-9]{12}$");
    private static final java.util.regex.Pattern PAN_PATTERN =
            java.util.regex.Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");

    /**
     * Neither number was validated at all before — any string of any shape was stored, bounded
     * only by the identity blob's size cap, so typos and junk were persisted as though they were
     * real government identifiers and only discovered downstream.
     */
    private void validateIdentityNumbers(IdentityDTO dto) {
        if (dto == null) return;
        String aadhaar = dto.getAadhaarNumber();
        if (aadhaar != null && !aadhaar.isBlank()) {
            String normalized = aadhaar.replaceAll("[\\s-]", "");
            if (!AADHAAR_PATTERN.matcher(normalized).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Aadhaar number must be 12 digits");
            }
            dto.setAadhaarNumber(normalized);
        }
        String pan = dto.getPanNumber();
        if (pan != null && !pan.isBlank()) {
            String normalized = pan.trim().toUpperCase();
            if (!PAN_PATTERN.matcher(normalized).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F)");
            }
            dto.setPanNumber(normalized);
        }
    }

    private void validateIdentityDocRef(Integer learnerId, String ref) {
        validateOwnedStorageRef(learnerId, ref, "identity-docs", "Identity document");
    }

    private void validateProfileImageRef(Integer learnerId, String ref) {
        validateOwnedStorageRef(learnerId, ref, "profile-images", "Profile image");
    }

    private void validateVideoIntroRef(Integer learnerId, String ref) {
        validateOwnedStorageRef(learnerId, ref, "video-intros", "Video intro");
    }

    private void validateResumeRef(Integer learnerId, String ref) {
        validateOwnedStorageRef(learnerId, ref, "resumes", "Resume");
    }

    private void validateOwnedStorageRef(Integer learnerId, String ref, String folder, String label) {
        if (ref == null) return;
        String s = ref.trim();
        if (s.isEmpty()) return;

        // Identity documents and marksheets are stored in the private bucket as private-doc:<key> (PrivateDocStorage).
        boolean privateRef = com._42students.lms.utils.PrivateDocStorage.isRef(s);
        if (privateRef && !"identity-docs".equals(folder) && !"marksheets".equals(folder)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " URL must use HTTPS.");
        }
        if (!privateRef && !s.startsWith("https://")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " URL must use HTTPS.");
        }
        if (!privateRef && contentUrlValidator != null
                && !contentUrlValidator.isAllowedContentUrl(s)
                && !contentUrlValidator.isAllowedStorageKey(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " URL or storage key is not allowed.");
        }

        UserPrincipal principal = securityContextUtil != null ? securityContextUtil.getAuthenticatedUserPrincipal() : null;
        String tenantPrefix = resolveTenantPrefixForLearner(principal, learnerId);
        if (tenantPrefix == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant scope is required for " + label.toLowerCase() + " uploads");
        }
        String expectedSegment = tenantPrefix + "/" + folder + "/user-" + learnerId + "/";
        if (!s.contains(expectedSegment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be uploaded under your tenant scope");
        }
    }

    /** Message used by profile services for index-out-of-bounds; controller maps to 409. */
    public static final String INDEX_OUT_OF_BOUNDS_MSG = "Index out of bounds. Please refresh and try again.";

    /**
     * Helper method to determine appropriate HTTP status based on error message
     * Returns 404 for "not found", 409 for index out of bounds, 400 for other errors.
     */
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
    @GetMapping("/{learnerId}/header")
    @ApiOperation("Get learner profile header")
    public ResponseEntity<Response<ProfileHeaderDTO>> getHeader(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            ProfileHeaderDTO result = profileService.getHeader(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner header for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/header")
    @ApiOperation("Update learner profile header (profile image)")
    @Transactional
    public ResponseEntity<Response<ProfileHeaderDTO>> updateHeader(
            @PathVariable Integer learnerId, @Valid @RequestBody ProfileHeaderDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            validateProfileImageRef(learnerId, dto != null ? dto.getProfileImage() : null);
            ProfileHeaderDTO result = profileService.updateHeader(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner header for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== About Me ====================
    @GetMapping("/{learnerId}/about")
    @ApiOperation("Get learner about/bio")
    public ResponseEntity<Response<AboutDTO>> getAbout(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            AboutDTO result = profileService.getAbout(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner about for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/about")
    @ApiOperation("Update learner about/bio")
    @Transactional
    public ResponseEntity<Response<AboutDTO>> updateAbout(
            @PathVariable Integer learnerId, @Valid @RequestBody AboutDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            AboutDTO result = profileService.updateAbout(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner about for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Personal Details ====================
    @GetMapping("/{learnerId}/personal-details")
    @ApiOperation("Get learner personal details")
    public ResponseEntity<Response<PersonalDetailsDTO>> getPersonalDetails(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            PersonalDetailsDTO result = profileService.getPersonalDetails(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner personal details for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/personal-details")
    @ApiOperation("Update learner personal details")
    @Transactional
    public ResponseEntity<Response<PersonalDetailsDTO>> updatePersonalDetails(
            @PathVariable Integer learnerId, @Valid @RequestBody PersonalDetailsDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            PersonalDetailsDTO result = profileService.updatePersonalDetails(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner personal details for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Identity Documents ====================
    @GetMapping("/{learnerId}/identity")
    @ApiOperation("Get learner identity documents")
    public ResponseEntity<Response<IdentityDTO>> getIdentity(@PathVariable Integer learnerId) {
        requireIdentityAccess(learnerId);
        try {
            IdentityDTO result = maskIdentityUnlessOwner(learnerId, profileService.getIdentity(learnerId));
            // Reading someone else's national/financial ID is exactly the access that must leave a
            // trace; self-reads are noise and are not logged.
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            if (principal != null && !(principal.isLearner() && Objects.equals(principal.getId(), learnerId))) {
                auditProfile("LEARNER_IDENTITY_READ", learnerId, java.util.Map.of("masked", true));
            }
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner identity for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/identity")
    @ApiOperation("Update learner identity documents")
    @Transactional
    public ResponseEntity<Response<IdentityDTO>> updateIdentity(
            @PathVariable Integer learnerId, @Valid @RequestBody IdentityDTO dto) {
        requireIdentityAccess(learnerId);
        try {
            validateIdentityNumbers(dto);
            validateIdentityDocRef(learnerId, dto != null ? dto.getAadhaarUpload() : null);
            validateIdentityDocRef(learnerId, dto != null ? dto.getPanUpload() : null);
            IdentityDTO result = maskIdentityUnlessOwner(learnerId, profileService.updateIdentity(learnerId, dto));
            auditProfile("LEARNER_IDENTITY_UPDATE", learnerId, java.util.Map.of());
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner identity for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Languages ====================
    @GetMapping("/{learnerId}/languages")
    @ApiOperation("Get all languages known by learner")
    public ResponseEntity<Response<List<LanguageDTO>>> getLanguages(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<LanguageDTO> result = profileService.getLanguages(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner languages for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/languages")
    @ApiOperation("Add a new language")
    @Transactional
    public ResponseEntity<Response<List<LanguageDTO>>> addLanguage(
            @PathVariable Integer learnerId, @Valid @RequestBody LanguageDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<LanguageDTO> result = profileService.addLanguage(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner language for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/languages/{index}")
    @ApiOperation("Update language at index")
    @Transactional
    public ResponseEntity<Response<List<LanguageDTO>>> updateLanguage(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody LanguageDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<LanguageDTO> result = profileService.updateLanguage(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner language for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/languages/{index}")
    @ApiOperation("Delete language at index")
    @Transactional
    public ResponseEntity<Response<List<LanguageDTO>>> deleteLanguage(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<LanguageDTO> result = profileService.deleteLanguage(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner language for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Contact Information ====================
    @GetMapping("/{learnerId}/contact")
    @ApiOperation("Get learner contact information")
    public ResponseEntity<Response<ContactDTO>> getContact(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            ContactDTO result = profileService.getContact(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner contact for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/contact")
    @ApiOperation("Update learner contact information")
    @Transactional
    public ResponseEntity<Response<ContactDTO>> updateContact(
            @PathVariable Integer learnerId, @Valid @RequestBody ContactDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            ContactDTO result = profileService.updateContact(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner contact for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Address ====================
    @GetMapping("/{learnerId}/address")
    @ApiOperation("Get learner address details")
    public ResponseEntity<Response<AddressDTO>> getAddress(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            AddressDTO result = profileService.getAddress(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner address for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/address")
    @ApiOperation("Update learner address details")
    @Transactional
    public ResponseEntity<Response<AddressDTO>> updateAddress(
            @PathVariable Integer learnerId, @Valid @RequestBody AddressDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            AddressDTO result = profileService.updateAddress(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner address for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Social Profiles ====================
    @GetMapping("/{learnerId}/social")
    @ApiOperation("Get learner social profile links")
    public ResponseEntity<Response<SocialProfileDTO>> getSocialProfiles(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            SocialProfileDTO result = profileService.getSocialProfiles(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner social profiles for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/social")
    @ApiOperation("Update learner social profile links")
    @Transactional
    public ResponseEntity<Response<SocialProfileDTO>> updateSocialProfiles(
            @PathVariable Integer learnerId, @Valid @RequestBody SocialProfileDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            SocialProfileDTO result = profileService.updateSocialProfiles(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner social profiles for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Education ====================
    @GetMapping("/education/config")
    @ApiOperation("Get education configuration (types, programs, specializations)")
    public ResponseEntity<Response<EducationConfigDTO>> getEducationConfig() {
        try {
            EducationConfigDTO result = ((com._42students.lms.service.impl.LearnerProfileServiceImpl) profileService).getEducationConfig();
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting education config: {}", e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
    
    @GetMapping("/education/exam-configs")
    @ApiOperation("Get all qualifying exam configurations")
    public ResponseEntity<Response<List<com._42students.lms.dto.profile.ExamConfig>>> getExamConfigs() {
        try {
            List<com._42students.lms.dto.profile.ExamConfig> result = 
                com._42students.lms.util.QualifyingExamConfigUtil.getAllExamConfigs();
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting exam configs: {}", e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
    
    @GetMapping("/education/exam-configs/{examCode}")
    @ApiOperation("Get exam configuration for a specific exam")
    public ResponseEntity<Response<com._42students.lms.dto.profile.ExamConfig>> getExamConfig(
            @PathVariable String examCode) {
        try {
            com._42students.lms.dto.profile.ExamConfig result = 
                com._42students.lms.util.QualifyingExamConfigUtil.getExamConfig(examCode);
            if (result == null) {
                return new ResponseEntity<>(new Response<>("error", "Exam config not found for: " + examCode, null), 
                    HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting exam config for {}: {}", examCode, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
    
    @GetMapping("/education/grading-types")
    @ApiOperation("Get available grading types")
    public ResponseEntity<Response<String[]>> getGradingTypes() {
        try {
            String[] result = ((com._42students.lms.service.impl.LearnerProfileServiceImpl) profileService).getGradingTypes();
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting grading types: {}", e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
    
    @GetMapping("/education/colleges")
    @ApiOperation("Get colleges for institution name autocomplete")
    public ResponseEntity<Response<List<String>>> getColleges(@RequestParam(required = false) String search) {
        try {
            List<String> result = ((com._42students.lms.service.impl.LearnerProfileServiceImpl) profileService).getColleges(search);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting colleges: {}", e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
    
    @GetMapping("/{learnerId}/education")
    @ApiOperation("Get all education records (sorted: recent first, then by start year)")
    public ResponseEntity<Response<List<EducationDTO>>> getEducation(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<EducationDTO> result = profileService.getEducation(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner education for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/education")
    @ApiOperation("Add a new education record")
    @Transactional
    public ResponseEntity<Response<List<EducationDTO>>> addEducation(
            @PathVariable Integer learnerId, @Valid @RequestBody EducationDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<EducationDTO> result = profileService.addEducation(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner education for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/education/{index}")
    @ApiOperation("Update education record at index")
    @Transactional
    public ResponseEntity<Response<List<EducationDTO>>> updateEducation(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody EducationDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<EducationDTO> result = profileService.updateEducation(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner education for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/education/{index}")
    @ApiOperation("Delete education record at index")
    @Transactional
    public ResponseEntity<Response<List<EducationDTO>>> deleteEducation(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<EducationDTO> result = profileService.deleteEducation(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner education for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Certifications ====================
    @GetMapping("/{learnerId}/certifications")
    @ApiOperation("Get all certifications")
    public ResponseEntity<Response<List<CertificationDTO>>> getCertifications(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<CertificationDTO> result = profileService.getCertifications(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner certifications for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/certifications")
    @ApiOperation("Add a new certification")
    @Transactional
    public ResponseEntity<Response<List<CertificationDTO>>> addCertification(
            @PathVariable Integer learnerId, @Valid @RequestBody CertificationDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<CertificationDTO> result = profileService.addCertification(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner certification for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/certifications/{index}")
    @ApiOperation("Update certification at index")
    @Transactional
    public ResponseEntity<Response<List<CertificationDTO>>> updateCertification(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody CertificationDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<CertificationDTO> result = profileService.updateCertification(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner certification for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/certifications/{index}")
    @ApiOperation("Delete certification at index")
    @Transactional
    public ResponseEntity<Response<List<CertificationDTO>>> deleteCertification(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<CertificationDTO> result = profileService.deleteCertification(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner certification for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Academic Achievements ====================
    @GetMapping("/{learnerId}/achievements")
    @ApiOperation("Get all academic achievements")
    public ResponseEntity<Response<List<AchievementDTO>>> getAchievements(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<AchievementDTO> result = profileService.getAchievements(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner achievements for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/achievements")
    @ApiOperation("Add a new academic achievement")
    @Transactional
    public ResponseEntity<Response<List<AchievementDTO>>> addAchievement(
            @PathVariable Integer learnerId, @Valid @RequestBody AchievementDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<AchievementDTO> result = profileService.addAchievement(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner achievement for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/achievements/{index}")
    @ApiOperation("Update achievement at index")
    @Transactional
    public ResponseEntity<Response<List<AchievementDTO>>> updateAchievement(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody AchievementDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<AchievementDTO> result = profileService.updateAchievement(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner achievement for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/achievements/{index}")
    @ApiOperation("Delete achievement at index")
    @Transactional
    public ResponseEntity<Response<List<AchievementDTO>>> deleteAchievement(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<AchievementDTO> result = profileService.deleteAchievement(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner achievement for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Skills ====================
    @GetMapping("/{learnerId}/skills")
    @ApiOperation("Get all skills")
    public ResponseEntity<Response<List<SkillDTO>>> getSkills(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<SkillDTO> result = profileService.getSkills(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner skills for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/skills")
    @ApiOperation("Add a new skill")
    @Transactional
    public ResponseEntity<Response<List<SkillDTO>>> addSkill(
            @PathVariable Integer learnerId, @Valid @RequestBody SkillDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<SkillDTO> result = profileService.addSkill(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner skill for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/skills/{index}")
    @ApiOperation("Update skill at index")
    @Transactional
    public ResponseEntity<Response<List<SkillDTO>>> updateSkill(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody SkillDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<SkillDTO> result = profileService.updateSkill(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner skill for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/skills/{index}")
    @ApiOperation("Delete skill at index")
    @Transactional
    public ResponseEntity<Response<List<SkillDTO>>> deleteSkill(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<SkillDTO> result = profileService.deleteSkill(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner skill for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Projects ====================
    @GetMapping("/{learnerId}/projects")
    @ApiOperation("Get all projects")
    public ResponseEntity<Response<List<ProjectDTO>>> getProjects(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<ProjectDTO> result = profileService.getProjects(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner projects for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/projects")
    @ApiOperation("Add a new project")
    @Transactional
    public ResponseEntity<Response<List<ProjectDTO>>> addProject(
            @PathVariable Integer learnerId, @Valid @RequestBody ProjectDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ProjectDTO> result = profileService.addProject(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner project for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/projects/{index}")
    @ApiOperation("Update project at index")
    @Transactional
    public ResponseEntity<Response<List<ProjectDTO>>> updateProject(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody ProjectDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ProjectDTO> result = profileService.updateProject(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner project for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/projects/{index}")
    @ApiOperation("Delete project at index")
    @Transactional
    public ResponseEntity<Response<List<ProjectDTO>>> deleteProject(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ProjectDTO> result = profileService.deleteProject(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner project for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Experiences/Internships ====================
    @GetMapping("/{learnerId}/experiences")
    @ApiOperation("Get all experiences/internships")
    public ResponseEntity<Response<List<ExperienceDTO>>> getExperiences(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<ExperienceDTO> result = profileService.getExperiences(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner experiences for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/experiences")
    @ApiOperation("Add a new experience/internship")
    @Transactional
    public ResponseEntity<Response<List<ExperienceDTO>>> addExperience(
            @PathVariable Integer learnerId, @RequestBody @Valid ExperienceDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExperienceDTO> result = profileService.addExperience(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner experience for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/experiences/{index}")
    @ApiOperation("Update experience at index")
    @Transactional
    public ResponseEntity<Response<List<ExperienceDTO>>> updateExperience(
            @PathVariable Integer learnerId, @PathVariable int index, @RequestBody @Valid ExperienceDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExperienceDTO> result = profileService.updateExperience(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner experience for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/experiences/{index}")
    @ApiOperation("Delete experience at index")
    @Transactional
    public ResponseEntity<Response<List<ExperienceDTO>>> deleteExperience(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExperienceDTO> result = profileService.deleteExperience(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner experience for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Extra-curricular ====================
    @GetMapping("/{learnerId}/extracurricular")
    @ApiOperation("Get all extra-curricular activities")
    public ResponseEntity<Response<List<ExtracurricularDTO>>> getExtracurricular(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<ExtracurricularDTO> result = profileService.getExtracurricular(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner extracurricular for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PostMapping("/{learnerId}/extracurricular")
    @ApiOperation("Add a new extra-curricular activity")
    @Transactional
    public ResponseEntity<Response<List<ExtracurricularDTO>>> addExtracurricular(
            @PathVariable Integer learnerId, @Valid @RequestBody ExtracurricularDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExtracurricularDTO> result = profileService.addExtracurricular(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Added successfully", result), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Error adding learner extracurricular for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/extracurricular/{index}")
    @ApiOperation("Update extra-curricular activity at index")
    @Transactional
    public ResponseEntity<Response<List<ExtracurricularDTO>>> updateExtracurricular(
            @PathVariable Integer learnerId, @PathVariable int index, @Valid @RequestBody ExtracurricularDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExtracurricularDTO> result = profileService.updateExtracurricular(learnerId, index, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner extracurricular for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @DeleteMapping("/{learnerId}/extracurricular/{index}")
    @ApiOperation("Delete extra-curricular activity at index")
    @Transactional
    public ResponseEntity<Response<List<ExtracurricularDTO>>> deleteExtracurricular(
            @PathVariable Integer learnerId, @PathVariable int index) {
        requireWriteAccessLearner(learnerId);
        try {
            List<ExtracurricularDTO> result = profileService.deleteExtracurricular(learnerId, index);
            return new ResponseEntity<>(new Response<>("success", "Deleted successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error deleting learner extracurricular for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Hobbies & Interests ====================
    @GetMapping("/{learnerId}/hobbies")
    @ApiOperation("Get all hobbies and interests")
    public ResponseEntity<Response<List<HobbyDTO>>> getHobbies(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            List<HobbyDTO> result = profileService.getHobbies(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner hobbies for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/hobbies")
    @ApiOperation("Update hobbies list")
    @Transactional
    public ResponseEntity<Response<List<HobbyDTO>>> updateHobbies(
            @PathVariable Integer learnerId, @Valid @RequestBody List<HobbyDTO> hobbies) {
        requireWriteAccessLearner(learnerId);
        try {
            List<HobbyDTO> result = profileService.updateHobbies(learnerId, hobbies);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner hobbies for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Video Intro ====================
    @GetMapping("/{learnerId}/video-intro")
    @ApiOperation("Get learner video intro")
    public ResponseEntity<Response<VideoIntroDTO>> getVideoIntro(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            VideoIntroDTO result = profileService.getVideoIntro(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            HttpStatus status = getHttpStatusForError(e);
            if (status == HttpStatus.NOT_FOUND) {
                log.warn("Learner not found: {}", learnerId);
            } else {
                log.error("Error getting learner video intro for id {}: {}", learnerId, e.getMessage());
            }
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), status);
        }
    }

    // /{learnerId}/video-intro/playback-url removed: video intro now stores a plain public URL
    // returned directly by getVideoIntro above — see LearnerProfileServiceImpl for the reasoning.

    @PutMapping("/{learnerId}/video-intro")
    @ApiOperation("Update learner video intro (one-time only)")
    @Transactional
    public ResponseEntity<Response<VideoIntroDTO>> updateVideoIntro(
            @PathVariable Integer learnerId, @Valid @RequestBody VideoIntroDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            validateVideoIntroRef(learnerId, dto != null ? dto.getVideoIntroUrl() : null);
            VideoIntroDTO result = profileService.updateVideoIntro(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner video intro for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Profile Metadata ====================
    @GetMapping("/{learnerId}/metadata")
    @ApiOperation("Get learner profile metadata")
    public ResponseEntity<Response<MetadataDTO>> getMetadata(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            MetadataDTO result = profileService.getMetadata(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner metadata for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/metadata")
    @ApiOperation("Update learner profile metadata")
    @Transactional
    public ResponseEntity<Response<MetadataDTO>> updateMetadata(
            @PathVariable Integer learnerId, @Valid @RequestBody MetadataDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            MetadataDTO result = profileService.updateMetadata(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner metadata for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Job Preferences ====================
    @GetMapping("/{learnerId}/job-preferences")
    @ApiOperation("Get job preferences")
    public ResponseEntity<Response<JobPreferencesDTO>> getJobPreferences(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            JobPreferencesDTO result = profileService.getJobPreferences(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner job preferences for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/job-preferences")
    @ApiOperation("Update job preferences")
    @Transactional
    public ResponseEntity<Response<JobPreferencesDTO>> updateJobPreferences(
            @PathVariable Integer learnerId, @Valid @RequestBody JobPreferencesDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            JobPreferencesDTO result = profileService.updateJobPreferences(learnerId, dto);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner job preferences for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    // ==================== Profile Resume ====================
    // /{learnerId}/resume/playback-url removed: getResume below already returned the raw stored
    // URL unnulled, so this presigned endpoint was pure redundant overhead — see
    // LearnerProfileServiceImpl for the reasoning.

    @GetMapping("/{learnerId}/resume")
    @ApiOperation("Get learner profile resume URL")
    public ResponseEntity<Response<ResumeUrlDTO>> getResume(@PathVariable Integer learnerId) {
        requireAccessLearner(learnerId);
        try {
            ResumeUrlDTO result = profileService.getResume(learnerId);
            return new ResponseEntity<>(new Response<>("success", "Success", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error getting learner resume for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }

    @PutMapping("/{learnerId}/resume")
    @ApiOperation("Update learner profile resume URL (default resume for job applications)")
    @Transactional
    public ResponseEntity<Response<ResumeUrlDTO>> updateResume(
            @PathVariable Integer learnerId, @Valid @RequestBody ResumeUrlDTO dto) {
        requireWriteAccessLearner(learnerId);
        try {
            String url = dto != null ? dto.getResumeUrl() : null;
            validateResumeRef(learnerId, url);
            ResumeUrlDTO result = profileService.updateResume(learnerId, url);
            return new ResponseEntity<>(new Response<>("success", "Updated successfully", result), HttpStatus.OK);
        } catch (RuntimeException e) {
            log.error("Error updating learner resume for id {}: {}", learnerId, e.getMessage());
            return new ResponseEntity<>(new Response<>("error", getMessageForError(e), null), getHttpStatusForError(e));
        }
    }
}

