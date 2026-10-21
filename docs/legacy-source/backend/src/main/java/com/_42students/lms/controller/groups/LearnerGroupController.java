package com._42students.lms.controller.groups;

import com._42students.lms.dto.groups.GroupView;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.groups.GroupAccessGuard;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import com._42students.lms.service.groups.GroupService;
import com._42students.lms.util.SecurityContextUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** A learner's own view: what they are in, what they can join, join, leave. Always acts as self. */
@RestController
@RequestMapping("/api/v1/learner/groups")
public class LearnerGroupController {

    private final SecurityContextUtil securityContextUtil;
    private final GroupAccessGuard guard;
    private final GroupService groupService;
    private final GroupMembershipService membershipService;
    private final LmsGroupRepository groupRepository;

    public LearnerGroupController(SecurityContextUtil securityContextUtil, GroupAccessGuard guard, GroupService groupService,
                                  GroupMembershipService membershipService, LmsGroupRepository groupRepository) {
        this.securityContextUtil = securityContextUtil;
        this.guard = guard;
        this.groupService = groupService;
        this.membershipService = membershipService;
        this.groupRepository = groupRepository;
    }

    private UserPrincipal learner() {
        UserPrincipal p = securityContextUtil.getAuthenticatedUserPrincipal();
        if (p == null || !p.isLearner() || p.getId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Learners only");
        return p;
    }

    @GetMapping("/mine")
    public ResponseEntity<List<GroupView>> mine(@RequestParam(required = false) String kind) {
        UserPrincipal p = learner();
        String k = GroupService.normaliseKind(kind);
        LocalDateTime now = LocalDateTime.now();
        List<LmsGroupMember> memberships = membershipService.currentMemberships(LmsGroupMember.TYPE_LEARNER, p.getId());
        Map<Long, LmsGroupMember> byGroup = new HashMap<>();
        for (LmsGroupMember m : memberships) byGroup.put(m.getGroupId(), m);
        List<GroupView> out = new ArrayList<>();
        if (!byGroup.isEmpty()) {
            for (LmsGroup g : groupRepository.findAllById(byGroup.keySet())) {
                if (Boolean.TRUE.equals(g.getIsDeleted())) continue;
                if (k != null && !k.equals(g.getKind())) continue;
                out.add(GroupView.of(g, now).withMembership(byGroup.get(g.getId())));
            }
        }
        return ResponseEntity.ok(out);
    }

    /** Groups open for self-join right now in the learner's college (or platform-wide), with the caller's state if any. */
    @GetMapping("/open")
    public ResponseEntity<List<GroupView>> open(@RequestParam(required = false) String kind) {
        UserPrincipal p = learner();
        String k = GroupService.normaliseKind(kind);
        LocalDateTime now = LocalDateTime.now();
        List<LmsGroup> groups = groupRepository.findOpenForSelfJoin(p.getCollegeId(), now).stream()
                .filter(g -> k == null || k.equals(g.getKind())).collect(Collectors.toList());
        Map<Long, LmsGroupMember> mine = new HashMap<>();
        for (LmsGroupMember m : membershipService.membershipsIn(LmsGroupMember.TYPE_LEARNER, p.getId(),
                groups.stream().map(LmsGroup::getId).collect(Collectors.toList()))) {
            if (m.isCurrent()) mine.put(m.getGroupId(), m);
        }
        return ResponseEntity.ok(groups.stream().map(g -> GroupView.of(g, now).withMembership(mine.get(g.getId()))).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupView> get(@PathVariable Long id) {
        UserPrincipal p = learner();
        LmsGroup group = guard.requireVisibleToLearner(p, id);
        LmsGroupMember m = membershipService.membership(group.getId(), LmsGroupMember.TYPE_LEARNER, p.getId())
                .filter(LmsGroupMember::isCurrent).orElse(null);
        return ResponseEntity.ok(GroupView.of(group, LocalDateTime.now()).withMembership(m));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<GroupView> join(@PathVariable Long id) {
        UserPrincipal p = learner();
        LmsGroup group = guard.requireVisibleToLearner(p, id);
        LmsGroupMember m = membershipService.selfJoin(group, p.getId(), GroupActor.of(p));
        return ResponseEntity.ok(GroupView.of(groupService.get(id), LocalDateTime.now()).withMembership(m));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<GroupView> leave(@PathVariable Long id) {
        UserPrincipal p = learner();
        LmsGroup group = guard.requireVisibleToLearner(p, id);
        membershipService.leave(group, p.getId(), GroupActor.of(p));
        return ResponseEntity.ok(GroupView.of(groupService.get(id), LocalDateTime.now()));
    }
}
