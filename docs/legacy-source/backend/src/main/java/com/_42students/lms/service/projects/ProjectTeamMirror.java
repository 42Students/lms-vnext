package com._42students.lms.service.projects;

import com._42students.lms.model.Learner;
import com._42students.lms.model.ProjectMember;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.ProjectMemberRepository;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.service.groups.GroupMembershipChangedEvent;
import com._42students.lms.service.groups.GroupMembershipService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Keeps a team workspace's learner rows in {@code project_member} identical to its PROJECT_TEAM group
 * (docs/groups/PROJECT-TEAMS.md). The group is the source of truth; every reader of project_member
 * (authorization, lists, counts) keeps working unchanged because the rows are mirrored here, in the
 * same transaction as the group change, so the two can never commit out of step.
 */
@Slf4j
@Component
public class ProjectTeamMirror {

    public static final String TEAM_KIND = "PROJECT_TEAM";
    static final String LEARNER = "LEARNER";
    static final String DEFAULT_ROLE = "Project Contributor";

    private final ProjectWorkspaceRepository workspaceRepository;
    private final ProjectMemberRepository memberRepository;
    private final LearnerRepository learnerRepository;
    private final GroupMembershipService membershipService;

    public ProjectTeamMirror(ProjectWorkspaceRepository workspaceRepository,
                             ProjectMemberRepository memberRepository,
                             LearnerRepository learnerRepository,
                             GroupMembershipService membershipService) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.learnerRepository = learnerRepository;
        this.membershipService = membershipService;
    }

    /** Synchronous on purpose: it runs inside the group change's transaction and fails with it. */
    @EventListener
    public void onMembershipChanged(GroupMembershipChangedEvent event) {
        if (event == null || event.getGroupId() == null || !LEARNER.equalsIgnoreCase(event.getMemberType())) return;
        List<ProjectWorkspace> workspaces = workspaceRepository.findActiveByTeamGroupId(event.getGroupId());
        boolean active = LmsGroupMember.STATE_ACTIVE.equals(event.getToState());
        for (ProjectWorkspace workspace : workspaces) {
            applyLearner(workspace.getId(), event.getMemberId(), active);
        }
    }

    /** Makes one learner's row match: ACTIVE in the group means an active member row, anything else none. */
    void applyLearner(Integer projectId, Integer learnerId, boolean active) {
        if (projectId == null || learnerId == null) return;
        Optional<ProjectMember> existing = memberRepository.findByProjectAndUserAndType(projectId, learnerId, LEARNER);
        if (active) {
            if (existing.isPresent() && !Boolean.TRUE.equals(existing.get().getIsDeleted())) return;
            ProjectMember member = existing.orElseGet(ProjectMember::new);
            member.setProjectId(projectId);
            member.setUserId(learnerId);
            member.setUserType(LEARNER);
            member.setDisplayName(displayName(learnerId));
            if (member.getRoleLabel() == null || member.getRoleLabel().isBlank()) member.setRoleLabel(DEFAULT_ROLE);
            member.setMemberStatus("ACTIVE");
            member.setIsDeleted(false);
            memberRepository.save(member);
        } else if (existing.isPresent() && !Boolean.TRUE.equals(existing.get().getIsDeleted())) {
            ProjectMember member = existing.get();
            member.setIsDeleted(true);
            memberRepository.save(member);
        }
    }

    /**
     * Repairs drift a hand edit in the database could cause (no application rule can see that).
     * Returns how many learner rows were changed.
     */
    @Transactional
    public int reconcile(ProjectWorkspace workspace) {
        if (workspace == null || workspace.getTeamGroupId() == null) return 0;
        Set<Integer> groupActive = membershipService.members(workspace.getTeamGroupId(), LmsGroupMember.STATE_ACTIVE).stream()
                .filter(m -> LEARNER.equalsIgnoreCase(m.getMemberType()))
                .map(LmsGroupMember::getMemberId)
                .collect(Collectors.toSet());
        Set<Integer> mirrored = memberRepository.findActiveByProjectId(workspace.getId()).stream()
                .filter(m -> LEARNER.equalsIgnoreCase(m.getUserType()))
                .map(ProjectMember::getUserId)
                .collect(Collectors.toSet());
        int changed = 0;
        for (Integer id : groupActive) {
            if (!mirrored.contains(id)) { applyLearner(workspace.getId(), id, true); changed++; }
        }
        for (Integer id : mirrored) {
            if (!groupActive.contains(id)) { applyLearner(workspace.getId(), id, false); changed++; }
        }
        if (changed > 0) {
            log.warn("Project team reconcile repaired {} learner row(s) for workspace {} (group {})",
                    changed, workspace.getId(), workspace.getTeamGroupId());
        }
        return changed;
    }

    private String displayName(Integer learnerId) {
        return learnerRepository.findById(learnerId)
                .map(this::nameOf)
                .orElse(null);
    }

    private String nameOf(Learner learner) {
        String name = ((learner.getFirstName() != null ? learner.getFirstName() : "") + " "
                + (learner.getLastName() != null ? learner.getLastName() : "")).trim();
        return name.isEmpty() ? null : name;
    }
}
