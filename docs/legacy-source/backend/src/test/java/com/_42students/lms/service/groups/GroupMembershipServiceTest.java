package com._42students.lms.service.groups;

import com._42students.lms.model.Learner;
import com._42students.lms.model.groups.LmsGroup;
import com._42students.lms.model.groups.LmsGroupMember;
import com._42students.lms.model.groups.LmsGroupMemberEvent;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.repository.groups.LmsGroupMemberEventRepository;
import com._42students.lms.repository.groups.LmsGroupMemberRepository;
import com._42students.lms.repository.groups.LmsGroupRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_MANUAL;
import static com._42students.lms.model.groups.LmsGroupMember.SOURCE_SELF;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_ACTIVE;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_REMOVED;
import static com._42students.lms.model.groups.LmsGroupMember.STATE_WAITLISTED;
import static com._42students.lms.model.groups.LmsGroupMember.TYPE_LEARNER;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The invariants the kernel promises: capacity is decided by the atomic seat claim alone, joins
 * are idempotent, a freed seat goes to the waitlist head, locks are respected, tenants are
 * isolated, and every change writes an event.
 */
class GroupMembershipServiceTest {

    private static final long GROUP_ID = 10L;
    private static final int COLLEGE = 6;
    private static final int LEARNER = 100;

    private final LmsGroupRepository groupRepo = mock(LmsGroupRepository.class);
    private final LmsGroupMemberRepository memberRepo = mock(LmsGroupMemberRepository.class);
    private final LmsGroupMemberEventRepository eventRepo = mock(LmsGroupMemberEventRepository.class);
    private final LearnerRepository learnerRepo = mock(LearnerRepository.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<GroupJoinPolicy> policies = mock(ObjectProvider.class);
    private final GroupActor actor = GroupActor.system();

    private GroupMembershipService service;

    @BeforeEach
    void setUp() {
        when(policies.iterator()).thenReturn(Collections.emptyIterator());
        when(memberRepo.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        when(memberRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(learnerRepo.findById(LEARNER)).thenReturn(Optional.of(learner(COLLEGE)));
        service = new GroupMembershipService(groupRepo, memberRepo, eventRepo, learnerRepo, policies, new ObjectMapper());
    }

    private static Learner learner(int collegeId) {
        Learner l = new Learner();
        l.setId(LEARNER);
        l.setCollegeId(collegeId);
        l.setIsDeleted(false);
        return l;
    }

    private static LmsGroup openGroup() {
        LmsGroup g = new LmsGroup();
        g.setId(GROUP_ID);
        g.setKind("ELECTIVE");
        g.setCollegeId(COLLEGE);
        g.setStatus(LmsGroup.STATUS_ACTIVE);
        g.setCapacity(30);
        g.setSelfJoinOpenFrom(LocalDateTime.now().minusDays(1));
        g.setSelfJoinOpenUntil(LocalDateTime.now().plusDays(1));
        return g;
    }

    private static LmsGroupMember row(String state, String source, boolean locked) {
        LmsGroupMember m = new LmsGroupMember();
        m.setId(1L);
        m.setGroupId(GROUP_ID);
        m.setMemberType(TYPE_LEARNER);
        m.setMemberId(LEARNER);
        m.setState(state);
        m.setSource(source);
        m.setIsLocked(locked);
        return m;
    }

    private void noExistingRow() {
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER)).thenReturn(Optional.empty());
    }

    private LmsGroupMemberEvent lastEvent() {
        ArgumentCaptor<LmsGroupMemberEvent> captor = ArgumentCaptor.forClass(LmsGroupMemberEvent.class);
        verify(eventRepo).save(captor.capture());
        return captor.getValue();
    }

    @Test void everyStateChangeIsPublishedForTheFeatureThatOwnsTheGroup() {
        noExistingRow();
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1);
        org.springframework.context.ApplicationEventPublisher publisher = org.mockito.Mockito.mock(org.springframework.context.ApplicationEventPublisher.class);
        service.setEventPublisher(publisher);

        service.selfJoin(openGroup(), LEARNER, actor);

        ArgumentCaptor<Object> published = ArgumentCaptor.forClass(Object.class);
        verify(publisher).publishEvent(published.capture());
        GroupMembershipChangedEvent e = (GroupMembershipChangedEvent) published.getValue();
        assertEquals(GROUP_ID, e.getGroupId());
        assertEquals(LEARNER, e.getMemberId());
        assertNull(e.getFromState());
        assertEquals(STATE_ACTIVE, e.getToState());
    }

    @Test void selfJoinTakesASeatWhenTheClaimSucceeds() {
        noExistingRow();
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1);

        LmsGroupMember m = service.selfJoin(openGroup(), LEARNER, actor);

