package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.response.Response;
import com._42students.lms.model.BaseModel;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AdminAuditLogService;
import com._42students.lms.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * D3 in the super-admin audit: "Soft delete without a restore UI is functionally permanent.
 * Courses, Lessons, LessonContent, Departments, Programs, Batches, Classes, Semesters,
 * LectureHalls, Colleges, Organizations, Announcements, Notifications and Quizzes all soft-delete
 * with no way back through the product -- recoverable only by a developer with SQL access."
 *
 * <p>Course, Lesson and Announcement already had bespoke deleted/restore endpoint pairs on their
 * own controllers (backing the existing Deleted Items screen). Rather than add 18 more endpoints
 * across 9 more controllers, everything else routes through this one controller with a per-entity
 * registry: one access-control implementation, one audit implementation, one response shape the
 * frontend can render generically for any type.
 *
 * <p><b>Batch is deliberately absent:</b> BatchServiceImpl#deleteBatch is a HARD delete
 * ({@code batchRepository.delete(batch)}), not a soft delete, so there is no row left to restore.
 * The audit lists it under D3, which is inaccurate for that one entity.
 *
 * <p>Listing filters {@code findAll()} in Java rather than adding a custom deleted-by-college
 * query to every repository. These are small academic-structure tables, bounded by the size of the
 * institution, and this is an admin-only recovery screen rather than a hot path -- the trade is
 * deliberate and still holds for them.
 *
 * <p>It does not hold for {@code notification}, which is the one type here that is not academic
 * structure: it grows with students x events, so its {@code findAll()} would load every
 * notification the deployment has ever sent in order to surface the handful that were deleted.
 * That handler supplies a deleted-only query via {@link EntityHandler#candidates}; any other type
 * that outgrows the assumption above can do the same without disturbing the rest.
 */
@RestController
@RequestMapping("/api/v1/admin/recycle-bin")
@Slf4j
@Api(tags = "Admin Recycle Bin (restore soft-deleted records)")
@CrossOrigin(originPatterns = {"http://localhost:*", "https://42lms.com", "https://www.42lms.com", "https://*.42lms.com"}, allowCredentials = "true", maxAge = 3600)
public class AdminRecycleBinController extends BaseController {

    @Autowired private AccessControlService accessControlService;
    @Autowired private SecurityContextUtil securityContextUtil;
    @Autowired(required = false) private ScopeResolutionService scopeResolutionService;
    @Autowired(required = false) private AdminAuditLogService auditLogService;

    @Autowired private com._42students.lms.repository.DepartmentRepository departmentRepository;
    @Autowired private com._42students.lms.repository.NewProgramRepository newProgramRepository;
    @Autowired private com._42students.lms.repository._ClassRepository classRepository;
    @Autowired private com._42students.lms.repository.SemesterRepository semesterRepository;
    @Autowired private com._42students.lms.repository.LectureHallRepository lectureHallRepository;
    @Autowired(required = false) private com._42students.lms.repository.QuizRepository quizRepository;
    @Autowired private com._42students.lms.repository.CollegeRepository collegeRepository;
    @Autowired private com._42students.lms.repository.OrganizationRepository organizationRepository;
    @Autowired private com._42students.lms.repository.NotificationRepository notificationRepository;

    /**
     * One entity type's wiring. {@code collegeIdOf} returns the college a row belongs to (null for
     * the two platform-level types); {@code label}/{@code sublabel} produce the display strings.
     */
    private static final class EntityHandler<T> {
        final String label;
        final JpaRepository<T, Integer> repo;
        final Function<T, Integer> collegeIdOf;
        final Function<T, String> nameOf;
        final Function<T, String> subtitleOf;
        /** Platform-level types (College/Organization) aren't college-scoped -- superadmin only. */
        final boolean platformLevel;
        /**
         * Where to read candidate rows from. Defaults to {@code repo.findAll()}, which is fine for
         * the bounded academic-structure tables (see the class javadoc). A type whose table grows
         * without bound supplies a deleted-only query here instead.
         */
        final java.util.function.Supplier<List<T>> candidates;

        EntityHandler(String label, JpaRepository<T, Integer> repo, Function<T, Integer> collegeIdOf,
                      Function<T, String> nameOf, Function<T, String> subtitleOf, boolean platformLevel) {
            this(label, repo, collegeIdOf, nameOf, subtitleOf, platformLevel, null);
        }

        EntityHandler(String label, JpaRepository<T, Integer> repo, Function<T, Integer> collegeIdOf,
                      Function<T, String> nameOf, Function<T, String> subtitleOf, boolean platformLevel,
                      java.util.function.Supplier<List<T>> candidates) {
            this.label = label;
            this.repo = repo;
            this.collegeIdOf = collegeIdOf;
            this.nameOf = nameOf;
            this.subtitleOf = subtitleOf;
            this.platformLevel = platformLevel;
            this.candidates = candidates != null ? candidates : repo::findAll;
        }
    }

    private Map<String, EntityHandler<?>> handlers() {
        Map<String, EntityHandler<?>> m = new LinkedHashMap<>();
        m.put("department", new EntityHandler<>("Department", departmentRepository,
                com._42students.lms.model.Department::getCollegeId,
                com._42students.lms.model.Department::getName,
                d -> "College #" + d.getCollegeId(), false));
        m.put("program", new EntityHandler<>("Program", newProgramRepository,
                p -> scopeResolutionService != null ? scopeResolutionService.resolveDepartmentToCollegeId(p.getDeptId()) : null,
                com._42students.lms.model.NewProgram::getName,
                p -> "Department #" + p.getDeptId(), false));
        m.put("class", new EntityHandler<>("Class", classRepository,
                c -> scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(c.getProgramId()) : null,
                com._42students.lms.model._Class::getName,
                c -> "Program #" + c.getProgramId(), false));
        m.put("semester", new EntityHandler<>("Semester", semesterRepository,
                s -> scopeResolutionService != null ? scopeResolutionService.resolveProgramToCollegeId(s.getProgramId()) : null,
                s -> s.getName() != null ? s.getName() : ("Semester #" + s.getId()),
                s -> "Program #" + s.getProgramId(), false));
        m.put("lecture-hall", new EntityHandler<>("Lecture Hall", lectureHallRepository,
                com._42students.lms.model.LectureHall::getCollegeId,
                com._42students.lms.model.LectureHall::getName,
                h -> "College #" + h.getCollegeId(), false));
        if (quizRepository != null) {
            m.put("quiz", new EntityHandler<>("Quiz", quizRepository,
                    q -> scopeResolutionService != null ? scopeResolutionService.resolveCourseToCollegeId(q.getCourseId()) : null,
                    com._42students.lms.model.Quiz::getTitle,
                    q -> "Course #" + q.getCourseId(), false));
        }
        m.put("notification", new EntityHandler<>("Notification", notificationRepository,
                n -> scopeResolutionService != null ? scopeResolutionService.resolveClassToCollegeId(n.getClassId()) : null,
                com._42students.lms.model.Notification::getTitle,
                n -> "Class #" + n.getClassId(), false,
                // The college filter still runs in Java, because a notification carries no
                // collegeId of its own -- it resolves through its class. Narrowing the candidate
                // set to deleted rows first is what matters: those are rare, while the table
                // itself is the only unbounded one on this screen.
                notificationRepository::findAllDeleted));
        m.put("college", new EntityHandler<>("College", collegeRepository,
                c -> null, com._42students.lms.model.College::getName,
                c -> "Organization #" + c.getOrgId(), true));
        m.put("organization", new EntityHandler<>("Organization", organizationRepository,
                o -> null, com._42students.lms.model.Organization::getName,
                o -> "Platform-level", true));
        return m;
    }

    @GetMapping("/types")
    @ApiOperation(value = "List the entity types this recycle bin can restore")
    public ResponseEntity<Response<List<Map<String, Object>>>> listTypes() {
        List<Map<String, Object>> out = new ArrayList<>();
        handlers().forEach((key, h) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("type", key);
            row.put("label", h.label);
            row.put("platformLevel", h.platformLevel);
            out.add(row);
        });
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(), out), HttpStatus.OK);
    }

    @GetMapping
    @ApiOperation(value = "List soft-deleted records of one type",
            notes = "College-scoped types require collegeId and admin rights for it. Platform-level types (college/organization) are superadmin-only.")
    public ResponseEntity<Response<List<Map<String, Object>>>> listDeleted(
            @RequestParam String entityType,
            @RequestParam(required = false) Integer collegeId) {
        EntityHandler<?> handler = handlers().get(entityType);
        if (handler == null) {
            return new ResponseEntity<>(new Response<>("error", "Unknown entityType: " + entityType, null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (handler.platformLevel) {
            accessControlService.requireSuperAdmin(principal);
        } else {
            if (collegeId == null || collegeId <= 0) {
                return new ResponseEntity<>(new Response<>("error", "collegeId is required for " + entityType, null), HttpStatus.BAD_REQUEST);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(), HttpStatus.OK.getReasonPhrase(),
                collectDeleted(handler, collegeId)), HttpStatus.OK);
    }

    @SuppressWarnings("unchecked")
    private <T> List<Map<String, Object>> collectDeleted(EntityHandler<T> handler, Integer collegeId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (T row : handler.candidates.get()) {
            if (!(row instanceof BaseModel)) continue;
            BaseModel base = (BaseModel) row;
            if (!Boolean.TRUE.equals(base.getIsDeleted())) continue;
            if (!handler.platformLevel) {
                Integer rowCollege = safeApply(handler.collegeIdOf, row);
                if (rowCollege == null || !rowCollege.equals(collegeId)) continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", base.getId());
            item.put("name", safeApplyString(handler.nameOf, row));
            item.put("subtitle", safeApplyString(handler.subtitleOf, row));
            out.add(item);
        }
        return out;
    }

    private <T, R> R safeApply(Function<T, R> fn, T value) {
        try {
            return fn.apply(value);
        } catch (Exception e) {
            return null;
        }
    }

    private <T> String safeApplyString(Function<T, String> fn, T value) {
        String s = safeApply(fn, value);
        return s != null ? s : "";
    }

    @PostMapping("/restore")
    @ApiOperation(value = "Restore one soft-deleted record",
            notes = "Restores the row itself only -- nothing beneath it is cascade-restored, matching the existing lesson-restore behaviour.")
    @Transactional
    public ResponseEntity<Response<Object>> restore(@RequestParam String entityType,
                                                    @RequestParam Integer id,
                                                    @RequestParam(required = false) Integer collegeId,
                                                    HttpServletRequest httpRequest) {
        EntityHandler<?> handler = handlers().get(entityType);
        if (handler == null) {
            return new ResponseEntity<>(new Response<>("error", "Unknown entityType: " + entityType, null), HttpStatus.BAD_REQUEST);
        }
        UserPrincipal principal = securityContextUtil.getAuthenticatedUserPrincipal();
        if (principal == null) {
            return new ResponseEntity<>(new Response<>(HttpStatus.UNAUTHORIZED.name(), "Authentication required", null), HttpStatus.UNAUTHORIZED);
        }
        if (handler.platformLevel) {
            accessControlService.requireSuperAdmin(principal);
        } else if (collegeId == null || collegeId <= 0) {
            return new ResponseEntity<>(new Response<>("error", "collegeId is required for " + entityType, null), HttpStatus.BAD_REQUEST);
        }
        return doRestore(handler, id, collegeId, principal, entityType, httpRequest);
    }

    private <T> ResponseEntity<Response<Object>> doRestore(EntityHandler<T> handler, Integer id, Integer collegeId,
                                                          UserPrincipal principal, String entityType,
                                                          HttpServletRequest httpRequest) {
        T row = handler.repo.findById(id).orElse(null);
        if (!(row instanceof BaseModel)) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(), handler.label + " not found", null), HttpStatus.NOT_FOUND);
        }
        BaseModel base = (BaseModel) row;
        if (!Boolean.TRUE.equals(base.getIsDeleted())) {
            return new ResponseEntity<>(new Response<>(HttpStatus.NOT_FOUND.name(), handler.label + " is not deleted", null), HttpStatus.NOT_FOUND);
        }
        // Verify the row really belongs to the college the caller was authorised for, so a valid
        // admin for college A can't restore college B's row by passing their own collegeId.
        if (!handler.platformLevel) {
            Integer rowCollege = safeApply(handler.collegeIdOf, row);
            if (rowCollege == null || !rowCollege.equals(collegeId)) {
                return new ResponseEntity<>(new Response<>(HttpStatus.FORBIDDEN.name(),
                        handler.label + " does not belong to the specified college", null), HttpStatus.FORBIDDEN);
            }
            accessControlService.requirePerformAdminActionForCollege(principal, collegeId);
        }
        base.setIsDeleted(false);
        handler.repo.save(row);
        if (auditLogService != null) {
            auditLogService.log(httpRequest, entityType.toUpperCase().replace('-', '_') + "_RESTORE",
                    entityType, String.valueOf(id), null, collegeId,
                    Map.of("name", safeApplyString(handler.nameOf, row)));
        }
        return new ResponseEntity<>(new Response<>(HttpStatus.OK.name(),
                handler.label + " restored. Records beneath it are not automatically restored.", null), HttpStatus.OK);
    }
}
