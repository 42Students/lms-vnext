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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProjectTeamMirrorTest {

    private ProjectWorkspaceRepository workspaces;
    private ProjectMemberRepository members;
    private GroupMembershipService membership;
    private ProjectTeamMirror mirror;

    @BeforeEach
    void setUp() {
        workspaces = mock(ProjectWorkspaceRepository.class);
        members = mock(ProjectMemberRepository.class);
        LearnerRepository learners = mock(LearnerRepository.class);
        membership = mock(GroupMembershipService.class);
        Learner asha = new Learner();
        asha.setId(7);
        asha.setFirstName("Asha");
        asha.setLastName("Rao");
        when(learners.findById(7)).thenReturn(Optional.of(asha));
        mirror = new ProjectTeamMirror(workspaces, members, learners, membership);
    }

    private static ProjectWorkspace workspace(int id, Long groupId) {
        ProjectWorkspace w = new ProjectWorkspace();
        w.setId(id);
        w.setTeamGroupId(groupId);
        return w;
    }

    private static ProjectMember row(int projectId, int learnerId, boolean deleted) {
        ProjectMember m = new ProjectMember();
        m.setProjectId(projectId);
        m.setUserId(learnerId);
        m.setUserType("LEARNER");
        m.setRoleLabel("Frontend lead");
        m.setIsDeleted(deleted);
        return m;
    }

    @Test
    void joiningTheTeamGroupCreatesTheProjectRow() {
        when(workspaces.findActiveByTeamGroupId(55L)).thenReturn(List.of(workspace(10, 55L)));
        when(members.findByProjectAndUserAndType(10, 7, "LEARNER")).thenReturn(Optional.empty());

        mirror.onMembershipChanged(new GroupMembershipChangedEvent(55L, "LEARNER", 7, null, LmsGroupMember.STATE_ACTIVE));

        ArgumentCaptor<ProjectMember> saved = ArgumentCaptor.forClass(ProjectMember.class);
        verify(members).save(saved.capture());
        assertEquals(10, saved.getValue().getProjectId());
        assertEquals("Asha Rao", saved.getValue().getDisplayName());
        assertEquals("Project Contributor", saved.getValue().getRoleLabel());
        assertFalse(saved.getValue().getIsDeleted());
    }

    @Test
    void rejoiningRevivesTheOldRowAndKeepsItsRole() {
        ProjectMember old = row(10, 7, true);
        when(workspaces.findActiveByTeamGroupId(55L)).thenReturn(List.of(workspace(10, 55L)));
        when(members.findByProjectAndUserAndType(10, 7, "LEARNER")).thenReturn(Optional.of(old));

        mirror.onMembershipChanged(new GroupMembershipChangedEvent(55L, "LEARNER", 7, "REMOVED", "ACTIVE"));

        verify(members).save(old);
        assertFalse(old.getIsDeleted());
        assertEquals("Frontend lead", old.getRoleLabel());
    }

    @Test
    void leavingTheGroupSoftDeletesTheRow() {
        ProjectMember current = row(10, 7, false);
        when(workspaces.findActiveByTeamGroupId(55L)).thenReturn(List.of(workspace(10, 55L)));
        when(members.findByProjectAndUserAndType(10, 7, "LEARNER")).thenReturn(Optional.of(current));

        mirror.onMembershipChanged(new GroupMembershipChangedEvent(55L, "LEARNER", 7, "ACTIVE", "REMOVED"));

        verify(members).save(current);
        assertTrue(current.getIsDeleted());
    }

    @Test
    void waitlistedIsNotOnTheTeam() {
        when(workspaces.findActiveByTeamGroupId(55L)).thenReturn(List.of(workspace(10, 55L)));
        when(members.findByProjectAndUserAndType(10, 7, "LEARNER")).thenReturn(Optional.empty());

        mirror.onMembershipChanged(new GroupMembershipChangedEvent(55L, "LEARNER", 7, null, "WAITLISTED"));

        verify(members, never()).save(any());
    }

    @Test
    void aGroupNoWorkspacePointsAtChangesNothing() {
        when(workspaces.findActiveByTeamGroupId(99L)).thenReturn(List.of());

        mirror.onMembershipChanged(new GroupMembershipChangedEvent(99L, "LEARNER", 7, null, "ACTIVE"));

        verify(members, never()).findByProjectAndUserAndType(anyInt(), anyInt(), anyString());
        verify(members, never()).save(any());
    }

    @Test
    void reconcileAddsMissingAndRemovesExtraRows() {
        ProjectWorkspace w = workspace(10, 55L);
        LmsGroupMember inGroup = new LmsGroupMember();
        inGroup.setMemberType("LEARNER");
        inGroup.setMemberId(7);
        when(membership.members(55L, "ACTIVE")).thenReturn(List.of(inGroup));
        ProjectMember extra = row(10, 8, false);
        when(members.findActiveByProjectId(10)).thenReturn(List.of(extra));
        when(members.findByProjectAndUserAndType(10, 7, "LEARNER")).thenReturn(Optional.empty());
        when(members.findByProjectAndUserAndType(10, 8, "LEARNER")).thenReturn(Optional.of(extra));

        int changed = mirror.reconcile(w);

        assertEquals(2, changed);
        assertTrue(extra.getIsDeleted());
        verify(members, times(2)).save(any());
    }

    @Test
    void reconcileOnAWorkspaceWithoutATeamIsANoOp() {
        assertEquals(0, mirror.reconcile(workspace(10, null)));
        verify(membership, never()).members(anyLong(), eq("ACTIVE"));
    }
}