        assertEquals(STATE_ACTIVE, m.getState());
        assertEquals(SOURCE_SELF, m.getSource());
        assertNotNull(m.getJoinedAt());
        assertNull(m.getWaitlistPosition());
        LmsGroupMemberEvent e = lastEvent();
        assertNull(e.getFromState());
        assertEquals(STATE_ACTIVE, e.getToState());
    }

    @Test void selfJoinWaitlistsWhenTheClaimFails() {
        noExistingRow();
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(0);
        when(memberRepo.maxWaitlistPosition(GROUP_ID)).thenReturn(2);

        LmsGroupMember m = service.selfJoin(openGroup(), LEARNER, actor);

        assertEquals(STATE_WAITLISTED, m.getState());
        assertEquals(3, m.getWaitlistPosition());
        assertNull(m.getJoinedAt());
    }

    @Test void fullGroupWithoutWaitlistIsRefusedAndNothingIsWritten() {
        noExistingRow();
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(0);
        LmsGroup g = openGroup();
        g.setConfigJson(Map.of("allowWaitlist", false));

        IllegalStateException e = assertThrows(IllegalStateException.class, () -> service.selfJoin(g, LEARNER, actor));

        assertEquals("Group is full", e.getMessage());
        verify(memberRepo, never()).saveAndFlush(any());
        verify(eventRepo, never()).save(any());
    }

    @Test void joiningTwiceReturnsTheExistingRowWithoutTouchingTheSeatCount() {
        LmsGroupMember existing = row(STATE_ACTIVE, SOURCE_SELF, false);
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER)).thenReturn(Optional.of(existing));

        LmsGroupMember m = service.selfJoin(openGroup(), LEARNER, actor);

        assertSame(existing, m);
        verify(groupRepo, never()).claimSeat(any());
        verify(eventRepo, never()).save(any());
    }

    @Test void selfJoinOutsideTheWindowIsRefused() {
        LmsGroup g = openGroup();
        g.setSelfJoinOpenFrom(LocalDateTime.now().plusHours(1));

        assertThrows(IllegalStateException.class, () -> service.selfJoin(g, LEARNER, actor));
        verify(groupRepo, never()).claimSeat(any());
    }

    @Test void selfJoinOnANonActiveGroupIsRefused() {
        LmsGroup g = openGroup();
        g.setStatus(LmsGroup.STATUS_DRAFT);

        assertThrows(IllegalStateException.class, () -> service.selfJoin(g, LEARNER, actor));
    }

    @Test void aLearnerFromAnotherCollegeReadsAsNotFound() {
        when(learnerRepo.findById(LEARNER)).thenReturn(Optional.of(learner(COLLEGE + 1)));

        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.selfJoin(openGroup(), LEARNER, actor));

        assertEquals("Learner not found", e.getMessage());
        verify(groupRepo, never()).claimSeat(any());
    }

    @Test void aLockedRemovalBlocksSelfRejoinButNotAnAdminAdd() {
        LmsGroupMember removed = row(STATE_REMOVED, SOURCE_SELF, true);
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER)).thenReturn(Optional.of(removed));
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1);

        assertThrows(IllegalStateException.class, () -> service.selfJoin(openGroup(), LEARNER, actor));

        LmsGroupMember m = service.add(openGroup(), LEARNER, SOURCE_MANUAL, actor, null);
        assertEquals(STATE_ACTIVE, m.getState());
        assertEquals(SOURCE_MANUAL, m.getSource());
        assertTrue(m.getIsLocked(), "the admin's lock survives the re-add");
        assertEquals(STATE_REMOVED, lastEvent().getFromState());
    }

    @Test void adminAddWorksInDraftButNotArchived() {
        noExistingRow();
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1);
        LmsGroup draft = openGroup();
        draft.setStatus(LmsGroup.STATUS_DRAFT);
        assertEquals(STATE_ACTIVE, service.add(draft, LEARNER, SOURCE_MANUAL, actor, null).getState());

        LmsGroup archived = openGroup();
        archived.setStatus(LmsGroup.STATUS_ARCHIVED);
        assertThrows(IllegalStateException.class, () -> service.add(archived, LEARNER, SOURCE_MANUAL, actor, null));
    }

    @Test void removingAnActiveMemberReleasesTheSeatAndPromotesTheWaitlistHead() {
        LmsGroupMember active = row(STATE_ACTIVE, SOURCE_SELF, false);
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER)).thenReturn(Optional.of(active));
        LmsGroupMember head = row(STATE_WAITLISTED, SOURCE_SELF, false);
        head.setId(2L);
        head.setMemberId(LEARNER + 1);
        head.setWaitlistPosition(1);
        when(memberRepo.findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(GROUP_ID, STATE_WAITLISTED)).thenReturn(Optional.of(head));
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1);

        LmsGroupMember removed = service.remove(openGroup(), LEARNER, actor, "Dropped", false);

        assertEquals(STATE_REMOVED, removed.getState());
        verify(groupRepo, times(1)).releaseSeat(GROUP_ID);
        verify(groupRepo, times(1)).claimSeat(GROUP_ID);
        assertEquals(STATE_ACTIVE, head.getState());
        assertNull(head.getWaitlistPosition());
        assertNotNull(head.getJoinedAt());
        ArgumentCaptor<LmsGroupMemberEvent> events = ArgumentCaptor.forClass(LmsGroupMemberEvent.class);
        verify(eventRepo, times(2)).save(events.capture());
        List<LmsGroupMemberEvent> all = events.getAllValues();
        assertEquals(STATE_REMOVED, all.get(0).getToState());
        assertEquals("Promoted from waitlist", all.get(1).getReason());
        assertEquals("SYSTEM", all.get(1).getActorType());
    }

    @Test void removingAWaitlistedMemberDoesNotTouchTheSeatCount() {
        LmsGroupMember waiting = row(STATE_WAITLISTED, SOURCE_SELF, false);
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER)).thenReturn(Optional.of(waiting));

        service.remove(openGroup(), LEARNER, actor, null, false);

        verify(groupRepo, never()).releaseSeat(any());
        verify(groupRepo, never()).claimSeat(any());
    }

    @Test void leaveIsRefusedWhenTheMembershipIsLocked() {
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER))
                .thenReturn(Optional.of(row(STATE_ACTIVE, SOURCE_MANUAL, true)));

        assertThrows(IllegalStateException.class, () -> service.leave(openGroup(), LEARNER, actor));
        verify(groupRepo, never()).releaseSeat(any());
    }

    @Test void leaveIsRefusedWhenTheGroupDisallowsIt() {
        when(memberRepo.findByGroupIdAndMemberTypeAndMemberId(GROUP_ID, TYPE_LEARNER, LEARNER))
                .thenReturn(Optional.of(row(STATE_ACTIVE, SOURCE_SELF, false)));
        LmsGroup g = openGroup();
        g.setConfigJson(Map.of("allowSelfLeave", false));

        assertThrows(IllegalStateException.class, () -> service.leave(g, LEARNER, actor));
    }

    @Test void leaveIsRefusedOnAnArchivedGroupEvenIfSelfLeaveWouldOtherwiseBeAllowed() {
        LmsGroup archived = openGroup();
        archived.setStatus(LmsGroup.STATUS_ARCHIVED);

        IllegalStateException e = assertThrows(IllegalStateException.class, () -> service.leave(archived, LEARNER, actor));

        assertEquals("Group is archived", e.getMessage());
        verify(memberRepo, never()).findByGroupIdAndMemberTypeAndMemberId(any(), any(), any());
    }

    @Test void promoteWhileSeatsAvailablePromotesEveryoneThatNowFitsInWaitlistOrder() {
        LmsGroupMember first = row(STATE_WAITLISTED, SOURCE_SELF, false);
        first.setId(2L); first.setMemberId(LEARNER + 1); first.setWaitlistPosition(1);
        LmsGroupMember second = row(STATE_WAITLISTED, SOURCE_SELF, false);
        second.setId(3L); second.setMemberId(LEARNER + 2); second.setWaitlistPosition(2);
        // Three seats open up (claimSeat succeeds twice), only two people are waitlisted.
        when(memberRepo.findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(GROUP_ID, STATE_WAITLISTED))
                .thenReturn(Optional.of(first), Optional.of(second), Optional.empty());
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(1, 1, 1);

        int promoted = service.promoteWhileSeatsAvailable(openGroup());

        assertEquals(2, promoted);
        assertEquals(STATE_ACTIVE, first.getState());
        assertEquals(STATE_ACTIVE, second.getState());
        verify(groupRepo, times(2)).claimSeat(GROUP_ID);
    }

    @Test void promoteWhileSeatsAvailableStopsAsSoonAsASeatClaimFails() {
        LmsGroupMember first = row(STATE_WAITLISTED, SOURCE_SELF, false);
        first.setId(2L); first.setMemberId(LEARNER + 1); first.setWaitlistPosition(1);
        when(memberRepo.findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(GROUP_ID, STATE_WAITLISTED))
                .thenReturn(Optional.of(first));
        when(groupRepo.claimSeat(GROUP_ID)).thenReturn(0); // no seat actually free (stale count)

        int promoted = service.promoteWhileSeatsAvailable(openGroup());

        assertEquals(0, promoted);
        assertEquals(STATE_WAITLISTED, first.getState());
    }

    @Test void promoteWhileSeatsAvailableIsANoOpWithNoWaitlist() {
        when(memberRepo.findFirstByGroupIdAndStateOrderByWaitlistPositionAscCreatedAtAsc(GROUP_ID, STATE_WAITLISTED))
                .thenReturn(Optional.empty());

        assertEquals(0, service.promoteWhileSeatsAvailable(openGroup()));
        verify(groupRepo, never()).claimSeat(any());
    }

    @Test void selfJoinWindowHelper() {
        LmsGroup g = new LmsGroup();
        LocalDateTime now = LocalDateTime.of(2026, 8, 5, 10, 0);
        assertTrue(!GroupMembershipService.isSelfJoinOpen(g, now), "no window = closed");
        g.setSelfJoinOpenFrom(now.minusDays(1));
        assertTrue(GroupMembershipService.isSelfJoinOpen(g, now), "open-ended window");
        g.setSelfJoinOpenUntil(now.minusHours(1));
        assertTrue(!GroupMembershipService.isSelfJoinOpen(g, now), "past until");
    }
}
