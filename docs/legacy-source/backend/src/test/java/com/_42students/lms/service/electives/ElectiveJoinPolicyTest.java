package com._42students.lms.service.electives;

import com._42students.lms.model.electives.ElectiveOffering;
import com._42students.lms.model.electives.ElectiveSlot;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.repository.electives.ElectiveOfferingRepository;
import com._42students.lms.repository.electives.ElectiveSlotRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** The slot rule: one learner holds at most slot.maxPick offerings of a slot; archived offerings take nobody. */
class ElectiveJoinPolicyTest {

    private final ElectiveOfferingRepository offeringRepo = mock(ElectiveOfferingRepository.class);
    private final ElectiveSlotRepository slotRepo = mock(ElectiveSlotRepository.class);
    private final LmsGroupMemberRepository memberRepo = mock(LmsGroupMemberRepository.class);
    private final ElectiveJoinPolicy policy = new ElectiveJoinPolicy(offeringRepo, slotRepo, memberRepo);

    private static LmsGroup group(long id, String kind) {
        LmsGroup g = new LmsGroup();
        g.setId(id);
        g.setKind(kind);
        return g;
    }

    private static ElectiveOffering offering(long id, long slotId, long groupId, String status) {
        ElectiveOffering o = new ElectiveOffering();
        o.setId(id);
        o.setSlotId(slotId);
        o.setGroupId(groupId);
        o.setStatus(status);
        return o;
    }

    private static LmsGroupMember member(long groupId, String state) {
        LmsGroupMember m = new LmsGroupMember();
        m.setGroupId(groupId);
        m.setState(state);
        return m;
    }

    private void slotWith(int maxPick, ElectiveOffering... offerings) {
        ElectiveSlot slot = new ElectiveSlot();
        slot.setId(5L);
        slot.setName("PE-1");
        slot.setMaxPick(maxPick);
        slot.setStatus(ElectiveSlot.STATUS_ACTIVE);
        when(slotRepo.findByIdAndIsDeletedFalse(5L)).thenReturn(Optional.of(slot));
        when(offeringRepo.findBySlotIdAndIsDeletedFalseOrderByIdAsc(5L)).thenReturn(List.of(offerings));
    }

    @Test void onlyElectiveGroupsAreSupported() {
        assertTrue(policy.supports(group(1, "ELECTIVE")));
        assertFalse(policy.supports(group(1, "CRT")));
        assertFalse(policy.supports(null));
    }

    @Test void aGroupWithoutAnOfferingCarriesNoRule() {
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }

    @Test void archivedOfferingRefusesJoins() {
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(offering(10, 5, 1, ElectiveOffering.STATUS_ARCHIVED)));
        assertThrows(IllegalStateException.class, () -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }

    @Test void secondOfferingInTheSameSlotIsRefusedWhenMaxPickIsOne() {
        ElectiveOffering mine = offering(10, 5, 1, ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering sibling = offering(11, 5, 2, ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mine));
        slotWith(1, mine, sibling);
        when(memberRepo.findByMemberInGroups(anyString(), anyInt(), any())).thenReturn(List.of(member(2, LmsGroupMember.STATE_ACTIVE)));

        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
        assertTrue(e.getMessage().contains("PE-1"));
    }

    @Test void waitlistedSeatsCountTowardsThePickLimit() {
        ElectiveOffering mine = offering(10, 5, 1, ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering sibling = offering(11, 5, 2, ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mine));
        slotWith(1, mine, sibling);
        when(memberRepo.findByMemberInGroups(anyString(), anyInt(), any())).thenReturn(List.of(member(2, LmsGroupMember.STATE_WAITLISTED)));

        assertThrows(IllegalStateException.class, () -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }

    @Test void removedSiblingMembershipsDoNotCount() {
        ElectiveOffering mine = offering(10, 5, 1, ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering sibling = offering(11, 5, 2, ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mine));
        slotWith(1, mine, sibling);
        when(memberRepo.findByMemberInGroups(anyString(), anyInt(), any())).thenReturn(List.of(member(2, LmsGroupMember.STATE_REMOVED)));

        assertDoesNotThrow(() -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }

    @Test void archivedSiblingMembershipDoesNotConsumePickAllowance() {
        ElectiveOffering mine = offering(10, 5, 1, ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering archivedSibling = offering(11, 5, 2, ElectiveOffering.STATUS_ARCHIVED);
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mine));
        slotWith(1, mine, archivedSibling);

        assertDoesNotThrow(() -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }

    @Test void maxPickTwoAllowsASecondOffering() {
        ElectiveOffering mine = offering(10, 5, 1, ElectiveOffering.STATUS_ACTIVE);
        ElectiveOffering sibling = offering(11, 5, 2, ElectiveOffering.STATUS_ACTIVE);
        when(offeringRepo.findByGroupIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(mine));
        slotWith(2, mine, sibling);
        when(memberRepo.findByMemberInGroups(anyString(), anyInt(), any())).thenReturn(List.of(member(2, LmsGroupMember.STATE_ACTIVE)));

        assertDoesNotThrow(() -> policy.beforeJoin(group(1, "ELECTIVE"), "LEARNER", 100, "MANUAL"));
    }
}
