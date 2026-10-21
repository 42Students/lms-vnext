package com._42students.lms.controller.groups;

import com._42students.lms.dto.groups.GroupUpsertRequest;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.groups.GroupAccessGuard;
import com._42students.lms.service.groups.GroupMembershipService;
import com._42students.lms.service.groups.GroupRuleService;
import com._42students.lms.service.groups.GroupService;
import com._42students.lms.service.groups.GroupViewAssembler;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminGroupManagedKindBoundaryTest {

    private final SecurityContextUtil security = mock(SecurityContextUtil.class);
    private final GroupAccessGuard guard = mock(GroupAccessGuard.class);
    private final GroupService groupService = mock(GroupService.class);
    private final GroupMembershipService membership = mock(GroupMembershipService.class);
    private final GroupRuleService rules = mock(GroupRuleService.class);
    private final GroupViewAssembler assembler = mock(GroupViewAssembler.class);
    private final AdminGroupController controller =
            new AdminGroupController(security, guard, groupService, membership, rules, assembler);

    @Test
    void genericGroupsCannotCreateElectiveKind() {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(guard.manageableCollege(principal)).thenReturn(6);
        GroupUpsertRequest request = new GroupUpsertRequest();
        request.setKind("ELECTIVE");
        request.setName("Bypass");

        assertThrows(IllegalArgumentException.class, () -> controller.create(request));
        verify(groupService, never()).create(any(), anyInt(), any());
    }

    @Test
    void genericGroupsCannotMutateAnElectiveOwnedGroup() {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        LmsGroup elective = new LmsGroup();
        elective.setId(10L);
        elective.setKind("ELECTIVE");
        elective.setStatus(LmsGroup.STATUS_ACTIVE);
        when(guard.requireManageable(principal, 10L)).thenReturn(elective);

        assertThrows(IllegalStateException.class,
                () -> controller.status(10L, LmsGroup.STATUS_ARCHIVED));
        verify(groupService, never()).transition(any(), any());
    }

    @Test
    void defaultGenericListHidesFeatureManagedElectiveGroups() {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(principal);
        when(guard.manageableCollege(principal)).thenReturn(6);

        LmsGroup elective = new LmsGroup();
        elective.setId(10L);
        elective.setKind("ELECTIVE");
        elective.setName("Managed elective");
        elective.setStatus(LmsGroup.STATUS_ACTIVE);

        LmsGroup crt = new LmsGroup();
        crt.setId(11L);
        crt.setKind("CRT");
        crt.setName("CRT A");
        crt.setStatus(LmsGroup.STATUS_ACTIVE);

        when(groupService.list(6, null, null)).thenReturn(List.of(elective, crt));

        assertEquals(1, controller.list(null, null).getBody().size());
        assertEquals("CRT", controller.list(null, null).getBody().get(0).getKind());
    }
}
