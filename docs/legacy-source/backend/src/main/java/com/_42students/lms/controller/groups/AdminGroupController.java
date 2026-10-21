package com._42students.lms.controller.groups;

import com._42students.lms.dto.groups.GroupMemberBulkRequest;
import com._42students.lms.dto.groups.GroupMemberRemoveRequest;
import com._42students.lms.dto.groups.GroupMemberView;
import com._42students.lms.dto.groups.GroupRuleRequest;
import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.dto.groups.GroupView;
import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupMemberEvent;
import com._42students.lms.model.groups.LmsGroupRule;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.groups.GroupAccessGuard;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import com._42students.lms.service.groups.GroupRuleService;
import com._42students.lms.service.groups.GroupService;
import com._42students.lms.service.groups.GroupViewAssembler;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * College-admin (and scoped super-admin) management of groups. Route is under /api/v1/admin/**, so
 * WebSecurityConfig already requires ROLE_ADMIN; GroupAccessGuard adds the tenant check per id.
 */
@RestController
@RequestMapping("/api/v1/admin/groups")
public class AdminGroupController {

    private static final String MANAGED_ELECTIVE_KIND = "ELECTIVE";
    // Project team groups are managed from Projects (docs/groups/PROJECT-TEAMS.md).
    private static final String MANAGED_PROJECT_TEAM_KIND = "PROJECT_TEAM";

    private final SecurityContextUtil securityContextUtil;
    private final GroupAccessGuard guard;
    private final GroupService groupService;
    private final GroupMembershipService membershipService;
    private final GroupRuleService ruleService;
    private final GroupViewAssembler assembler;

    public AdminGroupController(SecurityContextUtil securityContextUtil, GroupAccessGuard guard, GroupService groupService,
                                GroupMembershipService membershipService, GroupRuleService ruleService, GroupViewAssembler assembler) {
        this.securityContextUtil = securityContextUtil;
        this.guard = guard;
        this.groupService = groupService;
        this.membershipService = membershipService;
        this.ruleService = ruleService;
        this.assembler = assembler;
    }

    private UserPrincipal principal() {
        return securityContextUtil.getAuthenticatedUserPrincipal();
    }

    private static void requireGenericKernelMutation(LmsGroup group) {
        if (group != null && MANAGED_ELECTIVE_KIND.equals(group.getKind())) {
            throw new IllegalStateException("Elective groups are managed from the Electives page");
        }
        if (group != null && MANAGED_PROJECT_TEAM_KIND.equals(group.getKind())) {
            throw new IllegalStateException("Project team groups are managed from the project's Team tab");
        }
    }

    private static void requireGenericCreatableKind(String kind) {
        if (MANAGED_ELECTIVE_KIND.equals(GroupService.normaliseKind(kind))) {
            throw new IllegalArgumentException("Create elective slots and offerings from the Electives page");
        }
        if (MANAGED_PROJECT_TEAM_KIND.equals(GroupService.normaliseKind(kind))) {
            throw new IllegalArgumentException("Create project teams from Projects");
        }
    }

    // ------------------------------------------------------------------ groups

