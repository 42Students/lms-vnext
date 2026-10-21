package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.CourseDTO;
import com._42students.lms.dto.response.PublicCourseDTO;
import com._42students.lms.dto.response.Response;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.CourseService;
import com._42students.lms.util.CourseSlugResolver;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
@Slf4j
@Validated
public class CourseController extends BaseController{

    @Autowired
    CourseService courseService;

    @Autowired
    AccessControlService accessControlService;

    @Autowired
    SecurityContextUtil securityContextUtil;

    @Autowired
    CourseSlugResolver courseSlugResolver;

    @Autowired(required = false)
    ScopeResolutionService scopeResolutionService;

    // Destructive course operations previously wrote no audit record at all, unlike the
    // placements, projects and user-lifecycle surfaces. "Who deleted this course?" was
    // unanswerable from the product.
    @Autowired(required = false)
    com._42students.lms.service.AdminAuditLogService auditLogService;

    private void audit(javax.servlet.http.HttpServletRequest request, String actionKey, Integer courseId,
                       Integer collegeId, java.util.Map<String, Object> payload) {
        if (auditLogService == null) return;
        auditLogService.log(request, actionKey, "course", String.valueOf(courseId), null, collegeId,
                payload != null ? payload : java.util.Map.of());
    }

    // 6.4: no controller-level @Transactional here -- courseService.createCourse already carries
    // its own transaction boundary (rollbackFor = Exception.class). The controller-level
    // annotation was redundant and additionally wrapped the access-control checks AND HTTP
    // response serialisation inside the DB transaction, holding the connection open longer than
    // the actual write needs and interacting badly with the slug-retry logic's own transaction
    // semantics (see CourseServiceImpl#createCourse).
    @RequestMapping(value = "/create", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Create a course for a department", notes = "")
    public ResponseEntity createCourse(@Valid @RequestBody CourseDTO courseDTO)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        Integer deptId = courseDTO.getDeptId();
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveDepartmentToCollegeId(deptId) : null;
        // Safety: scoped superadmin must not mutate outside JWT scope
        if (principal != null && accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create courses in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only create courses within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessDepartment(principal, deptId);
        // canAccessDepartment reduces to a bare college match with no role test, so this alone
        // would let any faculty account (and, before the WebSecurityConfig gate, any learner)
        // create courses anywhere in the college. Course creation is an admin action — the only
        // UI for it is the admin console's Courses screen.
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        com._42students.lms.model.Course course = courseService.createCourse(courseDTO);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),course), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetch", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all courses for a department", notes = "")
    public ResponseEntity fetchCourses(@RequestParam int deptId)
            throws Exception {
        accessControlService.requireAccessDepartment(securityContextUtil.getAuthenticatedUserPrincipal(), deptId);
        List<com._42students.lms.model.Course> courses = courseService.fetchCourses(deptId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),courses), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchAll", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all courses (super-admin only)", notes = "Returns all courses across all colleges. Super-admin only; others should use fetchByCollege or fetch.")
    public ResponseEntity fetchAllCourses() {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (!accessControlService.isSuperAdmin(principal)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Forbidden", null), HttpStatus.FORBIDDEN);
        }
        Integer scopedCollegeId = principal.getCollegeId();
        Integer scopedOrgId = principal.getOrganizationId();
        List<com._42students.lms.model.Course> courses;
        if (scopedCollegeId != null) {
            courses = courseService.fetchByCollegeId(scopedCollegeId);
        } else if (scopedOrgId != null) {
            courses = courseService.fetchByOrganizationId(scopedOrgId);
        } else {
            courses = courseService.findAll();
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), courses), HttpStatus.OK);
    }

    // 6.5: additive paginated variant of fetchAll, for the unscoped (whole-platform) case -- the
    // one fetchAll could previously pull every course on the platform in a single response.
    @RequestMapping(value = "/fetchAllPaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch all courses (super-admin only), paginated", notes = "Same scope as fetchAll; returns a PageResponseDTO instead of a plain array.")
    public ResponseEntity fetchAllCoursesPaged(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (!accessControlService.isSuperAdmin(principal)) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Forbidden", null), HttpStatus.FORBIDDEN);
        }
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Integer scopedCollegeId = principal.getCollegeId();
        Integer scopedOrgId = principal.getOrganizationId();
        org.springframework.data.domain.Page<com._42students.lms.model.Course> result;
        if (scopedCollegeId != null) {
            result = courseService.fetchByCollegeIdPaged(scopedCollegeId, pageable);
        } else if (scopedOrgId != null) {
            // No org-scoped paged query exists yet; org scoping is rare (most super-admins are
            // either fully unscoped or college-scoped) so this falls back to the unpaged list
            // rather than adding a third paginated query for a path with no reported volume issue.
            List<com._42students.lms.model.Course> orgCourses = courseService.fetchByOrganizationId(scopedOrgId);
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), orgCourses), HttpStatus.OK);
        } else {
            result = courseService.findAllPaged(pageable);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), toPageResponse(result)), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchByCollege", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch courses by college ID", notes = "Returns all courses for departments in the given college. Used for college-scoped admin.")
    public ResponseEntity fetchCoursesByCollege(@RequestParam int collegeId) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        List<com._42students.lms.model.Course> courses = courseService.fetchByCollegeId(collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), courses), HttpStatus.OK);
    }

    // 6.5: additive paginated variants. fetchByCollege/fetchAll stay unbounded on purpose --
    // changing their response shape would break every existing caller (Courses.js loads the plain
    // array today). These are for a caller that wants to page through a large college/platform
    // course list instead of pulling every row in one response.
    @RequestMapping(value = "/fetchByCollegePaged", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch courses by college ID, paginated", notes = "Same scope as fetchByCollege; returns a PageResponseDTO instead of a plain array.")
    public ResponseEntity fetchCoursesByCollegePaged(@RequestParam int collegeId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        accessControlService.requireAccessCollege(securityContextUtil.getAuthenticatedUserPrincipal(), collegeId);
        org.springframework.data.domain.Page<com._42students.lms.model.Course> result = courseService.fetchByCollegeIdPaged(
                collegeId, org.springframework.data.domain.PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), toPageResponse(result)), HttpStatus.OK);
    }

    private com._42students.lms.dto.response.PageResponseDTO<com._42students.lms.model.Course> toPageResponse(
            org.springframework.data.domain.Page<com._42students.lms.model.Course> page) {
        return com._42students.lms.dto.response.PageResponseDTO.<com._42students.lms.model.Course>builder()
                .content(page.getContent())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .size(page.getSize())
                .number(page.getNumber())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @RequestMapping(value = "/fetchCourse", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch the course for a course id", notes = "Deprecated. Prefer GET /by-slug/{slug} to avoid exposing internal IDs.")
    public ResponseEntity fetchCourse(@RequestParam int courseId)
            throws Exception {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        // Collapse "exists but no access" (403) and "doesn't exist / deleted" (404) into a single
        // 404, matching by-slug and /{courseId}/slug — otherwise this was the one ID-based
        // endpoint left leaking "this course ID is real, in another tenant" via the 403/404 split.
        try {
            accessControlService.requireAccessCourse(principal, courseId);
        } catch (AccessDeniedException | ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        com._42students.lms.model.Course course = courseService.fetchCourse(courseId);
        if (course == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        // Returns the same curated PublicCourseDTO as by-slug, not the raw entity. This endpoint
        // previously leaked whatever was on the Course model -- contents, createdByOrgId,
        // parentCourseId, isDeleted, audit timestamps, and any field added to the entity later,
        // none of which any caller of this deprecated endpoint (verified: unused in the frontend)
        // needs. Every new field on Course was auto-exposed here without anyone deciding to.
        PublicCourseDTO dto = PublicCourseDTO.builder()
                .id(course.getId())
                .slug(course.getSlug())
                .courseName(course.getCourseName())
                .shortTitle(course.getShortTitle())
                .active(course.getActive())
                .deptId(course.getDeptId())
                .allowedForDisplay(course.getAllowedForDisplay())
                .metaData(course.getMetaData())
                .build();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dto), HttpStatus.OK);
    }

    /**
     * Fetch course by slug (public identifier). Requires course access; returns 404 for not found or no access.
     */
    @RequestMapping(value = "/by-slug/{slug}", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch course by slug (public identifier)", notes = "Preferred over fetchCourse. Returns 404 for invalid/unknown slug or no access.")
    public ResponseEntity fetchCourseBySlug(@PathVariable String slug) {
        try {
            courseSlugResolver.validateSlugFormat(slug);
        } catch (ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        }
        com._42students.lms.model.Course course = courseService.fetchCourseBySlug(slug).orElse(null);
        if (course == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            accessControlService.requireAccessCourse(principal, course.getId());
        } catch (Exception e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        PublicCourseDTO dto = PublicCourseDTO.builder()
                .id(course.getId())
                .slug(course.getSlug())
                .courseName(course.getCourseName())
                .shortTitle(course.getShortTitle())
                .active(course.getActive())
                .deptId(course.getDeptId())
                .allowedForDisplay(course.getAllowedForDisplay())
                .metaData(course.getMetaData())
                .build();
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), dto), HttpStatus.OK);
    }

    /**
     * Get course slug by course ID. Requires course access.
     */
    @RequestMapping(value = "/{courseId}/slug", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Get course slug by course ID", notes = "Returns the slug for a given course ID. Returns 404 for no access (same as not found).")
    public ResponseEntity getCourseSlug(@PathVariable int courseId) {
        try {
            UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
            accessControlService.requireAccessCourse(principal, courseId);
        // Catches both AccessDeniedException (403 from canAccessCourse) and the
        // ResponseStatusException(404) requireAccessCourse throws when the course does not exist
        // or is soft-deleted. Previously only the former was caught, so the not-found path escaped
        // and returned a differently-shaped error body than the 404 constructed a few lines below.
        } catch (AccessDeniedException | ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        com._42students.lms.model.Course course = courseService.fetchCourse(courseId);
        if (course == null || course.getSlug() == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found or has no slug", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), course.getSlug()), HttpStatus.OK);
    }

    @RequestMapping(value = "/fetchCourseName", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "Fetch the course name", notes = "Use courseSlug (no ID in URL) or legacy courseId. Prefer courseSlug.")
    public ResponseEntity fetchCourseName(
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String courseSlug) {
        // 6.1: this used to duplicate CourseSlugResolver's precedence rule inline, with a
        // different (weaker) implementation -- courseId was silently ignored whenever a slug was
        // also present, rather than being validated to refer to the same course. Delegating to
        // the shared resolver means every ID-resolution endpoint now enforces the same rule,
        // including the slug/courseId-mismatch check the inline version never had.
        int resolvedCourseId;
        try {
            resolvedCourseId = courseSlugResolver.resolve(courseSlug, courseId);
        } catch (ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        }
        // This endpoint previously performed NO access check of any kind — unlike fetchCourse,
        // /by-slug/{slug} and /{courseId}/slug, all of which call requireAccessCourse. Any
        // authenticated user could therefore enumerate courseId=1..N and read the name of every
        // course on the platform, in every tenant, including soft-deleted ones (fetchCourse's
        // query has no is_deleted filter). Collapse both "no access" and "not found" into 404 so
        // the endpoint also stops confirming which course IDs exist in other colleges.
        try {
            accessControlService.requireAccessCourse(securityContextUtil.getAuthenticatedUserPrincipal(), resolvedCourseId);
        } catch (Exception e) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        com._42students.lms.model.Course course = courseService.fetchCourse(resolvedCourseId);
        if (course == null) {
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found", null), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), course.getCourseName()), HttpStatus.OK);
    }

    // 6.4: redundant with courseService.updateCourse's own @Transactional -- see the comment on /create.
    @RequestMapping(value = "/update/{id}", method = RequestMethod.PUT, produces = "application/json")
    @ApiOperation(value = "Update a course", notes = "Requires access to the course's department.")
    public ResponseEntity updateCourse(@PathVariable Integer id, @Valid @RequestBody CourseDTO courseDTO,
                                       javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        // Prevent cross-tenant moves via dept_id changes in an update payload (silent data corruption + scope bypass).
        try {
            com._42students.lms.model.Course existing = courseService.fetchCourse(id);
            Integer existingDeptId = existing != null ? existing.getDeptId() : null;
            int requestedDeptId = courseDTO.getDeptId();
            if (requestedDeptId != 0 && (existingDeptId == null || requestedDeptId != existingDeptId)) {
                // Must have access to the destination department too
                accessControlService.requireAccessDepartment(principal, requestedDeptId);
                if (scopeResolutionService != null) {
                    Integer existingCollegeId = scopeResolutionService.resolveCourseToCollegeId(id);
                    Integer destCollegeId = scopeResolutionService.resolveDepartmentToCollegeId(requestedDeptId);
                    if (existingCollegeId != null && destCollegeId != null && !existingCollegeId.equals(destCollegeId)) {
                        return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(),
                                "Cannot move course to a department in a different college", null), HttpStatus.FORBIDDEN);
                    }
                }
            }
        } catch (ResponseStatusException e) {
            return new ResponseEntity(new Response(HttpStatus.valueOf(e.getStatus().value()).name(), e.getReason(), null), e.getStatus());
        } catch (AccessDeniedException e) {
            return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Forbidden", null), HttpStatus.FORBIDDEN);
        } catch (RuntimeException e) {
            // Don't echo raw exception text to the client: it leaks JPA/constraint internals
            // (table and column names) and, for an unboxing NPE, an unhelpful bare "null".
            log.warn("Course operation failed for id: {}", e.getMessage(), e);
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found or the operation could not be completed", null), HttpStatus.NOT_FOUND);
        }
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(id) : null;
        if (accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update courses in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only update courses within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessCourse(principal, id);
        // requireAccessCourse only proves "this course is in a college you can see" — for a
        // non-learner that reduces to a plain college match, so any faculty account in the
        // college could rename or deactivate any course, including ones they don't teach.
        // Editing the course record itself is an admin action (the only UI for it is the admin
        // console's Courses screen), so require college-admin rights on top of scope.
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            com._42students.lms.model.Course updatedCourse = courseService.updateCourse(id, courseDTO);
            audit(httpRequest, "COURSE_UPDATE", id, collegeId,
                    java.util.Map.of("courseName", updatedCourse != null && updatedCourse.getCourseName() != null ? updatedCourse.getCourseName() : ""));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), updatedCourse), HttpStatus.OK);
        } catch (ResponseStatusException e) {
            // Preserve deliberate 409 conflict / 404 absence statuses from the service.
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            // Course now carries an @Version column. A concurrent edit that would previously have
            // silently overwritten someone else's changes (including their whole metaData blob)
            // now surfaces here as a conflict the client can act on.
            return new ResponseEntity(new Response(HttpStatus.CONFLICT.name(),
                    "This course was modified by someone else. Refresh and reapply your changes.", null),
                    HttpStatus.CONFLICT);
        } catch (IllegalArgumentException e) {
            // Validation failures (e.g. the metaData URL/colour checks) carry a genuine
            // user-facing message. The generic RuntimeException catch below intentionally hides
            // exception text to avoid leaking JPA internals -- that would also hide this message,
            // turning a clear "image_url must be a valid http(s) URL" into a misleading 404.
            return new ResponseEntity(new Response(HttpStatus.BAD_REQUEST.name(), e.getMessage(), null), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            // Don't echo raw exception text to the client: it leaks JPA/constraint internals
            // (table and column names) and, for an unboxing NPE, an unhelpful bare "null".
            log.warn("Course operation failed for id: {}", e.getMessage(), e);
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found or the operation could not be completed", null), HttpStatus.NOT_FOUND);
        }
    }

    // 6.4: redundant with courseService.deleteCourse's own @Transactional -- see the comment on /create.
    @RequestMapping(value = "/delete/{id}", method = RequestMethod.DELETE, produces = "application/json")
    @ApiOperation(value = "Delete a course", notes = "Requires access to the course's department.")
    public ResponseEntity deleteCourse(@PathVariable Integer id, javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        Integer collegeId = scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(id) : null;
        if (accessControlService.isSuperAdmin(principal)) {
            if (principal.getCollegeId() != null && collegeId != null && !principal.getCollegeId().equals(collegeId)) {
                return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete courses in the selected college", null), HttpStatus.FORBIDDEN);
            }
            if (principal.getOrganizationId() != null && collegeId != null && scopeResolutionService != null) {
                Integer orgId = scopeResolutionService.resolveCollegeToOrganizationId(collegeId);
                if (orgId != null && !principal.getOrganizationId().equals(orgId)) {
                    return new ResponseEntity(new Response(HttpStatus.FORBIDDEN.name(), "Scoped superadmin can only delete courses within the selected organization", null), HttpStatus.FORBIDDEN);
                }
            }
        }
        accessControlService.requireAccessCourse(principal, id);
        // Deleting a course is an admin action; requireAccessCourse alone reduces to a college
        // match for any non-learner, which would let any faculty account delete a colleague's
        // course. See the matching guard on updateCourse.
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            com._42students.lms.model.Course deleting = courseService.fetchCourse(id);
            courseService.deleteCourse(id);
            audit(httpRequest, "COURSE_DELETE", id, collegeId,
                    java.util.Map.of("courseName", deleting != null && deleting.getCourseName() != null ? deleting.getCourseName() : ""));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Course deleted successfully", null), HttpStatus.OK);
        } catch (ResponseStatusException e) {
            // Preserve deliberate 409 conflict / 404 absence statuses from the service.
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        } catch (RuntimeException e) {
            // Don't echo raw exception text to the client: it leaks JPA/constraint internals
            // (table and column names) and, for an unboxing NPE, an unhelpful bare "null".
            log.warn("Course operation failed for id: {}", e.getMessage(), e);
            return new ResponseEntity(new Response(HttpStatus.NOT_FOUND.name(), "Course not found or the operation could not be completed", null), HttpStatus.NOT_FOUND);
        }
    }

    // Soft-deleted courses had no recovery path through the product at all — only a developer
    // with SQL access could bring one back. These two endpoints back the restore screen.

    @RequestMapping(value = "/deleted", method = RequestMethod.GET, produces = "application/json")
    @ApiOperation(value = "List soft-deleted courses for a college", notes = "Requires admin rights for the college.")
    public ResponseEntity fetchDeletedCourses(@RequestParam Integer collegeId) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        return new ResponseEntity(new Response(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                courseService.fetchDeletedCourses(collegeId)), HttpStatus.OK);
    }

    // 6.4: redundant with courseService.restoreCourse's own @Transactional -- see the comment on /create.
    @RequestMapping(value = "/restore/{id}", method = RequestMethod.POST, produces = "application/json")
    @ApiOperation(value = "Restore a soft-deleted course", notes = "Requires admin rights for the course's college.")
    public ResponseEntity restoreCourse(@PathVariable Integer id, @RequestParam Integer collegeId,
                                        javax.servlet.http.HttpServletRequest httpRequest) {
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity(new Response(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        try {
            com._42students.lms.model.Course restored = courseService.restoreCourse(id, collegeId);
            audit(httpRequest, "COURSE_RESTORE", id, collegeId,
                    java.util.Map.of("courseName", restored != null && restored.getCourseName() != null ? restored.getCourseName() : ""));
            return new ResponseEntity(new Response(HttpStatus.OK.name(), "Course restored", restored), HttpStatus.OK);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return new ResponseEntity(new Response(e.getStatus().name(), e.getReason(), null), e.getStatus());
        }
    }
}

