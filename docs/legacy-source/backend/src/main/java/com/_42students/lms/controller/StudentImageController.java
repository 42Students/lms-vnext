package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.DeactivateImageRequest;
import com._42students.lms.dto.request.StudentImageRequestDTO;
import com._42students.lms.dto.response.StudentImageResponseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.StudentImageService;
import com._42students.lms.utils.ContentUrlValidator;
import com._42students.lms.util.SecurityContextUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/v1/learner-images")
public class StudentImageController {

    private final StudentImageService studentImageService;

    @Autowired
    private AccessControlService accessControlService;

    @Autowired
    private SecurityContextUtil securityContextUtil;

    @Autowired(required = false)
    private ContentUrlValidator contentUrlValidator;

    @Autowired
    public StudentImageController(StudentImageService studentImageService) {
        this.studentImageService = studentImageService;
    }

    private static int parsePositiveInt(String raw, String field) {
        if (raw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        try {
            int v = Integer.parseInt(raw);
            if (v <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a positive integer");
            }
            return v;
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
    }

    private void requireSelfIfLearner(UserPrincipal principal, int learnerId) {
        if (principal != null && principal.isLearner() && (principal.getId() == null || principal.getId() != learnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private void validateImageRefs(int learnerId, StudentImageRequestDTO requestDTO) {
        if (requestDTO == null || requestDTO.getImageUrls() == null) return;
        for (String ref : requestDTO.getImageUrls()) {
            if (ref == null || ref.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "imageUrls cannot contain empty values");
            }
            String v = ref.trim();
            // Prefer storing public URL (not presigned) or a storage key; both must belong to the learner's profile-images folder.
            String key;
            if (v.contains("://")) {
                if (contentUrlValidator == null || !contentUrlValidator.isAllowedContentUrl(v)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image URL is not from allowed storage");
                }
                String withoutQuery = v.contains("?") ? v.substring(0, v.indexOf('?')) : v;
                key = contentUrlValidator.urlToKey(withoutQuery);
                if (key == null || key.trim().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image URL is not from allowed storage");
                }
            } else {
                if (v.contains("..") || v.contains("?") || v.contains("#") || v.contains("://")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image reference");
                }
                key = v;
            }
            String expectedSegment = "/profile-images/user-" + learnerId + "/";
            if (!key.contains(expectedSegment)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be uploaded under your profile-images folder");
            }
        }
    }

    @PostMapping("/create")
    public ResponseEntity createStudentImage(@Valid @RequestBody StudentImageRequestDTO requestDTO) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null));
        }
        try {
            int learnerId = parsePositiveInt(requestDTO.getLearnerId(), "learnerId");
            requireSelfIfLearner(principal, learnerId);
            accessControlService.requireAccessLearner(principal, learnerId);
            validateImageRefs(learnerId, requestDTO);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatus())
                    .body(new Response(e.getStatus().toString(), e.getReason(), null));
        }
        StudentImageResponseDTO responseDTO = studentImageService.createStudentImages(requestDTO);
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/getImageDataByLearnerId")
    public ResponseEntity getStudentImagesByLearnerId(@RequestParam String learnerId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null));
        }
        try {
            int id = parsePositiveInt(learnerId, "learnerId");
            requireSelfIfLearner(principal, id);
            accessControlService.requireAccessLearner(principal, id);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatus())
                    .body(new Response(e.getStatus().toString(), e.getReason(), null));
        }
        StudentImageResponseDTO responseDTO = studentImageService.fetchStudentImagesByLearnerId(learnerId);
        if (responseDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(responseDTO);
    }

    @PatchMapping("/deactivateImageByImageIdAndLearnerId")
    public ResponseEntity deactivateImage(@Valid @RequestBody DeactivateImageRequest request) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null));
        }
        try {
            int learnerId = parsePositiveInt(request.getLearnerId(), "learnerId");
            requireSelfIfLearner(principal, learnerId);
            accessControlService.requireAccessLearner(principal, learnerId);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatus())
                    .body(new Response(e.getStatus().toString(), e.getReason(), null));
        }
        boolean deactivated = studentImageService.deactivateImage(request.getLearnerId(), request.getImageId());
        if (deactivated) {
            return ResponseEntity.ok("Image deactivated successfully.");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