    @GetMapping
    public ResponseEntity<List<GroupView>> list(@RequestParam(required = false) String kind,
                                                @RequestParam(required = false) String status) {
        Integer collegeId = guard.manageableCollege(principal());
        LocalDateTime now = LocalDateTime.now();
        return ResponseEntity.ok(groupService.list(collegeId, kind, status).stream()
                .filter(g -> kind != null || (!MANAGED_ELECTIVE_KIND.equals(g.getKind()) && !MANAGED_PROJECT_TEAM_KIND.equals(g.getKind())))
                .map(g -> GroupView.of(g, now)).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<GroupView> create(@RequestBody GroupUpsertRequest body) {
        UserPrincipal p = principal();
        Integer collegeId = guard.manageableCollege(p);
        requireGenericCreatableKind(body == null ? null : body.getKind());
        LmsGroup group = groupService.create(GroupActor.of(p), collegeId, body);
        return ResponseEntity.ok(GroupView.of(group, LocalDateTime.now()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupView> get(@PathVariable Long id) {
        return ResponseEntity.ok(GroupView.of(guard.requireManageable(principal(), id), LocalDateTime.now()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupView> update(@PathVariable Long id, @RequestBody GroupUpsertRequest body) {
        LmsGroup group = guard.requireManageable(principal(), id);
        requireGenericKernelMutation(group);
        return ResponseEntity.ok(GroupView.of(groupService.update(group, body), LocalDateTime.now()));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<GroupView> status(@PathVariable Long id, @RequestParam String to) {
        LmsGroup group = guard.requireManageable(principal(), id);
        requireGenericKernelMutation(group);
        return ResponseEntity.ok(GroupView.of(groupService.transition(group, to), LocalDateTime.now()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        LmsGroup group = guard.requireManageable(principal(), id);
        requireGenericKernelMutation(group);
        groupService.softDelete(group);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reconcile")
    public ResponseEntity<Map<String, Object>> reconcile(@PathVariable Long id) {
        LmsGroup group = guard.requireManageable(principal(), id);
        int count = membershipService.reconcileActiveCount(group);
        return ResponseEntity.ok(Map.of("groupId", id, "activeCount", count));
    }

    // ------------------------------------------------------------------ members

    @GetMapping("/{id}/members")
    public ResponseEntity<List<GroupMemberView>> members(@PathVariable Long id, @RequestParam(required = false) String state) {
        LmsGroup group = guard.requireManageable(principal(), id);
        return ResponseEntity.ok(assembler.memberViews(membershipService.members(group.getId(), state)));
    }

    /** Bulk add. Partial success is normal: each learner reports its own outcome. */
    @PostMapping("/{id}/members")
    public ResponseEntity<Map<String, Object>> addMembers(@PathVariable Long id, @RequestBody GroupMemberBulkRequest body) {
        UserPrincipal p = principal();
        LmsGroup group = guard.requireManageable(p, id);
        requireGenericKernelMutation(group);
        GroupActor actor = GroupActor.of(p);
        String source = body.getSource() == null ? LmsGroupMember.SOURCE_MANUAL : body.getSource().trim().toUpperCase();
        if (!LmsGroupMember.SOURCE_MANUAL.equals(source) && !LmsGroupMember.SOURCE_CSV.equals(source)) {
            throw new IllegalArgumentException("Source must be MANUAL or CSV");
        }

        Set<Integer> learnerIds = new LinkedHashSet<>();
        if (body.getLearnerIds() != null) body.getLearnerIds().stream().filter(x -> x != null).forEach(learnerIds::add);
        List<Map<String, Object>> errors = new ArrayList<>();
        if (body.getRollNumbers() != null && !body.getRollNumbers().isEmpty()) {
            Set<String> wanted = body.getRollNumbers().stream().filter(r -> r != null && !r.isBlank())
                    .map(String::trim).collect(Collectors.toCollection(LinkedHashSet::new));
            Map<String, Learner> found = new LinkedHashMap<>();
            for (Learner l : membershipService.resolveRollNumbers(group.getCollegeId(), wanted)) found.put(l.getRollNumber(), l);
            for (String roll : wanted) {
                Learner l = found.get(roll);
                if (l == null) errors.add(Map.of("rollNumber", roll, "error", "Learner not found"));
                else learnerIds.add(l.getId());
            }
        }
        if (learnerIds.size() > 2000) throw new IllegalArgumentException("At most 2000 learners per request");

        List<Map<String, Object>> results = new ArrayList<>();
        int added = 0;
        for (Integer learnerId : learnerIds) {
            try {
                LmsGroupMember m = membershipService.add(group, learnerId, source, actor, body.getNote());
                results.add(Map.of("learnerId", learnerId, "state", m.getState()));
                added++;
            } catch (IllegalArgumentException | IllegalStateException e) {
                errors.add(Map.of("learnerId", learnerId, "error", e.getMessage() == null ? "Rejected" : e.getMessage()));
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("requested", learnerIds.size() + errors.stream().filter(e -> e.containsKey("rollNumber")).count());
        out.put("added", added);
        out.put("results", results);
        out.put("errors", errors);
        return ResponseEntity.ok(out);
    }

    @DeleteMapping("/{id}/members/{learnerId}")
    public ResponseEntity<GroupMemberView> removeMember(@PathVariable Long id, @PathVariable Integer learnerId,
                                                        @RequestBody(required = false) GroupMemberRemoveRequest body) {
        UserPrincipal p = principal();
        LmsGroup group = guard.requireManageable(p, id);
        requireGenericKernelMutation(group);
        String reason = body == null ? null : body.getReason();
        boolean lock = body != null && Boolean.TRUE.equals(body.getLock());
        LmsGroupMember m = membershipService.remove(group, learnerId, GroupActor.of(p), reason, lock);
        return ResponseEntity.ok(assembler.memberViews(List.of(m)).get(0));
    }

    @PostMapping("/{id}/members/{learnerId}/lock")
    public ResponseEntity<GroupMemberView> lock(@PathVariable Long id, @PathVariable Integer learnerId,
                                                @RequestParam(defaultValue = "true") boolean locked) {
        UserPrincipal p = principal();
        LmsGroup group = guard.requireManageable(p, id);
        requireGenericKernelMutation(group);
        LmsGroupMember m = membershipService.setLocked(group, learnerId, locked, GroupActor.of(p));
        return ResponseEntity.ok(assembler.memberViews(List.of(m)).get(0));
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<LmsGroupMemberEvent>> events(@PathVariable Long id) {
        LmsGroup group = guard.requireManageable(principal(), id);
        return ResponseEntity.ok(membershipService.events(group.getId()));
    }

    // ------------------------------------------------------------------ rule

    @GetMapping("/{id}/rule")
    public ResponseEntity<LmsGroupRule> rule(@PathVariable Long id) {
        LmsGroup group = guard.requireManageable(principal(), id);
        return ruleService.get(group.getId()).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/rule")
    public ResponseEntity<LmsGroupRule> setRule(@PathVariable Long id, @RequestBody GroupRuleRequest body) {
        LmsGroup group = guard.requireManageable(principal(), id);
        requireGenericKernelMutation(group);
        return ResponseEntity.ok(ruleService.set(group, body.getCriteria(), body.getAutoRefresh()));
    }

    @DeleteMapping("/{id}/rule")
    public ResponseEntity<Void> clearRule(@PathVariable Long id) {
        LmsGroup group = guard.requireManageable(principal(), id);
        requireGenericKernelMutation(group);
        ruleService.clear(group);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/rule/preview")
    public ResponseEntity<GroupRuleService.Preview> previewRule(@PathVariable Long id) {
        return ResponseEntity.ok(ruleService.preview(guard.requireManageable(principal(), id)));
    }

    @PostMapping("/{id}/rule/apply")
    public ResponseEntity<GroupRuleService.ApplyResult> applyRule(@PathVariable Long id) {
        UserPrincipal p = principal();
        LmsGroup group = guard.requireManageable(p, id);
        requireGenericKernelMutation(group);
        return ResponseEntity.ok(ruleService.apply(group, GroupActor.of(p)));
    }
}
