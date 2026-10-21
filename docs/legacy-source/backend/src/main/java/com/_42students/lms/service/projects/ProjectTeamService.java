package com._42students.lms.service.projects;

import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.dto.projects.AdminProjectCreateDTO;
import com._42students.lms.dto.projects.AdminProjectTeamsCreateDTO;
import com._42students.lms.dto.projects.ProjectWorkspaceDTO;
import com._42students.lms.model.ProjectWorkspace;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.ProjectWorkspaceRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.service.groups.GroupActor;
import com._42students.lms.service.groups.GroupMembershipService;
import com._42students.lms.service.groups.GroupService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Project teams on groups (docs/groups/PROJECT-TEAMS.md): creates team workspaces, routes learner
 * changes on a team workspace through its group, and reconciles the mirror.
 */
@Slf4j
@Service
public class ProjectTeamService {

    static final int MAX_TEAMS = 200;
    static final int MAX_TEAM_SIZE = 500;

    private final ProjectWorkspaceService workspaceService;
    private final ProjectWorkspaceRepository workspaceRepository;
    private final GroupService groupService;
    private final GroupMembershipService membershipService;
    private final LmsGroupRepository groupRepository;
    private final ProjectTeamMirror mirror;
    private final TransactionTemplate perTeam;

    public ProjectTeamService(ProjectWorkspaceService workspaceService,
                              ProjectWorkspaceRepository workspaceRepository,
                              GroupService groupService,
                              GroupMembershipService membershipService,
                              LmsGroupRepository groupRepository,
                              ProjectTeamMirror mirror,
                              PlatformTransactionManager transactionManager) {
        this.workspaceService = workspaceService;
        this.workspaceRepository = workspaceRepository;
        this.groupService = groupService;
        this.membershipService = membershipService;
        this.groupRepository = groupRepository;
        this.mirror = mirror;
        this.perTeam = new TransactionTemplate(transactionManager);
    }

    /** Validates the whole split up front, then creates each team in its own transaction. */
    public Map<String, Object> createTeams(UserPrincipal principal, AdminProjectTeamsCreateDTO payload) {
        validate(payload);
        GroupActor actor = GroupActor.of(principal);
        List<Map<String, Object>> created = new ArrayList<>();
        List<Map<String, Object>> failures = new ArrayList<>();
        // Retry safety (Projects audit R6-01): a team whose workspace already exists for this class and template (same
        // title) is reported, not created a second time, so re-sending a partly-failed split cannot duplicate teams.
        java.util.Set<String> existingTitles = workspaceRepository.findActiveByCollegeId(payload.getCollegeId()).stream()
                .filter(workspace -> java.util.Objects.equals(workspace.getClassId(), payload.getClassId())
                        && java.util.Objects.equals(workspace.getTemplateId(), payload.getTemplateId())
                        && workspace.getTitle() != null)
                .map(workspace -> workspace.getTitle().trim().toLowerCase(java.util.Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        for (AdminProjectTeamsCreateDTO.Team team : payload.getTeams()) {
            if (team.getTitle() != null && existingTitles.contains(team.getTitle().trim().toLowerCase(java.util.Locale.ROOT))) {
                Map<String, Object> failure = new LinkedHashMap<>();
                failure.put("title", team.getTitle());
                failure.put("message", "A team workspace with this title already exists for this class and template");
                failure.put("alreadyExists", true);
                failures.add(failure);
                continue;
            }
            try {
                Map<String, Object> row = perTeam.execute(status -> createOne(principal, actor, payload, team));
                created.add(row);
            } catch (RuntimeException ex) {
                log.warn("Project team '{}' could not be created: {}", team.getTitle(), ex.getMessage());
                Map<String, Object> failure = new LinkedHashMap<>();
                failure.put("title", team.getTitle());
                failure.put("message", ex.getMessage() != null ? ex.getMessage() : "Could not create this team");
                failures.add(failure);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("created", created);
        out.put("failures", failures);
        return out;
    }

    private Map<String, Object> createOne(UserPrincipal principal, GroupActor actor,
                                          AdminProjectTeamsCreateDTO payload, AdminProjectTeamsCreateDTO.Team team) {
        // 1. The workspace, with its learners (this keeps the existing "you were added" notifications).
        AdminProjectCreateDTO create = new AdminProjectCreateDTO();
        create.setTitle(team.getTitle().trim());
        create.setSummary(payload.getSummary());
        create.setStatus(payload.getStatus());
        create.setCollegeId(payload.getCollegeId());
        create.setOrganizationId(payload.getOrganizationId());
        create.setClassId(payload.getClassId());
        create.setTemplateId(payload.getTemplateId());
        create.setMentorId(payload.getMentorId());
        create.setLearnerIds(new ArrayList<>(new HashSet<>(team.getLearnerIds())));
        ProjectWorkspaceDTO dto = workspaceService.createProject(principal, create);
        ProjectWorkspace workspace = workspaceRepository.findActiveById(dto.getNumericId())
                .orElseThrow(() -> new IllegalStateException("The workspace was not created"));

        // 2. Its team group, linked before any member is added so the mirror sees every join.
        GroupUpsertRequest request = new GroupUpsertRequest();
        request.setKind(ProjectTeamMirror.TEAM_KIND);
        request.setName(team.getTitle().trim());
        request.setDescription("Project team for workspace " + workspace.getId());
        request.setConfigJson(Map.of("allowWaitlist", false, "allowSelfLeave", false, "projectWorkspaceId", workspace.getId()));
        LmsGroup group = groupService.create(actor, payload.getCollegeId(), request);
        group = groupService.transition(group, LmsGroup.STATUS_ACTIVE);
        workspace.setTeamGroupId(group.getId());
        workspaceRepository.saveAndFlush(workspace);

        // 3. Members through the kernel. Their project rows already exist from step 1, so the mirror
        //    finds them active and writes nothing; the group is now the record of who is on the team.
        for (Integer learnerId : new HashSet<>(team.getLearnerIds())) {
            membershipService.add(group, learnerId, LmsGroupMember.SOURCE_MANUAL, actor, "Project team");
        }

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", dto.getId());
        row.put("numericId", dto.getNumericId());
        row.put("title", dto.getTitle());
        row.put("teamGroupId", group.getId());
        row.put("learnerCount", new HashSet<>(team.getLearnerIds()).size());
        return row;
    }

    void validate(AdminProjectTeamsCreateDTO payload) {
        if (payload == null) throw new IllegalArgumentException("Team payload is required");
        if (payload.getCollegeId() == null || payload.getCollegeId() <= 0) throw new IllegalArgumentException("collegeId is required");
        if (payload.getTemplateId() == null) throw new IllegalArgumentException("A template is required");
        List<AdminProjectTeamsCreateDTO.Team> teams = payload.getTeams();
        if (teams == null || teams.isEmpty()) throw new IllegalArgumentException("Add at least one team");
        if (teams.size() > MAX_TEAMS) throw new IllegalArgumentException("At most " + MAX_TEAMS + " teams can be created at once");
        Set<Integer> seen = new HashSet<>();
        Set<String> titles = new HashSet<>();
        for (AdminProjectTeamsCreateDTO.Team team : teams) {
            if (team == null || team.getTitle() == null || team.getTitle().isBlank()) throw new IllegalArgumentException("Every team needs a title");
            if (team.getTitle().trim().length() > 160) throw new IllegalArgumentException("Team title is too long: " + team.getTitle());
            if (!titles.add(team.getTitle().trim().toLowerCase())) throw new IllegalArgumentException("Two teams have the same title: " + team.getTitle());
            List<Integer> ids = team.getLearnerIds();
            if (ids == null || ids.stream().noneMatch(Objects::nonNull)) throw new IllegalArgumentException(team.getTitle() + " has no learners");
            if (ids.size() > MAX_TEAM_SIZE) throw new IllegalArgumentException(team.getTitle() + " has more than " + MAX_TEAM_SIZE + " learners");
            for (Integer id : ids) {
                if (id == null) continue;
                if (!seen.add(id)) throw new IllegalArgumentException("A learner is in more than one team (learner " + id + ")");
            }
        }
    }

    /** The team group of a workspace, if it has one (and the group still exists). */
    public LmsGroup teamGroupOf(ProjectWorkspace workspace) {
        if (workspace == null || workspace.getTeamGroupId() == null) return null;
        return groupRepository.findById(workspace.getTeamGroupId()).orElse(null);
    }

    /**
     * Learner changes on a team workspace go through its group (the mirror updates project_member).
     * {@code replace} = the given list becomes the whole team; otherwise learners are only added.
     */
    public void applyLearnerChange(UserPrincipal principal, ProjectWorkspace workspace, LmsGroup group,
                                   List<Integer> learnerIds, boolean replace) {
        GroupActor actor = GroupActor.of(principal);
        Set<Integer> wanted = new HashSet<>();
        if (learnerIds != null) learnerIds.stream().filter(Objects::nonNull).forEach(wanted::add);
        if (replace) {
            for (LmsGroupMember m : membershipService.members(group.getId(), LmsGroupMember.STATE_ACTIVE)) {
                if (!wanted.contains(m.getMemberId())) {
                    membershipService.remove(group, m.getMemberId(), actor, "Removed from the project team", false);
                }
            }
        }
        for (Integer id : wanted) {
            membershipService.add(group, id, LmsGroupMember.SOURCE_MANUAL, actor, "Project team");
        }
    }

    public void removeLearner(UserPrincipal principal, LmsGroup group, Integer learnerId) {
        membershipService.remove(group, learnerId, GroupActor.of(principal), "Removed from the project team", false);
    }

    public int reconcile(ProjectWorkspace workspace) {
        return mirror.reconcile(workspace);
    }
}
